const { ReverseGeocodingError, reverseGeocodeCoordinates } = require('../../../shared/integrations/googleGeocoding');

function validateCoordinates(lat, lng) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
    return null;
  }

  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return null;
  }

  return { lat: parsedLat, lng: parsedLng };
}

async function reverseGeocode(params) {
  const coordinates = validateCoordinates(params.lat, params.lng);
  if (!coordinates) {
    return {
      status: 400,
      body: { success: false, message: 'Valid lat and lng query parameters are required' },
    };
  }

  let result;
  try {
    result = await reverseGeocodeCoordinates(coordinates);
  } catch (error) {
    if (error instanceof ReverseGeocodingError) {
      console.warn('Reverse geocoding failed:', error.message);
      return {
        status: error.status,
        body: { success: false, message: error.message, code: error.code },
      };
    }

    throw error;
  }

  if (!result) {
    return {
      status: 404,
      body: { success: false, message: 'No address could be resolved for these coordinates' },
    };
  }

  return {
    status: 200,
    body: { success: true, data: result },
  };
}

module.exports = {
  reverseGeocode,
};
