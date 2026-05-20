const mongoose = require('mongoose');

const DISASTER_TYPES = ['earthquake', 'fire', 'flood', 'landslide', 'normal', 'smoke'];

const sosSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: DISASTER_TYPES, required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'high' },
  status: { type: String, enum: ['pending','acknowledged','in-progress','resolved'], default: 'pending' },
  description: { type: String, required: true, maxlength: 500 },
  source: { type: String, enum: ['manual', 'snap'], default: 'manual' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  contactNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  adminNotes: String,
  imageUrl: String,
  clientLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  modelPrediction: { type: String, enum: DISASTER_TYPES },
  modelProbabilities: {
    type: Map,
    of: Number,
    default: undefined,
  },
  modelTopScore: Number,
  modelVersion: String,
  userConfirmedType: { type: String, enum: DISASTER_TYPES },
  weatherContext: {
    provider: String,
    summary: String,
    temperatureC: Number,
    windSpeedKph: Number,
    precipitationMm: Number,
    weatherCode: Number,
    fetchedAt: Date,
  },
  confidenceScore: Number,
  confidenceBreakdown: {
    model: Number,
    weather: Number,
    crowd: Number,
    quality: Number,
    trust: Number,
  },
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
  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'IncidentCluster' },
  reviewStatus: {
    type: String,
    enum: ['manual-created', 'snap-analyzed', 'snap-confirmed', 'normal-review'],
    default: 'manual-created',
  },
});

sosSchema.index({ location: '2dsphere' });
sosSchema.index({ imageHash: 1, createdAt: -1 });

sosSchema.pre('validate', function(next) {
  const coords = this.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2 || coords.some(c => c === null || c === undefined || Number.isNaN(Number(c)))) {
    return next(new Error('SOS location must be a valid GeoJSON Point'));
  }
  next();
});

sosSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'resolved' && !this.resolvedAt) this.resolvedAt = Date.now();
  next();
});

const SOS = mongoose.model('SOS', sosSchema);
module.exports = SOS;
module.exports.DISASTER_TYPES = DISASTER_TYPES;
