const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['hospital', 'shelter', 'fire-station', 'police-station', 'community-center', 'relief-camp'],
    required: [true, 'Resource type is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordinates are required']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: String,
    state: String,
    pincode: String
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      validate: {
        validator: function(v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Phone number must be 10 digits'
      }
    },
    email: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Please provide a valid email'
      }
    },
    website: String
  },
  services: [String],
  capacity: {
    type: Number,
    min: 0
  },
  currentOccupancy: {
    type: Number,
    min: 0,
    default: 0
  },
  operatingHours: {
    type: String,
    default: '24/7'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ name: 'text', 'location.address': 'text', services: 'text' });

resourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

resourceSchema.methods.getAvailableCapacity = function() {
  return (this.capacity || 0) - (this.currentOccupancy || 0);
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
