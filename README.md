# 🌍 Refugee Movement Prediction System

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![ML](https://img.shields.io/badge/Machine%20Learning-FF6F00?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

An advanced, full-stack machine learning dashboard designed to predict and visualize refugee displacement patterns. This system focuses on movement into India from neighboring regions, providing data-driven insights for humanitarian resource planning.

---

## 🚀 Core Features

- **🔮 Displacement Prediction:** Predicts refugee counts up to 2026 using Random Forest regression models.
- **📦 Resource Planning:** Automatically calculates essential needs (Food, Shelter, Medical, Water) based on predicted arrivals.
- **📊 Real-time Analysis:** Interactive charts showing Year-over-Year totals and country-specific trends.
- **📰 Humanitarian Feed:** Live news integration from GDELT and UN News RSS for situational awareness.
- **🗺️ Geospatial Visualization:** Interactive map showing origin countries and displacement scales.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Vanilla CSS / Modern UI components
- **Charts:** Recharts
- **Maps:** Leaflet & SVG Outlines

### Backend
- **Server:** Flask (Python)
- **Data Handling:** Pandas, NumPy
- **ML Models:** Scikit-learn (Random Forest)
- **Serialization:** Joblib

---

## 📂 Project Structure

```text
v1/
├── backend/                    # Flask ML prediction server
│   ├── app.py                  # Main API server
│   ├── time_model.pkl          # Refugee count prediction model
│   ├── resource_model.pkl      # Resource needs prediction model
│   └── requirements.txt        # Python dependencies
├── refugee-frontend/           # React + Vite dashboard
│   ├── src/                    # Components, Pages, and Data
│   └── package.json            # Node.js dependencies
├── start.ps1                   # Unified launch script
└── requirements.txt            # Root-level Python dependencies
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**

### 2. Clone and Navigate
```bash
git clone <repository-url>
cd v1
```

### 3. Install Dependencies

**Backend:**
```bash
# Recommended: use a virtual environment
cd backend
pip install -r requirements.txt
cd ..
```

**Frontend:**
```bash
cd refugee-frontend
npm install
cd ..
```

---

## 🏃 Running the Application

### Option A: Unified Launch (Windows)
Run the PowerShell script to start both servers simultaneously:
```powershell
.\start.ps1
```

### Option B: Manual Launch

**Terminal 1 (Backend):**
```bash
cd backend
python app.py
```

**Terminal 2 (Frontend):**
```bash
cd refugee-frontend
npm run dev
```

The dashboard will be available at **[http://localhost:5173](http://localhost:5173)**.

---

## 👥 Team Members

| Member | Role |
| :--- | :--- |
| **Shashank Pradhan** | Frontend and Full-Stack Integration |
| **Kiran Vishwakarma** | ML Training |
| **Jasleen Kaur** | Documentation and Research Paper |
| **Rani Pari Gupta** | Documentation and Research Paper |

---

## 📄 License
*This project is for humanitarian research and academic purposes.*
