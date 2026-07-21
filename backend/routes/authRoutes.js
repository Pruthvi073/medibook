/**
 * Authentication Routes
 * Mounted at: /api/auth
 *
 * POST /api/auth/register  — create a new user account
 * POST /api/auth/login     — authenticate and receive a JWT
 */

const express             = require('express');
const { body }            = require('express-validator');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register,
);

// ─── POST /api/auth/login ─────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  login,
);

module.exports = router;
