/**
 * Report Controller
 *
 * Handles medical report upload, AI analysis via Gemini, and history retrieval.
 *
 * Flow:
 *  1. Receive file (PDF or image) via multer memoryStorage
 *  2. PDF  → extract text with pdf-parse → send to Gemini as text
 *  3. Image → send buffer as base64 to Gemini Vision
 *  4. Parse Gemini JSON response → save to MongoDB
 *  5. Return structured analysis to frontend
 */

const path    = require('path');
const pdf     = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Report  = require('../models/Report');

// ─────────────────────────────────────────────────────────────
// Gemini client (graceful no-op when key is absent)
// ─────────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
let genAI = null;
if (GEMINI_KEY && GEMINI_KEY !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(GEMINI_KEY);
}

// ─────────────────────────────────────────────────────────────
// Fallback response when Gemini key is not configured
// ─────────────────────────────────────────────────────────────
const FALLBACK_ANALYSIS = {
  summary: 'AI analysis is not configured. Your report was uploaded successfully but could not be analysed automatically. Please add your GEMINI_API_KEY to backend/.env to enable AI analysis.',
  conditions: [],
  urgencyLevel: 'medium',
  urgencyReason: 'Unable to assess — AI key not configured.',
  keyFindings: ['Automated analysis not available. Please consult a doctor for interpretation.'],
  specialistType: 'General Practitioner',
  recommendedTests: [],
  dietPlan: {
    toEat:         ['Fruits and vegetables', 'Whole grains', 'Lean proteins', 'Plenty of water'],
    toAvoid:       ['Processed foods', 'Excess sugar', 'Alcohol', 'High-sodium foods'],
    generalAdvice: 'Follow a balanced diet and consult a nutritionist or your doctor for personalised advice.',
  },
  recommendedDoctors: [
    { role: 'General Practitioner', reason: 'Start with a GP for a full evaluation and referral.' },
  ],
  hospitalTypes: [
    { type: 'General Hospital / OPD', description: 'Visit the outpatient department for initial consultation and tests.', urgency: 'within a week' },
  ],
};

// ─────────────────────────────────────────────────────────────
// Build the Gemini prompt
// ─────────────────────────────────────────────────────────────
const buildPrompt = (reportText) => `
You are an expert medical report analyzer assistant. Carefully analyze the following medical report and provide a structured, accurate, and compassionate response.

MEDICAL REPORT CONTENT:
---
${reportText.slice(0, 8000)}
---

Respond ONLY with a valid JSON object (no markdown, no code blocks, no extra text) using exactly this structure:
{
  "summary": "Clear 2-3 sentence patient-friendly explanation of what this report shows",
  "conditions": ["Identified condition or disease 1", "Condition 2"],
  "urgencyLevel": "low",
  "urgencyReason": "One sentence explaining why this urgency level was chosen",
  "keyFindings": ["Key abnormal or notable finding 1", "Key finding 2", "Key finding 3"],
  "specialistType": "Type of specialist recommended (e.g. Cardiologist, Endocrinologist, General Practitioner)",
  "recommendedTests": ["Follow-up test 1 if applicable"],
  "dietPlan": {
    "toEat": ["Specific food: brief reason why beneficial", "Food: reason"],
    "toAvoid": ["Specific food: brief reason to avoid", "Food: reason"],
    "generalAdvice": "Overall dietary guidance in 1-2 sentences tailored to the findings"
  },
  "recommendedDoctors": [
    { "role": "Doctor specialty title e.g. Cardiologist", "reason": "One sentence why this specialist is needed" },
    { "role": "Secondary doctor type if applicable", "reason": "Reason" }
  ],
  "hospitalTypes": [
    { "type": "Hospital or clinic type e.g. Cardiac Care Centre", "description": "Brief description of what care they provide for this condition", "urgency": "immediate / within a week / within a month" },
    { "type": "Secondary facility type", "description": "Description", "urgency": "urgency level" }
  ]
}

Rules:
- urgencyLevel must be exactly one of: "low", "medium", "high", "critical"
- conditions: empty array [] if no specific condition identified
- recommendedTests: empty array [] if no follow-up needed
- keyFindings: include 3-5 items for best results
- dietPlan.toEat and toAvoid: 4-6 items each
- recommendedDoctors: 2-3 doctor roles relevant to the identified conditions
- hospitalTypes: 2-3 types of hospitals/clinics the patient should visit, with urgency
- If this is not a medical document, set summary to explain that and return sensible defaults
`;

// ─────────────────────────────────────────────────────────────
// Call Gemini API
// ─────────────────────────────────────────────────────────────
async function analyzeWithGemini(text, imageBuffer, mimeType) {
  if (!genAI) return FALLBACK_ANALYSIS;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let parts;
    if (imageBuffer) {
      parts = [
        { inlineData: { data: imageBuffer.toString('base64'), mimeType } },
        { text: buildPrompt('(Analyze the medical report shown in the attached image)') },
      ];
    } else {
      parts = [{ text: buildPrompt(text) }];
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });

    const raw = result.response.text().trim();
    // Strip markdown fences if present (safety net)
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    return JSON.parse(clean);

  } catch (err) {
    console.error('[analyzeWithGemini] Error:', err.message);
    if (err.message?.includes('API_KEY')) {
      throw new Error('Invalid Gemini API key. Check GEMINI_API_KEY in backend/.env');
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// @route   POST /api/reports/upload
// @access  Protected (JWT)
// ─────────────────────────────────────────────────────────────
const uploadReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const { originalname, mimetype, size, buffer } = req.file;
  const ext = path.extname(originalname).toLowerCase();
  const isPdf = ext === '.pdf' || mimetype === 'application/pdf';
  const fileType = isPdf ? 'pdf' : 'image';

  try {
    let analysis;

    if (isPdf) {
      const pdfData = await pdf(buffer);
      const text = (pdfData.text || '').trim();
      if (!text) {
        return res.status(422).json({
          success: false,
          message: 'Could not extract text from this PDF. Try a scanned image (JPG/PNG) instead.',
        });
      }
      analysis = await analyzeWithGemini(text, null, null);
    } else {
      analysis = await analyzeWithGemini(null, buffer, mimetype);
    }

    // Persist to MongoDB
    const report = await Report.create({
      userId:               req.user.id,
      fileName:             originalname,
      fileType,
      fileSize:             size,
      summary:              analysis.summary             || '',
      conditions:           analysis.conditions           || [],
      urgencyLevel:         analysis.urgencyLevel         || 'medium',
      urgencyReason:        analysis.urgencyReason        || '',
      keyFindings:          analysis.keyFindings          || [],
      specialistType:       analysis.specialistType       || '',
      recommendedTests:     analysis.recommendedTests     || [],
      dietPlan:             analysis.dietPlan             || { toEat: [], toAvoid: [], generalAdvice: '' },
      recommendedDoctors:   analysis.recommendedDoctors   || [],
      hospitalTypes:        analysis.hospitalTypes        || [],
      analysisStatus:       'done',
    });

    return res.status(201).json({ success: true, data: report });

  } catch (err) {
    console.error('[uploadReport]', err.message);

    if (err.message?.includes('Gemini')) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (err.name === 'SyntaxError') {
      return res.status(500).json({ success: false, message: 'AI returned an unexpected response format. Please try again.' });
    }

    return res.status(500).json({ success: false, message: 'Report analysis failed. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/reports
// @access  Protected
// ─────────────────────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    const reports = await Report
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('-__v');
    return res.json({ success: true, data: reports });
  } catch (err) {
    console.error('[getReports]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   GET /api/reports/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────
const getReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    return res.json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch report.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @route   DELETE /api/reports/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────
const deleteReport = async (req, res) => {
  try {
    const result = await Report.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    return res.json({ success: true, message: 'Report deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }
};

module.exports = { uploadReport, getReports, getReport, deleteReport };
