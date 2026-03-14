const Alert = require('../../../../models/Alert');

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceInMeters(fromCoordinates, toCoordinates) {
  const [fromLng, fromLat] = fromCoordinates.map(Number);
  const [toLng, toLat] = toCoordinates.map(Number);

  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function listAlertsForUser(user) {
  let query = { isActive: true, expiresAt: { $gt: new Date() } };

  if (user && user.role !== 'admin') {
    query.targetAudience = { $in: ['all', 'location-based'] };
  }

  if (
    user &&
    user.location &&
    Array.isArray(user.location.coordinates) &&
    user.location.coordinates.length === 2
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
