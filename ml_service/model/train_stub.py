"""
MediBook ML Model Training Stub
================================
Generates and serialises a Random Forest classifier trained on a
synthetic symptom–disease dataset derived from the classic Kaggle
"Disease Prediction Using Machine Learning" dataset structure.

Run this script ONCE before starting the Flask server to produce model.pkl.

Usage:
    cd ml_service
    python model/train_stub.py

When your real trained model is ready, replace model.pkl with the
serialised bundle in the same format: { classifier, label_encoder, all_symptoms }
"""

import os
import random
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# ─────────────────────────────────────────────────────────────
# ALL_SYMPTOMS — ordered feature list (MUST match app.py exactly)
# The position of each symptom in this list defines its feature index.
# ─────────────────────────────────────────────────────────────
ALL_SYMPTOMS = [
    "itching", "skin_rash", "nodal_skin_eruptions", "continuous_sneezing",
    "shivering", "chills", "joint_pain", "stomach_pain", "acidity",
    "ulcers_on_tongue", "muscle_wasting", "vomiting", "burning_micturition",
    "spotting_urination", "fatigue", "weight_gain", "anxiety",
    "cold_hands_and_feets", "mood_swings", "weight_loss", "restlessness",
    "lethargy", "patches_in_throat", "irregular_sugar_level", "cough",
    "high_fever", "sunken_eyes", "breathlessness", "sweating", "dehydration",
    "indigestion", "headache", "yellowish_skin", "dark_urine", "nausea",
    "loss_of_appetite", "pain_behind_the_eyes", "back_pain", "constipation",
    "abdominal_pain", "diarrhoea", "mild_fever", "yellow_urine",
    "yellowing_of_eyes", "acute_liver_failure", "fluid_overload",
    "swelling_of_stomach", "swelled_lymph_nodes", "malaise",
    "blurred_and_distorted_vision", "phlegm", "throat_irritation",
    "redness_of_eyes", "sinus_pressure", "runny_nose", "congestion",
    "chest_pain", "weakness_in_limbs", "fast_heart_rate",
    "pain_during_bowel_motions", "pain_in_anal_region", "bloody_stool",
    "irritation_in_anus", "neck_stiffness", "spinning_movements",
    "loss_of_balance", "unsteadiness", "weakness_of_one_body_side",
    "loss_of_smell", "bladder_discomfort", "foul_smell_of_urine",
    "continuous_feel_of_urine", "passage_of_gases", "internal_itching",
    "toxic_look", "depression", "irritability", "muscle_pain",
    "altered_sensorium", "red_spots_over_body", "belly_pain",
    "abnormal_menstruation", "dischromic_patches", "watering_from_eyes",
    "increased_appetite", "polyuria", "family_history", "mucoid_sputum",
    "rusty_sputum", "lack_of_concentration", "visual_disturbances",
    "receiving_blood_transfusion", "receiving_unsterile_injections", "coma",
    "stomach_bleeding", "distention_of_abdomen",
    "history_of_alcohol_consumption", "blood_in_sputum",
    "prominent_veins_on_calf", "palpitations", "painful_walking",
    "pus_filled_pimples", "blackheads", "scurring", "skin_peeling",
    "silver_like_dusting", "small_dents_in_nails", "inflammatory_nails",
    "blister", "red_sore_around_nose", "yellow_crust_ooze", "dizziness",
    "swollen_joints", "movement_stiffness", "hip_joint_pain", "knee_pain",
    "enlarged_thyroid", "brittle_nails", "swollen_extremities",
    "excessive_hunger", "drying_and_tingling_lips", "slurred_speech",
    "extra_marital_contacts", "pricking_sensation", "burning_sensation",
    "loss_of_consciousness",
]

# ─────────────────────────────────────────────────────────────
# DISEASE_SYMPTOM_MAP
# Maps each disease to its defining symptoms.
# These patterns are derived from clinical knowledge and the
# Kaggle "Disease Prediction Using Machine Learning" dataset.
# ─────────────────────────────────────────────────────────────
DISEASE_SYMPTOM_MAP = {
    "Malaria": [
        "chills", "high_fever", "sweating", "headache", "nausea",
        "muscle_pain", "vomiting", "shivering", "fatigue",
    ],
    "Typhoid": [
        "high_fever", "headache", "nausea", "abdominal_pain",
        "constipation", "toxic_look", "belly_pain", "fatigue", "vomiting",
    ],
    "Diabetes": [
        "polyuria", "increased_appetite", "weight_loss", "fatigue",
        "blurred_and_distorted_vision", "irregular_sugar_level",
        "excessive_hunger", "lethargy",
    ],
    "Common Cold": [
        "continuous_sneezing", "runny_nose", "congestion", "headache",
        "cough", "throat_irritation", "mild_fever", "fatigue", "loss_of_smell",
    ],
    "Pneumonia": [
        "cough", "high_fever", "breathlessness", "chest_pain",
        "phlegm", "rusty_sputum", "fatigue", "shivering", "dehydration",
    ],
    "Dengue": [
        "high_fever", "headache", "pain_behind_the_eyes", "muscle_pain",
        "joint_pain", "skin_rash", "vomiting", "red_spots_over_body",
        "fatigue", "nausea",
    ],
    "Chicken pox": [
        "skin_rash", "itching", "high_fever", "fatigue", "blister",
        "red_spots_over_body", "loss_of_appetite", "malaise",
    ],
    "GERD": [
        "acidity", "indigestion", "chest_pain", "vomiting", "back_pain",
        "stomach_pain", "nausea", "cough",
    ],
    "Hypertension": [
        "headache", "chest_pain", "dizziness", "loss_of_balance",
        "lack_of_concentration", "fatigue", "palpitations",
    ],
    "Migraine": [
        "headache", "nausea", "vomiting", "visual_disturbances",
        "pain_behind_the_eyes", "blurred_and_distorted_vision",
        "excessive_hunger", "neck_stiffness",
    ],
    "Jaundice": [
        "yellowish_skin", "dark_urine", "yellow_urine", "yellowing_of_eyes",
        "fatigue", "vomiting", "abdominal_pain", "itching",
    ],
    "Urinary tract infection": [
        "burning_micturition", "bladder_discomfort", "foul_smell_of_urine",
        "continuous_feel_of_urine", "spotting_urination", "back_pain",
    ],
    "Tuberculosis": [
        "cough", "blood_in_sputum", "high_fever", "fatigue", "weight_loss",
        "sweating", "breathlessness", "chest_pain", "phlegm", "loss_of_appetite",
    ],
    "Bronchial Asthma": [
        "breathlessness", "cough", "congestion", "fatigue",
        "mucoid_sputum", "chest_pain", "phlegm",
    ],
    "Allergy": [
        "continuous_sneezing", "redness_of_eyes", "runny_nose",
        "watering_from_eyes", "throat_irritation", "skin_rash", "itching",
    ],
    "Arthritis": [
        "joint_pain", "swollen_joints", "movement_stiffness", "muscle_pain",
        "back_pain", "knee_pain", "hip_joint_pain",
    ],
    "Fungal infection": [
        "itching", "skin_rash", "dischromic_patches",
        "nodal_skin_eruptions", "skin_peeling",
    ],
    "Acne": [
        "pus_filled_pimples", "blackheads", "skin_rash",
        "scurring", "skin_peeling",
    ],
    "Heart attack": [
        "chest_pain", "fast_heart_rate", "sweating", "breathlessness",
        "vomiting", "fatigue", "nausea", "pain_behind_the_eyes",
    ],
    "Hepatitis B": [
        "fatigue", "yellowish_skin", "dark_urine", "yellowing_of_eyes",
        "abdominal_pain", "loss_of_appetite",
        "receiving_unsterile_injections", "vomiting",
    ],
    "Hepatitis A": [
        "yellowish_skin", "dark_urine", "nausea", "vomiting",
        "abdominal_pain", "fatigue", "loss_of_appetite", "itching",
    ],
    "Psoriasis": [
        "skin_rash", "skin_peeling", "silver_like_dusting",
        "small_dents_in_nails", "inflammatory_nails", "joint_pain",
    ],
    "Impetigo": [
        "skin_rash", "blister", "red_sore_around_nose",
        "yellow_crust_ooze", "itching",
    ],
    "Varicose veins": [
        "swollen_extremities", "prominent_veins_on_calf",
        "painful_walking", "fatigue", "weakness_in_limbs",
    ],
    "Hypothyroidism": [
        "fatigue", "weight_gain", "cold_hands_and_feets", "constipation",
        "enlarged_thyroid", "brittle_nails", "depression", "lethargy",
    ],
    "Hyperthyroidism": [
        "fatigue", "weight_loss", "restlessness", "fast_heart_rate",
        "sweating", "enlarged_thyroid", "mood_swings", "irritability",
    ],
}

# Build a fast index: symptom name → feature position
SYMPTOM_INDEX = {symptom: idx for idx, symptom in enumerate(ALL_SYMPTOMS)}


def build_feature_vector(symptom_list):
    """Convert a list of symptom key strings to a binary NumPy feature vector."""
    vector = np.zeros(len(ALL_SYMPTOMS), dtype=np.int8)
    for symptom in symptom_list:
        if symptom in SYMPTOM_INDEX:
            vector[SYMPTOM_INDEX[symptom]] = 1
    return vector


def generate_training_data(samples_per_disease: int = 80, noise_prob: float = 0.04):
    """
    Generate synthetic training samples.

    Each sample is a binary feature vector built from a disease's
    defining symptoms, with a small probability of random bit-flips
    to simulate real-world symptom variability.

    Args:
        samples_per_disease: Number of training samples to generate per disease.
        noise_prob: Probability of flipping any given feature bit (adds noise).

    Returns:
        X: np.ndarray of shape (n_samples, n_features)
        y: np.ndarray of disease name strings (shape: n_samples,)
    """
    X, y = [], []
    random.seed(42)
    np.random.seed(42)

    for disease, core_symptoms in DISEASE_SYMPTOM_MAP.items():
        for _ in range(samples_per_disease):
            vec = build_feature_vector(core_symptoms).copy()
            # Add noise: randomly toggle some symptom bits
            for i in range(len(vec)):
                if random.random() < noise_prob:
                    vec[i] = 1 - vec[i]  # flip bit
            X.append(vec)
            y.append(disease)

    return np.array(X), np.array(y)


def main():
    print("=" * 60)
    print("  MediBook - Random Forest Training Stub")
    print("=" * 60)

    print("[1/4] Generating synthetic training data ...")
    X, y = generate_training_data(samples_per_disease=80)
    print(f"      Samples : {X.shape[0]}  |  Features : {X.shape[1]}  |  Classes : {len(np.unique(y))}")

    print("\n[2/4] Encoding class labels ...")
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    print(f"      Classes : {list(le.classes_)}")

    print("\n[3/4] Splitting data (80% train / 20% test) ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc,
    )

    print("\n[4/4] Training RandomForestClassifier (200 trees) ...")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    train_acc = clf.score(X_train, y_train) * 100
    test_acc  = clf.score(X_test,  y_test)  * 100
    print(f"      Train accuracy : {train_acc:.2f}%")
    print(f"      Test  accuracy : {test_acc:.2f}%")

    # ── Save model bundle ──────────────────────────────────────
    # The bundle includes everything needed for inference:
    #   - classifier     : the trained RandomForestClassifier
    #   - label_encoder  : maps integer predictions back to disease names
    #   - all_symptoms   : the ordered symptom list (defines feature order)
    model_bundle = {
        "classifier":    clf,
        "label_encoder": le,
        "all_symptoms":  ALL_SYMPTOMS,
    }

    out_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    joblib.dump(model_bundle, out_path)

    print(f"\n[OK] Model saved -> {out_path}")
    print("     Start the Flask server: python app.py\n")


if __name__ == "__main__":
    main()
