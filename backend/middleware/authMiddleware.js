/**
 * JWT Authentication Middleware
 *
 * Validates the Bearer token in the Authorization request header.
 * On success, attaches the decoded payload to req.user so downstream
 * route handlers can access the authenticated user's id, name, and email.
 * On failure, immediately returns a 401 Unauthorised response.
 *
 * Usage:
 *   router.get('/protected', protect, myController);
 */

const jwt = require('jsonwebtoken');

/**
 * @middleware protect
 *
 * Expected header format:
 *   Authorization: Bearer <jwt_token>
 *
 * Populates req.user with:
 *   { id, name, email, iat, exp }
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // Reject if no Authorization header, or wrong format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify signature + expiry using the application's JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normalise: always expose req.user.id (string) regardless of JWT payload shape
    req.user = { ...decoded, id: String(decoded.id || decoded._id) };
    next();
  } catch (err) {
    // Provide specific messages for common JWT errors
    let message = 'Authentication failed.';
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired. Please log in again.';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please log in again.';
    }

    return res.status(401).json({ success: false, message });
  }
};

module.exports = { protect };
