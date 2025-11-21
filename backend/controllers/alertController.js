const Alert = require('../models/Alert');
const User = require('../models/User');

// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    let query = { isActive: true, expiresAt: { $gt: new Date() } };

    if (req.user && req.user.role !== 'admin') {
      query.targetAudience = { $in: ['all', 'location-based'] };
    }

    if (req.user && req.user.location && req.user.location.lat && req.user.location.lng) {
      const locationBasedAlerts = await Alert.find({
        ...query,
        targetAudience: 'location-based',
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [req.user.location.lng, req.user.location.lat] },
            $maxDistance: 50000
          }
        }
      }).populate('createdBy', 'name');

      const allAlerts = await Alert.find({ ...query, targetAudience: 'all' }).populate('createdBy', 'name');
      const alerts = [...locationBasedAlerts, ...allAlerts];
      return res.json({ success: true, count: alerts.length, data: alerts });
    }

    query.targetAudience = 'all';
    const alerts = await Alert.find(query).populate('createdBy', 'name');
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};

// POST /api/alerts (Admin only)
exports.createAlert = async (req, res) => {
  try {
    const { title, message, severity, type, targetAudience, lat, lng, radius, city, state, expiryHours, location } = req.body;
    if (!title || !message || !type) return res.status(400).json({ success: false, message: 'Title, message, and type are required' });

    const alertData = { title, message, severity: severity || 'info', type, targetAudience: targetAudience || 'all', createdBy: req.user && req.user._id };

    // If client provided a `location` object manually, validate it has coordinates and are numbers
    if (location) {
      if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
        return res.status(400).json({ success: false, message: 'Invalid location: coordinates [lng,lat] required' });
      }
      const [lngVal, latVal] = location.coordinates.map(Number);
      if (Number.isNaN(lngVal) || Number.isNaN(latVal)) {
        return res.status(400).json({ success: false, message: 'Invalid location coordinates: must be numeric' });
      }
      alertData.location = { type: 'Point', coordinates: [lngVal, latVal], radius: location.radius || radius || 10, city: location.city || city, state: location.state || state };
    }

    // Prefer explicit lat/lng fields when targetAudience === 'location-based'
    if (!alertData.location && targetAudience === 'location-based') {
      if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required for location-based alerts' });
      const lngVal = Number(lng);
      const latVal = Number(lat);
      if (Number.isNaN(lngVal) || Number.isNaN(latVal)) return res.status(400).json({ success: false, message: 'lat and lng must be valid numbers' });
      alertData.location = { type: 'Point', coordinates: [lngVal, latVal], radius: radius || 10, city, state };
    }

    if (expiryHours) alertData.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const alert = await Alert.create(alertData);
    // TODO: real notifications
    res.status(201).json({ success: true, message: 'Alert created and broadcast successfully', data: alert });
  } catch (err) {
    console.error('Error creating alert:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create alert' });
  }
};

// PUT /api/alerts/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    await alert.markAsRead(req.user && req.user._id);
    res.json({ success: true, message: 'Alert marked as read' });
  } catch (err) {
    console.error('Error marking alert as read:', err);
    res.status(500).json({ success: false, message: 'Failed to mark alert as read' });
  }
};

// GET /api/alerts/history (Admin only)
exports.getAlertHistory = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).populate('createdBy', 'name').limit(50);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    console.error('Error fetching alert history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch alert history' });
  }
};

// DELETE /api/alerts/:id (deactivate)
exports.deactivateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    alert.isActive = false;
    await alert.save();
    res.json({ success: true, message: 'Alert deactivated successfully' });
  } catch (err) {
    console.error('Error deactivating alert:', err);
    res.status(500).json({ success: false, message: 'Failed to deactivate alert' });
  }
};
