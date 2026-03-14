import type { GeoLocation } from '../../types';

export function hasUsableLocation(location?: GeoLocation | null): location is GeoLocation {
  if (!location || location.type !== 'Point' || !Array.isArray(location.coordinates)) {
    return false;
  }

  if (location.coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = location.coordinates;
  return Number.isFinite(lng) && Number.isFinite(lat);
}
