/**
 * Vital Routes
 * Mounted at: /api/vitals
 *
 * GET    /api/vitals     — Fetch last 30 vital readings
 * POST   /api/vitals     — Add a new vital reading
 * DELETE /api/vitals/:id — Delete a vital reading
 */

const express       = require('express');
const { body }      = require('express-validator');
const { protect }   = require('../middleware/authMiddleware');
const { addVital, getVitals, deleteVital } = require('../controllers/vitalController');

const router = express.Router();

const vitalValidation = [
  body('bloodPressureSystolic').optional().isFloat({ min: 60,  max: 250 }).withMessage('Systolic BP must be 60–250'),
  body('bloodPressureDiastolic').optional().isFloat({ min: 40, max: 150 }).withMessage('Diastolic BP must be 40–150'),
  body('bloodSugar').optional().isFloat({ min: 0,   max: 600 }).withMessage('Blood sugar must be 0–600 mg/dL'),
  body('heartRate').optional().isFloat({ min: 30,   max: 250 }).withMessage('Heart rate must be 30–250 bpm'),
  body('weight').optional().isFloat({ min: 1,       max: 500 }).withMessage('Weight must be 1–500 kg'),
  body('temperature').optional().isFloat({ min: 30, max: 45  }).withMessage('Temperature must be 30–45 °C'),
  body('spO2').optional().isFloat({ min: 50,        max: 100 }).withMessage('SpO2 must be 50–100%'),
  body('notes').optional().isString().isLength({ max: 500 }),
];

router.get('/',       protect, getVitals);
router.post('/',      protect, vitalValidation, addVital);
router.delete('/:id', protect, deleteVital);

module.exports = router;
