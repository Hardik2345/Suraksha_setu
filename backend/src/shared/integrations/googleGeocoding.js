function getAddressComponent(components, type) {
  return components.find((component) => component.types.includes(type))?.long_name;
}

class ReverseGeocodingError extends Error {
  constructor(message, code = 'GEOCODING_ERROR', status = 502) {
    super(message);
    this.name = 'ReverseGeocodingError';
    this.code = code;
    this.status = status;
  }
}

function normalizeGeocodingResult(result) {
  const components = result.address_components || [];

  return {
    address: result.formatted_address,
    city:
      getAddressComponent(components, 'locality') ||
      getAddressComponent(components, 'sublocality_level_1') ||
      getAddressComponent(components, 'administrative_area_level_2'),
    state: getAddressComponent(components, 'administrative_area_level_1'),
    pincode: getAddressComponent(components, 'postal_code'),
  };
}

async function reverseGeocodeCoordinates({ lat, lng }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new ReverseGeocodingError('GOOGLE_MAPS_API_KEY is not configured', 'CONFIG_ERROR', 500);
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: apiKey,
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!response.ok) {
    throw new ReverseGeocodingError(
      `Google Geocoding API request failed with status ${response.status}`,
      'UPSTREAM_HTTP_ERROR',
      502
    );
  }

  const payload = await response.json();
  if (payload.status === 'ZERO_RESULTS') {
    return null;
  }

  if (payload.status !== 'OK') {
    throw new ReverseGeocodingError(
      `Google Geocoding API returned ${payload.status}${payload.error_message ? `: ${payload.error_message}` : ''}`,
      payload.status,
      502
    );
  }

  if (!Array.isArray(payload.results) || payload.results.length === 0) {
    return null;
  }

  return normalizeGeocodingResult(payload.results[0]);
}

module.exports = {
  ReverseGeocodingError,
  reverseGeocodeCoordinates,
};
