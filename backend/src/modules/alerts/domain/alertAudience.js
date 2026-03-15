function toRadians(value) {
  return (value * Math.PI) / 180;
}

function hasCoordinates(location) {
  return !!(
    location &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2 &&
    location.coordinates.every((value) => Number.isFinite(Number(value)))
  );
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

function matchesAlertForUser(alert, user) {
  if (!alert || !user) return false;

  if (user.role === 'admin') {
    return true;
  }

  if (alert.targetAudience === 'admin-only') {
    return false;
  }

  if (alert.targetAudience === 'all') {
    return true;
  }

  if (alert.targetAudience !== 'location-based') {
    return false;
  }

  if (!hasCoordinates(user.location) || !hasCoordinates(alert.location)) {
    return false;
  }

  const distance = distanceInMeters(user.location.coordinates, alert.location.coordinates);
  const radiusMeters = Number(alert.location.radius || 10) * 1000;
  return distance <= radiusMeters;
}

module.exports = {
  hasCoordinates,
  distanceInMeters,
  matchesAlertForUser,
};
