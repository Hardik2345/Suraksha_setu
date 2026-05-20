const mongoose = require('mongoose');
const { DISASTER_TYPES } = require('./SOS');

const incidentClusterSchema = new mongoose.Schema({
  canonicalClass: { type: String, enum: DISASTER_TYPES, required: true },
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
  },
  windowStart: { type: Date, required: true },
  windowEnd: { type: Date, required: true },
  reportCount: { type: Number, default: 0 },
  uniqueReporterCount: { type: Number, default: 0 },
  aggregateConfidence: { type: Number, default: 0 },
  linkedSOSIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SOS' }],
  uniqueReporterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastReportAt: { type: Date, default: Date.now },
}, { timestamps: true });

incidentClusterSchema.index({ location: '2dsphere' });
incidentClusterSchema.index({ canonicalClass: 1, lastReportAt: -1 });

module.exports = mongoose.model('IncidentCluster', incidentClusterSchema);
