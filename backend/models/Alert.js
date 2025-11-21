const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'danger', 'critical'],
    default: 'info'
  },
  type: {
    type: String,
    enum: ['weather', 'disaster', 'health', 'security', 'general'],
    required: true
  },
  targetAudience: {
    type: String,
    enum: ['all', 'location-based', 'admin-only'],
    default: 'all'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number], // [longitude, latitude]
    radius: {
      type: Number,
      default: 10
    },
    city: String,
    state: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ expiresAt: 1 });

// Ensure we don't persist an invalid geo `location` object (missing coordinates)
alertSchema.pre('validate', function(next) {
  if (!this.location) return next();

  const loc = this.location;
  // If coordinates are missing or not a valid [lng, lat] pair, remove the location
  if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 2 || loc.coordinates.some(c => c === null || c === undefined || Number.isNaN(Number(c)))) {
    // avoid storing a malformed GeoJSON which will break 2dsphere index insertion
    this.location = undefined;
  }

  next();
});
alertSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

alertSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(id => String(id) === String(userId))) {
    this.readBy.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
