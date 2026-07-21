/**
 * Diagnose & History Routes
 * Mounted at: /api
 *
 * GET  /api/symptoms  — public; returns the full symptom catalogue
 * POST /api/diagnose  — protected; submits symptoms → ML prediction → saved to DB
 * GET  /api/history   — protected; returns the user's prediction history
 */

const express                        = require('express');
const { body }                       = require('express-validator');
const { protect }                    = require('../middleware/authMiddleware');
const { diagnose, getHistory, getSymptoms } = require('../controllers/diagnoseController');

const router = express.Router();

// ─── GET /api/symptoms ────────────────────────────────────────
// Public — React frontend fetches this to populate the symptom selector
router.get('/symptoms', getSymptoms);

// ─── POST /api/diagnose ───────────────────────────────────────
// Protected — requires a valid JWT in the Authorization header
router.post(
  '/diagnose',
  protect,
  [
    body('symptoms')
      .isArray({ min: 1 }).withMessage('Provide at least 1 symptom')
      .custom((arr) =>
        arr.every((s) => typeof s === 'string' && s.trim().length > 0),
      ).withMessage('Each symptom must be a non-empty string'),
  ],
  diagnose,
);

// ─── GET /api/history ─────────────────────────────────────────
// Protected — returns the authenticated user's last 50 predictions
router.get('/history', protect, getHistory);

module.exports = router;
