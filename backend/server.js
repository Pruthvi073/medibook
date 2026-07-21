/**
 * MediBook — Express.js Application Entry Point
 *
 * Bootstraps the Express server with security middleware, database
 * connectivity verification, and route registration.
 *
 * Architecture:
 *   React Frontend (port 5173)
 *     → Express API (port 5000)   ← this file
 *       → MySQL (port 3306)
 *       → Flask ML Service (port 5001)
 */

require('dotenv').config();

const express             = require('express');
const cors                = require('cors');
const helmet              = require('helmet');
const morgan              = require('morgan');
const { connectDB } = require('./config/db');

// Route modules
const authRoutes     = require('./routes/authRoutes');
const diagnoseRoutes = require('./routes/diagnoseRoutes');
const reportRoutes   = require('./routes/reportRoutes');
const vitalRoutes    = require('./routes/vitalRoutes');

// ─────────────────────────────────────────────────────────────
// App initialisation
// ─────────────────────────────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Parse comma-separated ALLOWED_ORIGINS from .env
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// ─────────────────────────────────────────────────────────────
// Global Middleware (order matters)
// ─────────────────────────────────────────────────────────────

// 1. Helmet — sets security-focused HTTP response headers
app.use(helmet());

// 2. Morgan — HTTP request logger (dev format shows method, url, status, time)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 3. CORS — allow configured frontend origins + Postman/curl (no origin)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow Postman / curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 4. JSON body parser (limit to 20 KB to handle report payloads)
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false }));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

// Health check — no auth required; useful for Docker / load balancers
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'medibook-backend',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes  → POST /api/auth/register  |  POST /api/auth/login
app.use('/api/auth', authRoutes);

// Symptom / Diagnose / History routes  → /api/symptoms | /api/diagnose | /api/history
app.use('/api', diagnoseRoutes);

// Medical Report routes  → /api/reports
app.use('/api/reports', reportRoutes);

// Health Vitals routes   → /api/vitals
app.use('/api/vitals', vitalRoutes);

// ─────────────────────────────────────────────────────────────
// 404 handler — unmatched routes
// ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─────────────────────────────────────────────────────────────
// Global error handler (must have 4 parameters for Express to recognise it)
// ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    // Expose stack trace only in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────
// Bootstrap — verify DB connection before accepting requests
// ─────────────────────────────────────────────────────────────
(async () => {
  await connectDB(); // Exits process on connection failure
  app.listen(PORT, () => {
    console.log(`\n[RUNNING] MediBook API -> http://localhost:${PORT}`);
    console.log(`[INFO]    Environment  -> ${process.env.NODE_ENV || 'development'}`);
    console.log(`[INFO]    ML Service   -> ${process.env.ML_SERVICE_URL || 'http://localhost:5001'}\n`);
  });
})();
