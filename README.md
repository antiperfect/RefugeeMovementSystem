# 🌍 Refugee Movement Prediction System

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/react-v19.0.0-blue) ![Python](https://img.shields.io/badge/python-v3.10-yellow) ![Machine Learning](https://img.shields.io/badge/scikit--learn-orange) ![Flask](https://img.shields.io/badge/flask-%23000.svg?logo=flask&logoColor=white)

An advanced, full-stack machine learning dashboard designed to predict and visualize refugee displacement patterns. This system focuses on movement into India from neighboring regions, providing data-driven insights for humanitarian resource planning.

**[Try the Live Webapp](https://refugee-movement-system.vercel.app/)**

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
| **Kiran Vishwakarma** | Backend Architecture and ML Training |
| **Jasleen Kaur** | Documentation and Research Paper |
| **Rani Pari Gupta** | Research Paper |

---

## 📄 License
*This project is for humanitarian research and academic purposes.*
