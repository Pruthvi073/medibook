/**
 * Vital Mongoose Model
 *
 * Stores periodic health vital readings logged by the user.
 * All numeric fields are optional — users log only what they have.
 */

const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    recordedAt: { type: Date, default: Date.now },

    // Vital readings (all optional)
    bloodPressureSystolic:  { type: Number, min: 60,  max: 250  }, // mmHg
    bloodPressureDiastolic: { type: Number, min: 40,  max: 150  }, // mmHg
    bloodSugar:             { type: Number, min: 0,   max: 600  }, // mg/dL
    heartRate:              { type: Number, min: 30,  max: 250  }, // bpm
    weight:                 { type: Number, min: 1,   max: 500  }, // kg
    temperature:            { type: Number, min: 30,  max: 45   }, // °C
    spO2:                   { type: Number, min: 50,  max: 100  }, // %
    notes:                  { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

vitalSchema.index({ userId: 1, recordedAt: -1 });

module.exports = mongoose.model('Vital', vitalSchema);
