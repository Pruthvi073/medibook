/**
 * Vital Controller
 *
 * Handles CRUD operations for user health vital readings.
 */

const { validationResult } = require('express-validator');
const Vital = require('../models/Vital');

// ─────────────────────────────────────────────────────────────
// @route   POST /api/vitals
// @access  Protected
// ─────────────────────────────────────────────────────────────
const addVital = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const {
    recordedAt,
    bloodPressureSystolic, bloodPressureDiastolic,
    bloodSugar, heartRate, weight, temperature, spO2, notes,
  } = req.body;

  // Require at least one measurement
  const hasAny = [bloodPressureSystolic, bloodPressureDiastolic, bloodSugar,
                  heartRate, weight, temperature, spO2].some((v) => v != null);
  if (!hasAny) {
    return res.status(400).json({
      success: false,
      message: 'Provide at least one vital measurement.',
    });
  }

  try {
    const vital = await Vital.create({
      userId: req.user.id,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      bloodPressureSystolic, bloodPressureDiastolic,
      bloodSugar, heartRate, weight, temperature, spO2, notes,
    });

    return res.status(201).json({ success: true, data: vital });
  } catch (err) {
    console.error('[addVital]', err);
    return res.status(500).json({ success: false, message: 'Failed to save vitals.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/vitals
// @access  Protected
// Returns last 30 entries sorted newest first
// ─────────────────────────────────────────────────────────────
const getVitals = async (req, res) => {
  try {
    const vitals = await Vital
      .find({ userId: req.user.id })
      .sort({ recordedAt: -1 })
      .limit(30)
      .select('-__v');

    return res.json({ success: true, data: vitals });
  } catch (err) {
    console.error('[getVitals]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vitals.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/vitals/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────
const deleteVital = async (req, res) => {
  try {
    const result = await Vital.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Vital record not found.' });
    }
    return res.json({ success: true, message: 'Vital record deleted.' });
  } catch (err) {
    console.error('[deleteVital]', err);
    return res.status(500).json({ success: false, message: 'Failed to delete vital record.' });
  }
};

module.exports = { addVital, getVitals, deleteVital };
