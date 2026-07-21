/**
 * Authentication Controller  (MongoDB / Mongoose version)
 *
 * Implements user registration and login business logic.
 *
 * Security practices:
 *  - bcryptjs (saltRounds = 12) for password hashing
 *  - Generic error messages for login failures (prevents user enumeration)
 *  - express-validator result checked before any DB interaction
 *  - password field marked select:false in schema — never returned by default
 */

const bcrypt               = require('bcryptjs');
const jwt                  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User                 = require('../models/User');

// ─────────────────────────────────────────────────────────────
// Private helper — generate a signed JWT for a given user object
// ─────────────────────────────────────────────────────────────
const generateToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @access  Public
// @body    { name, email, password }
// @returns { success, message, token, user }
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  // 1. Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // 2. Check for duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // 3. Hash the password with bcrypt (saltRounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create the new user document in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 5. Issue a JWT and return the response
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    // Handle Mongoose duplicate key error (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    console.error('[register]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @access  Public
// @body    { email, password }
// @returns { success, message, token, user }
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  // 1. Check express-validator results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 2. Fetch user — explicitly select password (marked select:false in schema)
    const user = await User.findOne({ email }).select('+password');

    // 3. Generic message prevents user enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 4. Compare the provided password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 5. Issue JWT and return the response (password never exposed)
    const payload = { id: user._id, name: user.name, email: user.email };
    const token   = generateToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: payload,
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.',
    });
  }
};

module.exports = { register, login };
