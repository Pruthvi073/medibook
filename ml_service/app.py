"""
MediBook Flask ML Service
==========================
Serves the trained disease-prediction model via a lightweight REST API.

Endpoints:
  GET  /health   — Service health check
  POST /predict  — Accept a list of symptoms, return disease prediction + precautions

Prerequisites:
    1. pip install -r requirements.txt
    2. python model/train_stub.py   ← generates model/model.pkl
    3. python app.py                ← starts server on :5001

Swap model/model.pkl with your real trained model at any time —
the inference pipeline here is model-agnostic as long as the bundle
format is preserved: { classifier, label_encoder, all_symptoms }
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()  # Load .env variables (PORT, MODEL_PATH, FLASK_DEBUG)

# ─────────────────────────────────────────────────────────────
# Flask application
# ─────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (e.g., from Express backend)

# ─────────────────────────────────────────────────────────────
# Disease → Precautions knowledge base
# ─────────────────────────────────────────────────────────────
DISEASE_PRECAUTIONS = {
    "Malaria": [
        "Use mosquito nets and insect repellent consistently",
        "Take prescribed anti-malarial medication promptly",
        "Eliminate stagnant water around your living area",
        "Stay indoors during peak mosquito hours (dusk and dawn)",
        "Seek immediate medical attention if symptoms worsen",
    ],
    "Typhoid": [
        "Drink only purified or boiled water",
        "Maintain strict hand hygiene before handling food",
        "Avoid raw fruits and vegetables from unverified sources",
        "Complete the full prescribed course of antibiotics",
        "Get vaccinated if travelling to high-risk areas",
    ],
    "Diabetes": [
        "Monitor blood glucose levels regularly (fasting and post-meal)",
        "Follow a low-glycaemic, balanced diet plan",
        "Exercise for at least 30 minutes of moderate activity daily",
        "Take insulin or oral medication exactly as prescribed",
        "Schedule regular check-ups for eyes, kidneys, and feet",
    ],
    "Common Cold": [
        "Rest adequately and increase fluid intake",
        "Use saline nasal drops or a humidifier for congestion relief",
        "Avoid close contact with others to prevent spreading infection",
        "Take OTC decongestants or antihistamines as needed",
        "Wash hands frequently with soap for at least 20 seconds",
    ],
    "Pneumonia": [
        "Complete the full prescribed antibiotic course without interruption",
        "Get plenty of rest and maintain adequate fluid intake",
        "Avoid smoking and second-hand smoke completely",
        "Use a cool-mist humidifier to ease breathing",
        "Consider pneumococcal vaccination for future prevention",
    ],
    "Dengue": [
        "Take paracetamol for fever — strictly avoid aspirin and ibuprofen",
        "Stay well-hydrated with oral rehydration salts (ORS)",
        "Use mosquito nets and wear protective clothing",
        "Monitor platelet count; seek hospitalisation if below 100,000",
        "Eliminate mosquito breeding sites around your home",
    ],
    "Chicken pox": [
        "Isolate until all blisters have fully crusted over (7–10 days)",
        "Apply calamine lotion to relieve itching",
        "Trim fingernails short to prevent skin infections from scratching",
        "Take prescribed antihistamines for itch relief",
        "Ensure non-immune close contacts receive the varicella vaccine",
    ],
    "GERD": [
        "Avoid trigger foods: spicy, fatty, citrus, caffeine, and alcohol",
        "Eat smaller, more frequent meals rather than large ones",
        "Do not lie down within 2–3 hours after eating",
        "Elevate the head of your bed by 15–20 cm",
        "Take prescribed antacids or proton pump inhibitors (PPIs) as directed",
    ],
    "Hypertension": [
        "Reduce sodium intake to less than 2,300 mg per day",
        "Exercise regularly — at least 30 minutes of brisk walking daily",
        "Limit alcohol consumption and quit smoking",
        "Monitor blood pressure at home at least once daily",
        "Take antihypertensive medication exactly as prescribed",
    ],
    "Migraine": [
        "Identify and avoid personal triggers (stress, certain foods, bright lights)",
        "Rest in a quiet, dark room during an attack",
        "Apply cold or warm compresses to the forehead or neck",
        "Take prescribed migraine medication at the very first sign of onset",
        "Maintain a regular sleep schedule and consistent meal times",
    ],
    "Jaundice": [
        "Avoid alcohol and hepatotoxic medications completely",
        "Follow a low-fat, high-carbohydrate diet",
        "Stay well-hydrated; drink 8–10 glasses of water daily",
        "Get adequate rest and avoid all strenuous physical activity",
        "Undergo regular liver function tests until values normalise",
    ],
    "Urinary tract infection": [
        "Drink plenty of water to flush bacteria from the urinary tract",
        "Complete the full prescribed antibiotic course",
        "Urinate frequently and do not hold urine for extended periods",
        "Maintain proper genital hygiene (wipe front to back)",
        "Avoid irritants such as perfumed soaps and bubble baths",
    ],
    "Tuberculosis": [
        "Complete the full 6-month DOTS (Directly Observed Treatment) course",
        "Wear a surgical mask in public spaces during the infectious period",
        "Ensure good ventilation in all living and sleeping spaces",
        "Notify close contacts for TB testing and BCG vaccination",
        "Eat a nutritious, protein-rich diet to support immune recovery",
    ],
    "Bronchial Asthma": [
        "Always carry your prescribed rescue inhaler (bronchodilator)",
        "Identify and strictly avoid personal asthma triggers",
        "Use a peak flow meter daily to monitor your lung function",
        "Follow your personalised asthma action plan during flare-ups",
        "Get an annual influenza vaccine to reduce respiratory infections",
    ],
    "Allergy": [
        "Identify and strictly avoid all known allergens",
        "Take prescribed antihistamines or corticosteroids as directed",
        "Keep windows closed during high-pollen seasons",
        "Use HEPA air purifiers in your bedroom and main living areas",
        "Discuss allergen immunotherapy (allergy shots) with a specialist",
    ],
    "Arthritis": [
        "Apply hot or cold compresses to affected joints for pain relief",
        "Practice gentle range-of-motion and strengthening exercises daily",
        "Maintain a healthy weight to reduce mechanical joint stress",
        "Take prescribed NSAIDs or disease-modifying drugs (DMARDs) as directed",
        "Consider physiotherapy or occupational therapy for functional support",
    ],
    "Fungal infection": [
        "Keep the affected skin area clean and completely dry",
        "Apply prescribed antifungal cream, powder, or oral medication",
        "Wear breathable, moisture-wicking clothing and well-ventilated footwear",
        "Avoid sharing towels, combs, or any personal clothing items",
        "Change socks and undergarments daily",
    ],
    "Acne": [
        "Wash your face twice daily with a gentle, non-comedogenic cleanser",
        "Apply prescribed topical retinoids or benzoyl peroxide",
        "Avoid touching or picking at pimples to prevent scarring",
        "Use oil-free, non-comedogenic sunscreen and moisturiser",
        "Maintain a balanced diet and reduce excess sugar and dairy intake",
    ],
    "Heart attack": [
        "Call emergency services (112 / 102) immediately — do not drive yourself",
        "Chew one standard aspirin (325 mg) while waiting if not allergic",
        "Rest in a comfortable, semi-upright position",
        "After recovery, follow a heart-healthy diet and exercise rehabilitation plan",
        "Take all prescribed cardiac medications without skipping any dose",
    ],
    "Hepatitis B": [
        "Avoid alcohol completely to prevent further liver damage",
        "Ensure close contacts are tested and vaccinated against Hepatitis B",
        "Use barrier protection (condoms) to prevent sexual transmission",
        "Never share needles, syringes, or personal care items",
        "Attend regular liver function and viral load monitoring appointments",
    ],
    "Hepatitis A": [
        "Practice strict hand hygiene, especially after using the toilet",
        "Avoid raw shellfish and food from hygienically uncertain sources",
        "Rest and maintain adequate caloric and fluid intake",
        "Avoid alcohol during and for at least 6 months after recovery",
        "Notify local health authorities for outbreak contact tracing",
    ],
    "Psoriasis": [
        "Moisturise skin twice daily with fragrance-free, thick emollients",
        "Apply prescribed topical corticosteroids or vitamin D analogues",
        "Expose affected skin to moderate natural sunlight (avoid sunburn)",
        "Manage stress through yoga, meditation, or professional counselling",
        "Avoid skin trauma and harsh soaps or chemical irritants",
    ],
    "Impetigo": [
        "Keep the affected area clean; wash gently with soap and water",
        "Apply prescribed topical or oral antibiotics as directed",
        "Avoid touching or scratching the sores",
        "Wash hands frequently and keep fingernails short",
        "Keep the affected person home from school or work for 48 h after antibiotic start",
    ],
    "Varicose veins": [
        "Wear prescribed graduated compression stockings daily",
        "Elevate your legs above heart level for 15 minutes, 3–4 times a day",
        "Avoid prolonged standing or sitting; walk and move regularly",
        "Exercise regularly to improve leg circulation (walking, swimming)",
        "Maintain a healthy weight to reduce venous pressure",
    ],
    "Hypothyroidism": [
        "Take prescribed levothyroxine at the same time every morning on an empty stomach",
        "Have TSH levels monitored every 6–12 months",
        "Follow a balanced diet with adequate iodine and selenium",
        "Limit excess goitrogenic foods (raw cabbage, kale, soy products)",
        "Exercise regularly to help manage fatigue and weight gain",
    ],
    "Hyperthyroidism": [
        "Take prescribed antithyroid medications (e.g., methimazole) as directed",
        "Avoid iodine-rich foods (seaweed, iodised salt) and supplements",
        "Wear UV-protective sunglasses if eye involvement (exophthalmos) is present",
        "Have thyroid function tests every 4–6 weeks during active treatment",
        "Discuss definitive treatment (radioiodine or surgery) with your endocrinologist",
    ],
}

# Fallback precautions when predicted disease is not in the knowledge base
DEFAULT_PRECAUTIONS = [
    "Consult a qualified healthcare professional promptly",
    "Rest adequately and maintain good hydration",
    "Monitor your symptoms closely and note any changes",
    "Avoid self-medication without professional medical advice",
    "Maintain good personal hygiene and a balanced, nutritious diet",
]

# ─────────────────────────────────────────────────────────────
# Model loading
# ─────────────────────────────────────────────────────────────
MODEL_PATH  = os.getenv("MODEL_PATH", "model/model.pkl")
model_bundle = None  # Populated by load_model()


def load_model():
    """Load the serialised model bundle from disk into global model_bundle."""
    global model_bundle
    try:
        model_bundle = joblib.load(MODEL_PATH)
        clf  = model_bundle["classifier"]
        le   = model_bundle["label_encoder"]
        syms = model_bundle["all_symptoms"]
        print(f"[OK] Model loaded  : {clf.__class__.__name__}")
        print(f"     Features      : {len(syms)} symptoms")
        print(f"     Disease classes ({len(le.classes_)}) : {list(le.classes_)}")
    except FileNotFoundError:
        print(f"[WARN] Model file not found at '{MODEL_PATH}'.")
        print("       Run:  python model/train_stub.py")
        model_bundle = None
    except Exception as exc:
        print(f"[ERROR] Failed to load model: {exc}")
        model_bundle = None


def symptoms_to_vector(symptom_list, all_symptoms):
    """
    Convert a list of symptom key strings to a binary NumPy feature vector.

    Args:
        symptom_list: List of symptom key strings from the request.
        all_symptoms: Ordered master symptom list (defines feature indices).

    Returns:
        vector   : np.ndarray of shape (len(all_symptoms),)
        unknown  : list of symptom keys not found in all_symptoms
    """
    sym_index = {s: i for i, s in enumerate(all_symptoms)}
    vector    = np.zeros(len(all_symptoms), dtype=np.int8)
    unknown   = []
    for symptom in symptom_list:
        if symptom in sym_index:
            vector[sym_index[symptom]] = 1
        else:
            unknown.append(symptom)
    return vector, unknown


# ─────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """
    GET /health
    Returns service status and whether the model is loaded.
    """
    return jsonify({
        "status":       "ok",
        "service":      "medibook-ml",
        "model_loaded": model_bundle is not None,
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    POST /predict
    ─────────────
    Request body:
        { "symptoms": ["high_fever", "chills", "sweating"] }

    Response (200):
        {
            "disease":     "Malaria",
            "confidence":  94.5,
            "precautions": ["...", "..."]
        }

    Response (400) on bad input:
        { "error": "..." }
    """
    data = request.get_json(silent=True)

    # ── Input validation ─────────────────────────────────────
    if not data or "symptoms" not in data:
        return jsonify({"error": 'Request body must contain a "symptoms" array'}), 400

    symptoms = data["symptoms"]

    if not isinstance(symptoms, list) or len(symptoms) == 0:
        return jsonify({"error": "Symptoms must be a non-empty array of strings"}), 400

    # Normalise: trim whitespace and lowercase
    symptoms = [str(s).strip().lower().replace(" ", "_") for s in symptoms]

    # ── Model inference ──────────────────────────────────────
    if model_bundle is None:
        # Graceful degradation: model not yet trained
        return jsonify({
            "disease":     "Model Not Loaded",
            "confidence":  0.0,
            "precautions": [
                "The ML model has not been trained yet.",
                "Please run: python model/train_stub.py",
                "Then restart the Flask server.",
            ],
        }), 200

    clf      = model_bundle["classifier"]
    le       = model_bundle["label_encoder"]
    all_syms = model_bundle["all_symptoms"]

    # Build the feature vector from the submitted symptoms
    feature_vec, unknown_syms = symptoms_to_vector(symptoms, all_syms)

    if unknown_syms:
        # Log unknown symptoms but do not fail the request
        print(f"[WARN] Unknown symptoms in request (ignored): {unknown_syms}")

    # Reshape to (1, n_features) for sklearn
    X = feature_vec.reshape(1, -1)

    # Predict class probabilities
    proba     = clf.predict_proba(X)[0]               # shape: (n_classes,)
    class_idx = int(np.argmax(proba))
    confidence = round(float(proba[class_idx]) * 100, 2)
    disease    = le.inverse_transform([class_idx])[0]

    # Look up disease-specific precautions (fall back to defaults)
    precautions = DISEASE_PRECAUTIONS.get(disease, DEFAULT_PRECAUTIONS)

    return jsonify({
        "disease":     disease,
        "confidence":  confidence,
        "precautions": precautions,
    })


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  MediBook ML Service")
    print("=" * 60)

    load_model()

    port      = int(os.getenv("PORT", 5001))
    debug_on  = bool(int(os.getenv("FLASK_DEBUG", 0)))

    print(f"\n[RUNNING] http://localhost:{port}")
    print(f"          Debug mode : {'ON' if debug_on else 'OFF'}\n")

    app.run(host="0.0.0.0", port=port, debug=debug_on)
