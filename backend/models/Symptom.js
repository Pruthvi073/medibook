/**
 * Symptom Mongoose Model
 *
 * Master catalogue of all recognisable symptoms.
 * Seeded once via: node seeds/seedSymptoms.js
 *
 * Schema fields:
 *   symptomName  — internal snake_case key used by the ML model (unique)
 *   displayName  — human-readable label shown in the UI
 */

const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema(
  {
    symptomName: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },
    displayName: {
      type:     String,
      required: true,
      trim:     true,
    },
  },
  {
    timestamps: false, // Static catalogue data — no need for timestamps
  },
);

// Index for fast UI search by display name
symptomSchema.index({ displayName: 1 });

module.exports = mongoose.model('Symptom', symptomSchema);
