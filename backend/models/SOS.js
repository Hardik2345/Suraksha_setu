const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['flood','fire','earthquake','medical','accident','other'], required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'high' },
  status: { type: String, enum: ['pending','acknowledged','in-progress','resolved'], default: 'pending' },
  description: { type: String, required: true, maxlength: 500 },
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
  adminNotes: String
});

sosSchema.index({ location: '2dsphere' });

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
