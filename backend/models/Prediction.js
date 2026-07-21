/**
 * Prediction Mongoose Model
 *
 * Stores each disease prediction submitted by a user.
 * Arrays (symptoms, precautions) are stored natively — no JSON.stringify needed.
 *
 * Schema fields:
 *   userId            — reference to the User who submitted the prediction
 *   symptoms          — array of symptom key strings sent to the ML model
 *   predictedDisease  — disease name returned by Flask
 *   confidence        — model confidence percentage (0 – 100)
 *   precautions       — array of precaution strings returned by Flask
 *   createdAt         — auto-managed by Mongoose timestamps
 */

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    symptoms: {
      type:     [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 1,
        message:   'At least one symptom is required',
      },
    },
    predictedDisease: {
      type:     String,
      required: true,
      trim:     true,
    },
    confidence: {
      type:    Number,
      default: 0,
      min:     0,
      max:     100,
    },
    precautions: {
      type:    [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt automatically
  },
);

// Index for fast user-history queries (sorted by newest first)
predictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
