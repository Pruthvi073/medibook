/**
 * MongoDB / Mongoose Connection
 *
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Called once at server startup.
 *
 * Usage (in any controller):
 *   const User       = require('../models/User');
 *   const Prediction = require('../models/Prediction');
 *   const Symptom    = require('../models/Symptom');
 */

const mongoose = require('mongoose');

/**
 * connectDB
 *
 * Establishes the Mongoose connection to MongoDB.
 * Exits the process with code 1 on failure so the problem is
 * immediately visible rather than silently degrading.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[ERROR] MONGODB_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    const { host, port, name } = mongoose.connection;
    console.log(`[OK] MongoDB connected -> ${host}:${port}/${name}`);
  } catch (err) {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    console.error('        Check MONGODB_URI in .env and ensure MongoDB is running.');
    process.exit(1);
  }
}

module.exports = { connectDB };
