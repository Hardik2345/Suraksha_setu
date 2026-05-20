const mongoose = require('mongoose');
const { DISASTER_TYPES } = require('./SOS');

const snapSOSAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  clientLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  predictedClass: { type: String, enum: DISASTER_TYPES, required: true },
  classProbabilities: {
    type: Map,
    of: Number,
    required: true,
  },
  topClassProbability: { type: Number, required: true },
  modelVersion: { type: String, required: true },
  weatherContext: {
    provider: String,
    summary: String,
    temperatureC: Number,
    windSpeedKph: Number,
    precipitationMm: Number,
    weatherCode: Number,
    fetchedAt: Date,
  },
  confidenceScore: { type: Number, required: true },
  confidenceBreakdown: {
    model: Number,
    weather: Number,
    crowd: Number,
    quality: Number,
    trust: Number,
  },
  qualityScore: Number,
  trustScore: Number,
  trustBreakdown: {
    userTrust: Number,
    exifLocationMatch: Number,
    exifTimestampFreshness: Number,
    duplicateImageScore: Number,
  },
  confidenceCap: Number,
  metadataStatus: String,
  exifLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
  },
  exifCapturedAt: Date,
  imageHash: String,
  locationMismatchMeters: Number,
  suspicionFlags: [String],
  suggestedType: { type: String, enum: DISASTER_TYPES, required: true },
  clusterPreview: {
    clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentCluster' },
    reportCount: Number,
    uniqueReporterCount: Number,
    aggregateConfidence: Number,
  },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

snapSOSAnalysisSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
snapSOSAnalysisSchema.index({ imageHash: 1, createdAt: -1 });

module.exports = mongoose.model('SnapSOSAnalysis', snapSOSAnalysisSchema);
