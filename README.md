# MediBook — Disease Prediction Using Machine Learning
> **Final Year Project | Phase 1: Web Application**
> Full-Stack MERN + Flask (Python) + MySQL

![MediBook](https://img.shields.io/badge/Stack-MERN%20%2B%20Flask-6366f1?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)
![Status](https://img.shields.io/badge/Status-Phase%201%20Complete-emerald?style=flat-square)

---

## 📋 Project Overview

**MediBook** is an AI-powered web platform that allows users to select their current symptoms and receive instant preliminary disease predictions using Machine Learning (Random Forest). The platform provides health precautions and stores prediction history for authenticated users.

### Problem Statement
Traditional medical diagnosis is expensive, time-consuming, and inaccessible to many. There is a lack of instant, symptom-based preliminary health insight for the general public.

### Solution
A web application where users select symptoms from a curated catalogue of 130+ symptoms, and a trained ML model (Random Forest / Decision Tree / Naïve Bayes) provides an instant preliminary disease prediction along with actionable health precautions.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│         REACT FRONTEND  :5173            │
│   Auth | Dashboard | Results | History   │
└──────────────────┬───────────────────────┘
                   │ HTTP + JWT
┌──────────────────▼───────────────────────┐
│      NODE.JS / EXPRESS API  :5000        │
│  /api/auth   /api/diagnose  /api/history │
└──────┬───────────────────────────────────┘
       │ mysql2              │ axios
┌──────▼──────┐    ┌─────────▼──────────────┐
│  MySQL :3306│    │  FLASK ML SERVICE :5001 │
│  medibook DB│    │  POST /predict          │
└─────────────┘    └────────────────────────┘
```

---

## 📁 Project Structure

```
medibook/
├── database/
│   └── schema.sql               # MySQL DDL + symptom seed data
├── backend/                     # Node.js / Express REST API
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js             # MySQL connection pool
│   ├── middleware/authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── diagnoseRoutes.js
│   └── controllers/
│       ├── authController.js
│       └── diagnoseController.js
├── ml_service/                  # Flask Python ML API
│   ├── app.py
│   ├── requirements.txt
│   ├── .env.example
│   └── model/
│       ├── train_stub.py        # Training script (run once)
│       └── model.pkl            # Generated after training
└── frontend/                    # React + Vite + Tailwind CSS
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── hooks/useAuth.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── PrivateRoute.jsx
        │   └── LoadingSpinner.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── ResultsPage.jsx
            └── HistoryPage.jsx
```

---

## 🚀 Setup & Running

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.9+ and **pip**
- **MySQL** 8.0+

---

### Step 1 — Database Setup

1. Start MySQL and open a client (MySQL Workbench / CLI)
2. Run the schema script:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `medibook` database with `users`, `symptoms`, and `predictions` tables and seeds 130 symptoms.

---

### Step 2 — Flask ML Service

```bash
cd ml_service

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Train the stub model (run ONCE — generates model/model.pkl)
python model/train_stub.py

# Start the Flask server on port 5001
python app.py
```

✅ Verify: `GET http://localhost:5001/health` → `{ "status": "ok", "model_loaded": true }`

---

### Step 3 — Node.js / Express Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET

# Start the server
npm run dev    # development (nodemon)
# or
npm start      # production
```

✅ Verify: `GET http://localhost:5000/health` → `{ "status": "ok" }`

---

### Step 4 — React Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```

✅ Open: `http://localhost:5173`

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | `{ name, email, password }` | Register new user |
| POST | `/api/auth/login` | No | `{ email, password }` | Login, receive JWT |

### Disease Prediction

| Method | Endpoint | Auth | Body / Params | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/symptoms` | No | — | Fetch full symptom catalogue |
| POST | `/api/diagnose` | JWT | `{ symptoms: string[] }` | Submit symptoms, get prediction |
| GET | `/api/history` | JWT | — | Fetch user's last 50 predictions |

### Flask ML Service

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/predict` | `{ symptoms: string[] }` | `{ disease, confidence, precautions }` |
| GET | `/health` | — | `{ status, model_loaded }` |

---

## 🧠 ML Model

### Current Stub Model
- **Algorithm**: Random Forest Classifier (200 trees)
- **Features**: 130 binary symptom features
- **Classes**: 26 common diseases
- **Training**: Synthetic data generated from clinical symptom-disease mappings

### Replacing with Your Trained Model
1. Train your actual model (Decision Tree / Random Forest / Naïve Bayes) on the Kaggle dataset
2. Save as a bundle: `{ classifier, label_encoder, all_symptoms }`
3. Serialise: `joblib.dump(model_bundle, "ml_service/model/model.pkl")`
4. Restart Flask — no other changes required

---

## 🔐 Security Features

- **bcryptjs** (saltRounds=12) for password hashing
- **JWT** tokens (7-day expiry, configurable)
- **Helmet.js** for HTTP security headers
- **CORS** restricted to configured origins
- **express-validator** for input sanitisation
- **Generic error messages** to prevent user enumeration

---

## 🎨 UI Features

- Dark glassmorphism design with animated gradient backgrounds
- Responsive layout (mobile + desktop)
- Searchable symptom library (130+ symptoms)
- Colour-coded confidence dial (green/amber/red)
- Urgency banners (critical / high / medium / low)
- Toast notifications for all actions
- Accordion-style prediction history
- Smooth CSS animations (fade-in, slide-up, float)

---

## 📊 Supported Diseases (26)

Malaria, Typhoid, Diabetes, Common Cold, Pneumonia, Dengue, Chicken Pox, GERD, Hypertension, Migraine, Jaundice, Urinary Tract Infection, Tuberculosis, Bronchial Asthma, Allergy, Arthritis, Fungal Infection, Acne, Heart Attack, Hepatitis A, Hepatitis B, Psoriasis, Impetigo, Varicose Veins, Hypothyroidism, Hyperthyroidism

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Axios |
| Backend | Node.js, Express.js 4, MySQL2, JWT, bcryptjs, Helmet |
| ML Service | Python, Flask 3, Scikit-learn, joblib, NumPy |
| Database | MySQL 8.0 |
| Auth | JSON Web Tokens (RS256 compatible) |

---

## 📝 Notes

> This tool provides **preliminary health insights only** and is **not a substitute** for professional medical diagnosis. Always consult a qualified healthcare professional.
