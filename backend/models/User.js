const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, minlength: [2, 'Name must be at least 2 characters'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  // Legacy simple location fields (lat/lng) kept for backwards compatibility
  location: { lat: Number, lng: Number, address: String },
  // GeoJSON location for geospatial queries
  locationGeo: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});
// 2dsphere index for geospatial queries on users
userSchema.index({ locationGeo: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Keep locationGeo in sync if simple lat/lng provided
userSchema.pre('save', function(next) {
  try {
    if (this.location && this.location.lat !== undefined && this.location.lng !== undefined) {
      const lat = parseFloat(this.location.lat);
      const lng = parseFloat(this.location.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        this.locationGeo = { type: 'Point', coordinates: [lng, lat] };
      } else {
        // ensure we don't leave a malformed locationGeo
        this.locationGeo = undefined;
      }
    } else {
      // no lat/lng provided — remove locationGeo so Mongo won't choke on incomplete shape
      this.locationGeo = undefined;
    }
  } catch (e) {
    // ignore
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
