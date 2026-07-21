/**
 * Diagnose Controller  (MongoDB / Mongoose version)
 *
 * Orchestrates the end-to-end disease-prediction workflow:
 *
 *  diagnose():
 *    1. Validate the incoming symptom list (via express-validator)
 *    2. Forward symptoms to the Flask ML service (POST /predict)
 *    3. Persist the prediction document to MongoDB
 *    4. Return the prediction result to the React client
 *
 *  getHistory():
 *    Returns the authenticated user's last 50 prediction documents.
 *
 *  getSymptoms():
 *    Returns the full symptom catalogue from MongoDB (public endpoint).
 */

const axios                = require('axios');
const { validationResult } = require('express-validator');
const Prediction           = require('../models/Prediction');
const Symptom              = require('../models/Symptom');

// Base URL of the Flask ML service (configured via .env)
const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ─────────────────────────────────────────────────────────────
// @route   GET /api/symptoms
// @access  Public
// @returns { success, data: [ { _id, symptomName, displayName } ] }
// ─────────────────────────────────────────────────────────────
const getSymptoms = async (_req, res) => {
  try {
    const symptoms = await Symptom
      .find({})
      .sort({ displayName: 1 })
      .select('symptomName displayName -_id');

    return res.json({ success: true, data: symptoms });
  } catch (err) {
    console.error('[getSymptoms]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch symptoms. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/diagnose
// @access  Protected (JWT)
// @body    { symptoms: string[] }
// @returns { success, data: { id, disease, confidence, precautions, symptoms, createdAt } }
// ─────────────────────────────────────────────────────────────
const diagnose = async (req, res) => {
  // 1. Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { symptoms } = req.body;
  const userId = req.user.id || req.user._id; // Support both id forms

  try {
    // ── Step 2: Call Flask ML service ──────────────────────────
    let mlData;
    try {
      const mlResponse = await axios.post(
        `${ML_BASE_URL}/predict`,
        { symptoms },
        { timeout: 12000 }, // 12-second timeout
      );
      mlData = mlResponse.data;
    } catch (mlErr) {
      if (mlErr.response) {
        console.error('[diagnose] Flask error:', mlErr.response.status, mlErr.response.data);
      } else {
        console.error('[diagnose] Flask ML service unreachable:', mlErr.message);
      }
      return res.status(502).json({
        success: false,
        message: 'ML service is currently unavailable. Please ensure it is running on port 5001.',
      });
    }

    const { disease, confidence, precautions } = mlData;

    // ── Step 3: Persist prediction to MongoDB ──────────────────
    // Arrays are stored natively — no JSON.stringify() required
    const prediction = await Prediction.create({
      userId,
      symptoms,
      predictedDisease: disease,
      confidence,
      precautions,
    });

    // ── Step 4: Return result to client ────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        id:          prediction._id,
        disease,
        confidence,
        precautions,
        symptoms,
        created_at:  prediction.createdAt,
      },
    });
  } catch (err) {
    console.error('[diagnose]', err);
    return res.status(500).json({
      success: false,
      message: 'Prediction failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/history
// @access  Protected (JWT)
// @returns { success, data: Prediction[] }
// ─────────────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  const userId = req.user.id || req.user._id;

  try {
    const predictions = await Prediction
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('symptoms predictedDisease confidence precautions createdAt');

    // Normalise field names to match what the React frontend expects
    const data = predictions.map((p) => ({
      id:                p._id,
      symptoms_used:     p.symptoms,
      predicted_disease: p.predictedDisease,
      confidence:        p.confidence,
      precautions:       p.precautions,
      created_at:        p.createdAt,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[getHistory]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction history.',
    });
  }
};

module.exports = { diagnose, getHistory, getSymptoms };
