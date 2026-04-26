from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import json
import os
import requests as http_requests
import numpy as np
import warnings
from flask_compress import Compress

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)
Compress(app)

# Load models
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

time_model = joblib.load(os.path.join(BASE_DIR, 'time_model.pkl'))
resource_model = joblib.load(os.path.join(BASE_DIR, 'resource_model.pkl'))

# Load mapping
with open(os.path.join(BASE_DIR, 'origin_mapping.json')) as f:
    mapping = json.load(f)

# Load historical data for lags
DATA_PATH = os.path.join(BASE_DIR, 'data', 'persons_of_concern.csv')
historical_df = pd.read_csv(DATA_PATH)
historical_df['Total_Refugees'] = historical_df['Refugees'] + historical_df['Asylum-seekers']

# India's neighboring / nearby countries (subset for highlight)
NEIGHBORS = [
    'Afghanistan', 'Bangladesh', 'China', 'Myanmar',
    'Pakistan', 'Sri Lanka', 'Nepal', 'Bhutan'
]

# Global storage for precomputed data
MASTER_CACHE = {
    'predictions': {}, # year -> { country -> results }
    'series': {}      # country_or_all -> series
}

CACHE_FILE = os.path.join(BASE_DIR, 'precomputed_cache.json')

def load_precomputed_cache():
    """Load cache from disk if available."""
    global MASTER_CACHE
    if os.path.exists(CACHE_FILE):
        try:
            print("Loading precomputed cache from disk...", flush=True)
            with open(CACHE_FILE, 'r') as f:
                MASTER_CACHE = json.load(f)
            return True
        except Exception as e:
            print(f"Error loading cache: {e}", flush=True)
    return False

def save_precomputed_cache():
    """Save master cache to disk."""
    try:
        print("Saving precomputed cache to disk...", flush=True)
        with open(CACHE_FILE, 'w') as f:
            json.dump(MASTER_CACHE, f)
    except Exception as e:
        print(f"Error saving cache: {e}", flush=True)

def precompute_all_data():
    """Build the entire prediction and series matrix in one fast pass."""
    if load_precomputed_cache():
        return

    print("Precomputing all Displacement Data (2000-2030)...", flush=True)
    MAX_HIST_YEAR = int(historical_df['Year'].max())
    
    # country -> year -> total
    full_matrix = {}
    
    for country in mapping.keys():
        c_df = historical_df[historical_df['Country of Origin'] == country].sort_values('Year')
        if c_df.empty: continue
        
        country_data = {} # year -> total
        
        # Fill historical
        for _, row in c_df.iterrows():
            y = int(row['Year'])
            if y >= 2000:
                country_data[y] = int(row['Total_Refugees'])
        
        # Iterative Prediction Loop (Optimized with Numpy)
        last_y = int(c_df.iloc[-1]['Year'])
        lag_1 = float(c_df.iloc[-1]['Total_Refugees'])
        lag_2 = float(c_df.iloc[-2]['Total_Refugees'] if len(c_df) > 1 else lag_1)
        
        if np.isnan(lag_1): lag_1 = 0
        if np.isnan(lag_2): lag_2 = 0
        
        origin_encoded = mapping[country]
        curr_y = last_y + 1
        
        while curr_y <= 2030:
            # Use raw numpy array for speed (avoid DataFrame overhead)
            # Feature order: Year, Origin_Encoded, Lag_1, Lag_2
            features = np.array([[float(curr_y), float(origin_encoded), lag_1, lag_2]])
            pred = max(0, int(time_model.predict(features)[0]))
            
            country_data[curr_y] = pred
            lag_2, lag_1 = lag_1, pred
            curr_y += 1
            
        full_matrix[country] = country_data

    # Generate SERIES_CACHE
    # All Origins
    all_series = []
    for year in range(2000, 2031):
        year_sum = sum(full_matrix[c].get(year, 0) for c in full_matrix)
        if year_sum > 0 or year <= MAX_HIST_YEAR:
            all_series.append({'x': year, 'y': year_sum})
    MASTER_CACHE['series']['all'] = all_series
    
    # Individual Countries
    for country, data in full_matrix.items():
        s = [{'x': y, 'y': val} for y, val in sorted(data.items()) if y >= 2000]
        MASTER_CACHE['series'][country] = s

    # Generate PREDICTIONS_CACHE (year -> results_list)
    for year in range(2026, 2031):
        year_results = []
        for country in mapping.keys():
            if country not in full_matrix: continue
            
            # Use the time model result from matrix
            refugees = full_matrix[country].get(year, 0)
            
            # Resource Model (only if needed for predictions)
            # Feature order: Year, Origin_Encoded, Total_Refugees, Refugee_Growth
            res_features = np.array([[float(year), float(mapping[country]), float(refugees), 0.1]])
            res_pred = resource_model.predict(res_features)[0]
            
            year_results.append({
                'country': country,
                'year': year,
                'refugees': int(refugees),
                'food': int(res_pred[0]),
                'shelter': int(res_pred[1]),
                'medical': int(res_pred[2]),
                'water': int(res_pred[3]),
                'is_neighbor': country in NEIGHBORS
            })
        MASTER_CACHE['predictions'][str(year)] = year_results

    save_precomputed_cache()
    print("Precomputation complete.", flush=True)

def predict_for_country(country, year):
    """Run both models for a single country+year and return dict."""
    if country not in mapping:
        return None

    origin_encoded = mapping[country]

    # Filter historical data for this country
    country_df = historical_df[historical_df['Country of Origin'] == country].sort_values('Year')
    
    if country_df.empty:
        return None

    # ---------------- TIME MODEL (Iterative Lags) ----------------
    # If year is in the past or present data
    if year <= country_df.iloc[-1]['Year']:
        row = country_df[country_df['Year'] == year]
        if not row.empty:
            refugees = int(row['Total_Refugees'].values[0])
        else:
            # Default to last known value if specific year missing from history
            refugees = int(country_df.iloc[-1]['Total_Refugees'])
    
    # If year is in the future
    else:
        lag_1 = country_df.iloc[-1]['Total_Refugees']
        lag_2 = country_df.iloc[-2]['Total_Refugees'] if len(country_df) > 1 else lag_1
        
        if pd.isna(lag_1): lag_1 = 0
        if pd.isna(lag_2): lag_2 = 0
        
        current_year = country_df.iloc[-1]['Year'] + 1
        refugees = lag_1 # fallback

        while current_year <= year:
            input_df = pd.DataFrame({
                'Year': [current_year],
                'Origin_Encoded': [origin_encoded],
                'Lag_1': [lag_1],
                'Lag_2': [lag_2]
            })
            
            pred = int(time_model.predict(input_df)[0])
            pred = max(0, pred)
            
            lag_2 = lag_1
            lag_1 = pred
            refugees = pred
            current_year += 1

    # ---------------- RESOURCE MODEL ----------------
    growth = 0.1  # baseline assumption
    input_data = pd.DataFrame({
        'Year': [year],
        'Origin_Encoded': [origin_encoded],
        'Total_Refugees': [refugees],
        'Refugee_Growth': [growth]
    })
    pred = resource_model.predict(input_data)

    return {
        'country': country,
        'year': year,
        'refugees': refugees,
        'food': max(0, int(pred[0][0])),
        'shelter': max(0, int(pred[0][1])),
        'medical': max(0, int(pred[0][2])),
        'water': max(0, int(pred[0][3])),
        'is_neighbor': country in NEIGHBORS
    }


# ================== HTML ROUTES (original) ==================

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "Refugee Movement Prediction API is running",
        "version": "1.0.0"
    })

@app.route('/predict', methods=['POST'])
def predict():
    year = int(request.form['year'])
    country = request.form['country']
    result = predict_for_country(country, year)

    if result is None:
        return "Country not found", 404

    return render_template('result.html',
                           refugees=result['refugees'],
                           food=result['food'],
                           shelter=result['shelter'],
                           medical=result['medical'],
                           water=result['water'],
                           country=country,
                           year=year)


# ================== JSON API ROUTES (for React frontend) ==================

@app.route('/api/predict', methods=['GET'])
def api_predict():
    """Single country prediction.
    GET /api/predict?country=Afghanistan&year=2026
    """
    country = request.args.get('country')
    year = request.args.get('year', 2026, type=int)

    if not country or country not in mapping:
        return jsonify({'error': 'Invalid country'}), 400

    result = predict_for_country(country, year)
    return jsonify(result)


@app.route('/api/predict-all', methods=['GET'])
def api_predict_all():
    """Predict for ALL countries in the model.
    GET /api/predict-all?year=2026
    Returns array of predictions sorted by refugee count descending.
    """
    year = request.args.get('year', 2026, type=int)
    year_str = str(year)
    
    # Check Master Cache
    if year_str in MASTER_CACHE['predictions']:
        results = MASTER_CACHE['predictions'][year_str]
    else:
        # On-demand calculation (cached for future)
        print(f"On-demand calculation for {year}...", flush=True)
        results = []
        for country in mapping.keys():
            result = predict_for_country(country, year)
            if result:
                results.append(result)
        results.sort(key=lambda x: x['refugees'], reverse=True)
        MASTER_CACHE['predictions'][year_str] = results

    return jsonify(results)


@app.route('/api/countries', methods=['GET'])
def api_countries():
    """Return list of all available countries."""
    countries = list(mapping.keys())
    countries.sort()
    return jsonify({
        'countries': countries,
        'neighbors': [c for c in NEIGHBORS if c in mapping],
        'total': len(countries)
    })


@app.route('/api/series', methods=['GET'])
def api_series():
    """Return combined historical and predicted series (2000-2030).
    GET /api/series?country=Afghanistan
    If no country provided, returns sum of all countries.
    """
    country = request.args.get('country')
    
    if not country:
        return jsonify(MASTER_CACHE['series'].get('all', []))
    
    if country in MASTER_CACHE['series']:
        return jsonify(MASTER_CACHE['series'][country])
        
    # Fallback/On-demand for unknown country
    if country not in mapping:
        return jsonify({'error': 'Country not found'}), 404
        
    # Logic for individual country not in cache (rare)
    result = predict_for_country(country, 2030) # triggers iterative loop
    # Re-calculate series for this country
    c_df = historical_df[historical_df['Country of Origin'] == country].sort_values('Year')
    series = []
    for _, row in c_df.iterrows():
        y = int(row['Year'])
        if y >= 2000: series.append({'x': y, 'y': int(row['Total_Refugees'])})
    
    # Add predictions
    last_y = series[-1]['x'] if series else 1999
    # (Simplified iterative logic for fallback)
    # ... but MASTER_CACHE should have all mapped countries anyway.
    return jsonify(series)


@app.route('/api/news', methods=['GET'])
def api_news():
    """Fetch humanitarian news — tries GDELT first, then UN News RSS fallback."""
    # Try GDELT
    try:
        gdelt_url = 'https://api.gdeltproject.org/api/v2/doc/doc'
        params = {
            'query': 'refugee displacement India humanitarian',
            'mode': 'ArtList',
            'format': 'json',
            'maxrecords': 15,
            'sort': 'DateDesc'
        }
        resp = http_requests.get(gdelt_url, params=params, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            if 'articles' in data and len(data['articles']) > 0:
                articles = []
                for art in data['articles'][:15]:
                    articles.append({
                        'title': art.get('title', 'Untitled'),
                        'url': art.get('url', '#'),
                        'seendate': art.get('seendate', ''),
                        'domain': art.get('domain', 'News'),
                    })
                return jsonify({'articles': articles, 'source': 'GDELT'})
    except Exception:
        pass  # Fall through to RSS fallback

    # Fallback: UN News RSS feed (refugee/migration topic)
    try:
        import xml.etree.ElementTree as ET
        rss_url = 'https://news.un.org/feed/subscribe/en/news/topic/migrants-and-refugees/feed/rss.xml'
        resp = http_requests.get(rss_url, timeout=10)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            articles = []
            for item in root.findall('.//item')[:15]:
                title = item.find('title')
                link = item.find('link')
                pubdate = item.find('pubDate')
                articles.append({
                    'title': title.text if title is not None else 'Untitled',
                    'url': link.text if link is not None else '#',
                    'seendate': pubdate.text if pubdate is not None else '',
                    'domain': 'UN News',
                })
            if articles:
                return jsonify({'articles': articles, 'source': 'UN News RSS'})
    except Exception:
        pass

    return jsonify({'articles': [], 'source': 'none', 'error': 'All news sources unavailable'})


# ================== RUN ==================
if __name__ == '__main__':
    # Build or Load the optimization cache
    precompute_all_data()
    app.run(debug=False, port=5000)