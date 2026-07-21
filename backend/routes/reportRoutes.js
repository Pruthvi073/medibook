/**
 * Report Routes
 * Mounted at: /api/reports
 *
 * POST /api/reports/upload  — Upload & analyse a medical report (PDF/image)
 * GET  /api/reports         — List user's analysed reports
 * GET  /api/reports/:id     — Get a single report
 * DELETE /api/reports/:id   — Delete a report
 */

const express  = require('express');
const multer   = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadReport, getReports, getReport, deleteReport,
} = require('../controllers/reportController');

const router = express.Router();

// Multer: memory storage (buffer) — no files written to disk
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg', 'image/jpg',
    'image/png', 'image/webp',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, PNG, or WEBP files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// Multer error handler
const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large. Maximum size is 10 MB.' });
    }
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

router.post('/upload', protect, upload.single('report'), handleMulterError, uploadReport);
router.get('/',        protect, getReports);
router.get('/:id',     protect, getReport);
router.delete('/:id',  protect, deleteReport);

module.exports = router;
