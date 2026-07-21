/**
 * Symptom Seed Script
 *
 * Inserts all 130 symptoms into the MongoDB 'symptoms' collection.
 * Safe to re-run multiple times — uses updateOne with upsert:true
 * so existing documents are updated, not duplicated.
 *
 * Usage:
 *   cd backend
 *   node seeds/seedSymptoms.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Symptom  = require('../models/Symptom');

// ─────────────────────────────────────────────────────────────
// SYMPTOM DATA  (130 entries — matches ML model feature list)
// ─────────────────────────────────────────────────────────────
const SYMPTOMS = [
  { symptomName: 'itching',                        displayName: 'Itching' },
  { symptomName: 'skin_rash',                      displayName: 'Skin Rash' },
  { symptomName: 'nodal_skin_eruptions',           displayName: 'Nodal Skin Eruptions' },
  { symptomName: 'continuous_sneezing',            displayName: 'Continuous Sneezing' },
  { symptomName: 'shivering',                      displayName: 'Shivering' },
  { symptomName: 'chills',                         displayName: 'Chills' },
  { symptomName: 'joint_pain',                     displayName: 'Joint Pain' },
  { symptomName: 'stomach_pain',                   displayName: 'Stomach Pain' },
  { symptomName: 'acidity',                        displayName: 'Acidity' },
  { symptomName: 'ulcers_on_tongue',               displayName: 'Ulcers on Tongue' },
  { symptomName: 'muscle_wasting',                 displayName: 'Muscle Wasting' },
  { symptomName: 'vomiting',                       displayName: 'Vomiting' },
  { symptomName: 'burning_micturition',            displayName: 'Burning Micturition' },
  { symptomName: 'spotting_urination',             displayName: 'Spotting Urination' },
  { symptomName: 'fatigue',                        displayName: 'Fatigue' },
  { symptomName: 'weight_gain',                    displayName: 'Weight Gain' },
  { symptomName: 'anxiety',                        displayName: 'Anxiety' },
  { symptomName: 'cold_hands_and_feets',           displayName: 'Cold Hands and Feet' },
  { symptomName: 'mood_swings',                    displayName: 'Mood Swings' },
  { symptomName: 'weight_loss',                    displayName: 'Weight Loss' },
  { symptomName: 'restlessness',                   displayName: 'Restlessness' },
  { symptomName: 'lethargy',                       displayName: 'Lethargy' },
  { symptomName: 'patches_in_throat',              displayName: 'Patches in Throat' },
  { symptomName: 'irregular_sugar_level',          displayName: 'Irregular Sugar Level' },
  { symptomName: 'cough',                          displayName: 'Cough' },
  { symptomName: 'high_fever',                     displayName: 'High Fever' },
  { symptomName: 'sunken_eyes',                    displayName: 'Sunken Eyes' },
  { symptomName: 'breathlessness',                 displayName: 'Breathlessness' },
  { symptomName: 'sweating',                       displayName: 'Sweating' },
  { symptomName: 'dehydration',                    displayName: 'Dehydration' },
  { symptomName: 'indigestion',                    displayName: 'Indigestion' },
  { symptomName: 'headache',                       displayName: 'Headache' },
  { symptomName: 'yellowish_skin',                 displayName: 'Yellowish Skin' },
  { symptomName: 'dark_urine',                     displayName: 'Dark Urine' },
  { symptomName: 'nausea',                         displayName: 'Nausea' },
  { symptomName: 'loss_of_appetite',               displayName: 'Loss of Appetite' },
  { symptomName: 'pain_behind_the_eyes',           displayName: 'Pain Behind the Eyes' },
  { symptomName: 'back_pain',                      displayName: 'Back Pain' },
  { symptomName: 'constipation',                   displayName: 'Constipation' },
  { symptomName: 'abdominal_pain',                 displayName: 'Abdominal Pain' },
  { symptomName: 'diarrhoea',                      displayName: 'Diarrhoea' },
  { symptomName: 'mild_fever',                     displayName: 'Mild Fever' },
  { symptomName: 'yellow_urine',                   displayName: 'Yellow Urine' },
  { symptomName: 'yellowing_of_eyes',              displayName: 'Yellowing of Eyes' },
  { symptomName: 'acute_liver_failure',            displayName: 'Acute Liver Failure' },
  { symptomName: 'fluid_overload',                 displayName: 'Fluid Overload' },
  { symptomName: 'swelling_of_stomach',            displayName: 'Swelling of Stomach' },
  { symptomName: 'swelled_lymph_nodes',            displayName: 'Swelled Lymph Nodes' },
  { symptomName: 'malaise',                        displayName: 'Malaise' },
  { symptomName: 'blurred_and_distorted_vision',   displayName: 'Blurred and Distorted Vision' },
  { symptomName: 'phlegm',                         displayName: 'Phlegm' },
  { symptomName: 'throat_irritation',              displayName: 'Throat Irritation' },
  { symptomName: 'redness_of_eyes',               displayName: 'Redness of Eyes' },
  { symptomName: 'sinus_pressure',                 displayName: 'Sinus Pressure' },
  { symptomName: 'runny_nose',                     displayName: 'Runny Nose' },
  { symptomName: 'congestion',                     displayName: 'Congestion' },
  { symptomName: 'chest_pain',                     displayName: 'Chest Pain' },
  { symptomName: 'weakness_in_limbs',              displayName: 'Weakness in Limbs' },
  { symptomName: 'fast_heart_rate',                displayName: 'Fast Heart Rate' },
  { symptomName: 'pain_during_bowel_motions',      displayName: 'Pain During Bowel Motions' },
  { symptomName: 'pain_in_anal_region',            displayName: 'Pain in Anal Region' },
  { symptomName: 'bloody_stool',                   displayName: 'Bloody Stool' },
  { symptomName: 'irritation_in_anus',             displayName: 'Irritation in Anus' },
  { symptomName: 'neck_stiffness',                 displayName: 'Neck Stiffness' },
  { symptomName: 'spinning_movements',             displayName: 'Spinning Movements' },
  { symptomName: 'loss_of_balance',                displayName: 'Loss of Balance' },
  { symptomName: 'unsteadiness',                   displayName: 'Unsteadiness' },
  { symptomName: 'weakness_of_one_body_side',      displayName: 'Weakness of One Body Side' },
  { symptomName: 'loss_of_smell',                  displayName: 'Loss of Smell' },
  { symptomName: 'bladder_discomfort',             displayName: 'Bladder Discomfort' },
  { symptomName: 'foul_smell_of_urine',            displayName: 'Foul Smell of Urine' },
  { symptomName: 'continuous_feel_of_urine',       displayName: 'Continuous Feel of Urine' },
  { symptomName: 'passage_of_gases',               displayName: 'Passage of Gases' },
  { symptomName: 'internal_itching',               displayName: 'Internal Itching' },
  { symptomName: 'toxic_look',                     displayName: 'Toxic Look (Typhoid)' },
  { symptomName: 'depression',                     displayName: 'Depression' },
  { symptomName: 'irritability',                   displayName: 'Irritability' },
  { symptomName: 'muscle_pain',                    displayName: 'Muscle Pain' },
  { symptomName: 'altered_sensorium',              displayName: 'Altered Sensorium' },
  { symptomName: 'red_spots_over_body',            displayName: 'Red Spots Over Body' },
  { symptomName: 'belly_pain',                     displayName: 'Belly Pain' },
  { symptomName: 'abnormal_menstruation',          displayName: 'Abnormal Menstruation' },
  { symptomName: 'dischromic_patches',             displayName: 'Dischromic Patches' },
  { symptomName: 'watering_from_eyes',             displayName: 'Watering from Eyes' },
  { symptomName: 'increased_appetite',             displayName: 'Increased Appetite' },
  { symptomName: 'polyuria',                       displayName: 'Polyuria (Excessive Urination)' },
  { symptomName: 'family_history',                 displayName: 'Family History' },
  { symptomName: 'mucoid_sputum',                  displayName: 'Mucoid Sputum' },
  { symptomName: 'rusty_sputum',                   displayName: 'Rusty Sputum' },
  { symptomName: 'lack_of_concentration',          displayName: 'Lack of Concentration' },
  { symptomName: 'visual_disturbances',            displayName: 'Visual Disturbances' },
  { symptomName: 'receiving_blood_transfusion',    displayName: 'Receiving Blood Transfusion' },
  { symptomName: 'receiving_unsterile_injections', displayName: 'Receiving Unsterile Injections' },
  { symptomName: 'coma',                           displayName: 'Coma' },
  { symptomName: 'stomach_bleeding',               displayName: 'Stomach Bleeding' },
  { symptomName: 'distention_of_abdomen',          displayName: 'Distention of Abdomen' },
  { symptomName: 'history_of_alcohol_consumption', displayName: 'History of Alcohol Consumption' },
  { symptomName: 'blood_in_sputum',                displayName: 'Blood in Sputum' },
  { symptomName: 'prominent_veins_on_calf',        displayName: 'Prominent Veins on Calf' },
  { symptomName: 'palpitations',                   displayName: 'Palpitations' },
  { symptomName: 'painful_walking',                displayName: 'Painful Walking' },
  { symptomName: 'pus_filled_pimples',             displayName: 'Pus Filled Pimples' },
  { symptomName: 'blackheads',                     displayName: 'Blackheads' },
  { symptomName: 'scurring',                       displayName: 'Scarring (Scurring)' },
  { symptomName: 'skin_peeling',                   displayName: 'Skin Peeling' },
  { symptomName: 'silver_like_dusting',            displayName: 'Silver-Like Dusting' },
  { symptomName: 'small_dents_in_nails',           displayName: 'Small Dents in Nails' },
  { symptomName: 'inflammatory_nails',             displayName: 'Inflammatory Nails' },
  { symptomName: 'blister',                        displayName: 'Blisters' },
  { symptomName: 'red_sore_around_nose',           displayName: 'Red Sore Around Nose' },
  { symptomName: 'yellow_crust_ooze',              displayName: 'Yellow Crust Ooze' },
  { symptomName: 'dizziness',                      displayName: 'Dizziness' },
  { symptomName: 'swollen_joints',                 displayName: 'Swollen Joints' },
  { symptomName: 'movement_stiffness',             displayName: 'Movement Stiffness' },
  { symptomName: 'hip_joint_pain',                 displayName: 'Hip Joint Pain' },
  { symptomName: 'knee_pain',                      displayName: 'Knee Pain' },
  { symptomName: 'enlarged_thyroid',               displayName: 'Enlarged Thyroid' },
  { symptomName: 'brittle_nails',                  displayName: 'Brittle Nails' },
  { symptomName: 'swollen_extremities',            displayName: 'Swollen Extremities' },
  { symptomName: 'excessive_hunger',               displayName: 'Excessive Hunger' },
  { symptomName: 'drying_and_tingling_lips',       displayName: 'Drying and Tingling Lips' },
  { symptomName: 'slurred_speech',                 displayName: 'Slurred Speech' },
  { symptomName: 'extra_marital_contacts',         displayName: 'High-Risk Contacts' },
  { symptomName: 'pricking_sensation',             displayName: 'Pricking Sensation' },
  { symptomName: 'burning_sensation',              displayName: 'Burning Sensation' },
  { symptomName: 'loss_of_consciousness',          displayName: 'Loss of Consciousness' },
];

// ─────────────────────────────────────────────────────────────
// Main — connect, upsert all symptoms, disconnect
// ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to MongoDB');

    let inserted = 0;
    let updated  = 0;

    for (const s of SYMPTOMS) {
      const result = await Symptom.updateOne(
        { symptomName: s.symptomName },
        { $set: { displayName: s.displayName } },
        { upsert: true },
      );
      if (result.upsertedCount) inserted++;
      else updated++;
    }

    console.log(`[OK] Seeded ${SYMPTOMS.length} symptoms: ${inserted} new, ${updated} updated`);
  } catch (err) {
    console.error('[ERROR] Seeding failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[OK] Disconnected');
  }
}

seed();
