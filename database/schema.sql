-- ============================================================
-- MediBook — Disease Prediction Platform
-- MySQL Database Schema  |  Version 1.0.0
-- 
-- Run this script once against a running MySQL 8.x+ server:
--   mysql -u root -p < database/schema.sql
-- ============================================================

-- Create and select the database
CREATE DATABASE IF NOT EXISTS `medibook`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `medibook`;

-- ============================================================
-- TABLE: users
-- Stores registered user accounts.
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)   NOT NULL,
  `email`         VARCHAR(255)   NOT NULL,
  `password_hash` VARCHAR(255)   NOT NULL,
  `created_at`    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: symptoms
-- Master catalogue of all recognisable symptoms.
-- Populated by the seed INSERT below.
-- ============================================================
CREATE TABLE IF NOT EXISTS `symptoms` (
  `id`            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `symptom_name`  VARCHAR(100)   NOT NULL COMMENT 'Internal snake_case key used by the ML model',
  `display_name`  VARCHAR(150)   NOT NULL COMMENT 'Human-readable label shown in the UI',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_symptom_name` (`symptom_name`),
  INDEX `idx_symptom_name` (`symptom_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: predictions
-- Records each disease prediction submitted by a user.
-- JSON columns (symptoms_used, precautions) require MySQL 5.7.8+.
-- ============================================================
CREATE TABLE IF NOT EXISTS `predictions` (
  `id`                INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED   NOT NULL,
  `symptoms_used`     JSON           NOT NULL COMMENT 'Array of symptom_name strings sent to the ML model',
  `predicted_disease` VARCHAR(150)   NOT NULL,
  `confidence`        DECIMAL(5,2)   NOT NULL DEFAULT 0.00 COMMENT 'Model confidence percentage (0.00 – 100.00)',
  `precautions`       JSON           NOT NULL COMMENT 'Array of precaution strings returned by the ML model',
  `created_at`        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id`    (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_predictions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SEED DATA: Symptoms Master Table
-- 130 symptoms matching the ML model's ALL_SYMPTOMS feature list.
-- ON DUPLICATE KEY UPDATE allows safe re-runs of this script.
-- ============================================================
INSERT INTO `symptoms` (`symptom_name`, `display_name`) VALUES
('itching',                        'Itching'),
('skin_rash',                      'Skin Rash'),
('nodal_skin_eruptions',           'Nodal Skin Eruptions'),
('continuous_sneezing',            'Continuous Sneezing'),
('shivering',                      'Shivering'),
('chills',                         'Chills'),
('joint_pain',                     'Joint Pain'),
('stomach_pain',                   'Stomach Pain'),
('acidity',                        'Acidity'),
('ulcers_on_tongue',               'Ulcers on Tongue'),
('muscle_wasting',                 'Muscle Wasting'),
('vomiting',                       'Vomiting'),
('burning_micturition',            'Burning Micturition'),
('spotting_urination',             'Spotting Urination'),
('fatigue',                        'Fatigue'),
('weight_gain',                    'Weight Gain'),
('anxiety',                        'Anxiety'),
('cold_hands_and_feets',           'Cold Hands and Feet'),
('mood_swings',                    'Mood Swings'),
('weight_loss',                    'Weight Loss'),
('restlessness',                   'Restlessness'),
('lethargy',                       'Lethargy'),
('patches_in_throat',              'Patches in Throat'),
('irregular_sugar_level',          'Irregular Sugar Level'),
('cough',                          'Cough'),
('high_fever',                     'High Fever'),
('sunken_eyes',                    'Sunken Eyes'),
('breathlessness',                 'Breathlessness'),
('sweating',                       'Sweating'),
('dehydration',                    'Dehydration'),
('indigestion',                    'Indigestion'),
('headache',                       'Headache'),
('yellowish_skin',                 'Yellowish Skin'),
('dark_urine',                     'Dark Urine'),
('nausea',                         'Nausea'),
('loss_of_appetite',               'Loss of Appetite'),
('pain_behind_the_eyes',           'Pain Behind the Eyes'),
('back_pain',                      'Back Pain'),
('constipation',                   'Constipation'),
('abdominal_pain',                 'Abdominal Pain'),
('diarrhoea',                      'Diarrhoea'),
('mild_fever',                     'Mild Fever'),
('yellow_urine',                   'Yellow Urine'),
('yellowing_of_eyes',              'Yellowing of Eyes'),
('acute_liver_failure',            'Acute Liver Failure'),
('fluid_overload',                 'Fluid Overload'),
('swelling_of_stomach',            'Swelling of Stomach'),
('swelled_lymph_nodes',            'Swelled Lymph Nodes'),
('malaise',                        'Malaise'),
('blurred_and_distorted_vision',   'Blurred and Distorted Vision'),
('phlegm',                         'Phlegm'),
('throat_irritation',              'Throat Irritation'),
('redness_of_eyes',                'Redness of Eyes'),
('sinus_pressure',                 'Sinus Pressure'),
('runny_nose',                     'Runny Nose'),
('congestion',                     'Congestion'),
('chest_pain',                     'Chest Pain'),
('weakness_in_limbs',              'Weakness in Limbs'),
('fast_heart_rate',                'Fast Heart Rate'),
('pain_during_bowel_motions',      'Pain During Bowel Motions'),
('pain_in_anal_region',            'Pain in Anal Region'),
('bloody_stool',                   'Bloody Stool'),
('irritation_in_anus',             'Irritation in Anus'),
('neck_stiffness',                 'Neck Stiffness'),
('spinning_movements',             'Spinning Movements'),
('loss_of_balance',                'Loss of Balance'),
('unsteadiness',                   'Unsteadiness'),
('weakness_of_one_body_side',      'Weakness of One Body Side'),
('loss_of_smell',                  'Loss of Smell'),
('bladder_discomfort',             'Bladder Discomfort'),
('foul_smell_of_urine',            'Foul Smell of Urine'),
('continuous_feel_of_urine',       'Continuous Feel of Urine'),
('passage_of_gases',               'Passage of Gases'),
('internal_itching',               'Internal Itching'),
('toxic_look',                     'Toxic Look (Typhoid)'),
('depression',                     'Depression'),
('irritability',                   'Irritability'),
('muscle_pain',                    'Muscle Pain'),
('altered_sensorium',              'Altered Sensorium'),
('red_spots_over_body',            'Red Spots Over Body'),
('belly_pain',                     'Belly Pain'),
('abnormal_menstruation',          'Abnormal Menstruation'),
('dischromic_patches',             'Dischromic Patches'),
('watering_from_eyes',             'Watering from Eyes'),
('increased_appetite',             'Increased Appetite'),
('polyuria',                       'Polyuria (Excessive Urination)'),
('family_history',                 'Family History'),
('mucoid_sputum',                  'Mucoid Sputum'),
('rusty_sputum',                   'Rusty Sputum'),
('lack_of_concentration',          'Lack of Concentration'),
('visual_disturbances',            'Visual Disturbances'),
('receiving_blood_transfusion',    'Receiving Blood Transfusion'),
('receiving_unsterile_injections', 'Receiving Unsterile Injections'),
('coma',                           'Coma'),
('stomach_bleeding',               'Stomach Bleeding'),
('distention_of_abdomen',          'Distention of Abdomen'),
('history_of_alcohol_consumption', 'History of Alcohol Consumption'),
('blood_in_sputum',                'Blood in Sputum'),
('prominent_veins_on_calf',        'Prominent Veins on Calf'),
('palpitations',                   'Palpitations'),
('painful_walking',                'Painful Walking'),
('pus_filled_pimples',             'Pus Filled Pimples'),
('blackheads',                     'Blackheads'),
('scurring',                       'Scarring (Scurring)'),
('skin_peeling',                   'Skin Peeling'),
('silver_like_dusting',            'Silver-Like Dusting'),
('small_dents_in_nails',           'Small Dents in Nails'),
('inflammatory_nails',             'Inflammatory Nails'),
('blister',                        'Blisters'),
('red_sore_around_nose',           'Red Sore Around Nose'),
('yellow_crust_ooze',              'Yellow Crust Ooze'),
('dizziness',                      'Dizziness'),
('swollen_joints',                 'Swollen Joints'),
('movement_stiffness',             'Movement Stiffness'),
('hip_joint_pain',                 'Hip Joint Pain'),
('knee_pain',                      'Knee Pain'),
('enlarged_thyroid',               'Enlarged Thyroid'),
('brittle_nails',                  'Brittle Nails'),
('swollen_extremities',            'Swollen Extremities'),
('excessive_hunger',               'Excessive Hunger'),
('drying_and_tingling_lips',       'Drying and Tingling Lips'),
('slurred_speech',                 'Slurred Speech'),
('extra_marital_contacts',         'High-Risk Contacts'),
('pricking_sensation',             'Pricking Sensation'),
('burning_sensation',              'Burning Sensation'),
('loss_of_consciousness',          'Loss of Consciousness')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);
