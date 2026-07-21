/**
 * Report Mongoose Model
 *
 * Stores AI-analyzed medical reports uploaded by users.
 * Fields mirror the JSON structure returned by Gemini.
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    fileName:    { type: String, required: true, trim: true },
    fileType:    { type: String, enum: ['pdf', 'image'], required: true },
    fileSize:    { type: Number }, // bytes

    // AI Analysis results
    summary:          { type: String, default: '' },
    conditions:       { type: [String], default: [] },
    urgencyLevel:     { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    urgencyReason:    { type: String, default: '' },
    keyFindings:      { type: [String], default: [] },
    specialistType:   { type: String, default: '' },
    recommendedTests: { type: [String], default: [] },

    dietPlan: {
      toEat:         { type: [String], default: [] },
      toAvoid:       { type: [String], default: [] },
      generalAdvice: { type: String,   default: '' },
    },

    // Doctor & Hospital recommendations
    recommendedDoctors: {
      type: [{
        role:   { type: String },
        reason: { type: String },
      }],
      default: [],
    },
    hospitalTypes: {
      type: [{
        type:        { type: String },
        description: { type: String },
        urgency:     { type: String },
      }],
      default: [],
    },

    analysisStatus: {
      type:    String,
      enum:    ['pending', 'done', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
