# Refugee Movement Prediction System — Prototype v1

A full-stack ML-powered dashboard for predicting and visualizing refugee displacement into India from neighboring countries.

## Project Structure

```
v1/
├── backend/                    # Flask ML prediction server
│   ├── app.py                  # API server (endpoints: /api/predict, /api/predict-all, /api/news)
│   ├── time_model.pkl          # Random Forest model — refugee count prediction
│   ├── resource_model.pkl      # Random Forest model — resource needs (food, shelter, medical, water)
│   ├── encoder.pkl             # Label encoder for country mapping
│   ├── origin_mapping.json     # Country name → encoded value mapping
│   └── requirements.txt        # Python dependencies
│
├── refugee-frontend/           # React + Vite dashboard
│   ├── src/
│   │   ├── pages/              # Dashboard, Predictions, ResourcePlan, Analysis
│   │   ├── components/         # TopNavBar, Sidebar, etc.
│   │   └── data/               # undata.json (UNHCR historical), countryOutlines.ts
│   ├── vite.config.ts          # Dev proxy to Flask backend
│   └── package.json
│
├── externaldatabase/           # Raw UN data export (XML)
├── start.ps1                   # Launch both servers with one command
└── .gitignore
```

## Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm

### 1. Install dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../refugee-frontend
npm install
```

### 2. Launch (one command)

```powershell
.\start.ps1
```

Or manually in two terminals:

```bash
# Terminal 1 — Backend
cd backend && python app.py

# Terminal 2 — Frontend
cd refugee-frontend && npm run dev
```

### 3. Open
- **Dashboard:** http://localhost:5173
- **API:** http://localhost:5000/api/predict-all?year=2026

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict?country=Afghanistan&year=2026` | GET | Single country prediction |
| `/api/predict-all?year=2026` | GET | All countries, sorted by refugee count |
| `/api/countries` | GET | List of available countries |
| `/api/news` | GET | Live humanitarian news (GDELT + UN News RSS) |

## Data Sources
- **UNHCR Population Statistics** (1981–2026) — historical refugee data
- **Random Forest ML Models** — trained on 65 origin countries
- **GDELT / UN News RSS** — live humanitarian news feed

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Recharts, Leaflet
- **Backend:** Flask, scikit-learn, pandas, joblib
- **ML Models:** Random Forest (time-series + multi-output resource prediction)

## Team
- **Kiran** — ML model development & training
- **Shashank** — Full-stack integration & dashboard UI
