const Alert = require('../../../../models/Alert');
const eventBus = require('../../../shared/events/eventBus');
const { hasCoordinates, distanceInMeters } = require('../domain/alertAudience');

async function listAlertsForUser(user) {
  let query = { isActive: true, expiresAt: { $gt: new Date() } };

  if (user && user.role !== 'admin') {
    query.targetAudience = { $in: ['all', 'location-based'] };
  }

  if (
    user &&
    hasCoordinates(user.location)
  ) {
    const candidateLocationAlerts = await Alert.find({
      ...query,
      targetAudience: 'location-based',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: user.location.coordinates },
          $maxDistance: 200000,
        },
      },
    }).populate('createdBy', 'name');

    const locationBasedAlerts = candidateLocationAlerts.filter((alert) => {
      if (!alert.location || !Array.isArray(alert.location.coordinates) || alert.location.coordinates.length !== 2) {
        return false;
      }

      const distance = distanceInMeters(user.location.coordinates, alert.location.coordinates);
      const radiusMeters = (alert.location.radius || 10) * 1000;
      return distance <= radiusMeters;
    });

    const allAlerts = await Alert.find({ ...query, targetAudience: 'all' }).populate('createdBy', 'name');
    const alerts = [...locationBasedAlerts, ...allAlerts];

    return {
      status: 200,
      body: { success: true, count: alerts.length, data: alerts },
    };
  }

  query.targetAudience = 'all';
  const alerts = await Alert.find(query).populate('createdBy', 'name');

  return {
    status: 200,
    body: { success: true, count: alerts.length, data: alerts },
  };
}

async function createAlertForUser(user, payload) {
  const { title, message, severity, type, targetAudience, radius, city, state, expiryHours, location } = payload;

  if (!title || !message || !type) {
    return { status: 400, body: { success: false, message: 'Title, message, and type are required' } };
  }

  const alertData = {
    title,
    message,
    severity: severity || 'info',
    type,
    targetAudience: targetAudience || 'all',
    createdBy: user && user._id,
  };

  if (targetAudience === 'location-based') {
    if (!location || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return { status: 400, body: { success: false, message: 'Invalid location: coordinates [lng,lat] required' } };
    }

    const [lngVal, latVal] = location.coordinates.map(Number);
    if (Number.isNaN(lngVal) || Number.isNaN(latVal)) {
      return { status: 400, body: { success: false, message: 'Invalid location coordinates: must be numeric' } };
    }

    alertData.location = {
      type: 'Point',
      coordinates: [lngVal, latVal],
      radius: location.radius || radius || 10,
      city: location.city || city,
      state: location.state || state,
    };
  }

  if (expiryHours) {
    alertData.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  }

  const alert = await Alert.create(alertData);
  const createdAlert = alert.toObject();

  await eventBus.publish('alert.created', {
    alert: createdAlert,
    createdAt: new Date().toISOString(),
  });

  return {
    status: 201,
    body: { success: true, message: 'Alert created and broadcast successfully', data: alert },
  };
}

async function markAlertAsRead(alertId, user) {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    return { status: 404, body: { success: false, message: 'Alert not found' } };
  }

  await alert.markAsRead(user && user._id);
  return {
    status: 200,
    body: { success: true, message: 'Alert marked as read' },
  };
}

async function getAlertHistory() {
  const alerts = await Alert.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name')
    .limit(50);

  return {
    status: 200,
    body: { success: true, count: alerts.length, data: alerts },
  };
}

async function deactivateAlert(alertId) {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    return { status: 404, body: { success: false, message: 'Alert not found' } };
  }

  alert.isActive = false;
  await alert.save();

  await eventBus.publish('alert.deactivated', {
    alertId: String(alert._id),
    deactivatedAt: new Date().toISOString(),
  });

  return {
    status: 200,
    body: { success: true, message: 'Alert deactivated successfully' },
  };
}

module.exports = {
  listAlertsForUser,
  createAlertForUser,
  markAlertAsRead,
  getAlertHistory,
  deactivateAlert,
};
