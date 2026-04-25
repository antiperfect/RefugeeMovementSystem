from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import json
import os
import requests as http_requests

app = Flask(__name__)
CORS(app)

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
    results = []

    for country in mapping.keys():
        result = predict_for_country(country, year)
        if result:
            results.append(result)

    # Sort by refugee count descending
    results.sort(key=lambda x: x['refugees'], reverse=True)
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
    app.run(debug=True, port=5000)