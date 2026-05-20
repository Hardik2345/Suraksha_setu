const Resource = require('../../../../models/Resource');
const { reverseGeocodeCoordinates } = require('../../../shared/integrations/googleGeocoding');

function normalizeCoordinates(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [lng, lat] = coordinates.map(Number);
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return null;
  }

  return [lng, lat];
}

async function enrichLocation(location) {
  const coordinates = normalizeCoordinates(location && location.coordinates);
  if (!coordinates) {
    return null;
  }

  let enrichedLocation = {
    type: 'Point',
    coordinates,
    address: location.address,
    city: location.city,
    state: location.state,
    pincode: location.pincode,
  };

  const hasReadableLocation =
    enrichedLocation.address || enrichedLocation.city || enrichedLocation.state || enrichedLocation.pincode;

  if (!hasReadableLocation) {
    try {
      const [lng, lat] = coordinates;
      const geocoded = await reverseGeocodeCoordinates({ lat, lng });
      if (geocoded) {
        enrichedLocation = {
          ...enrichedLocation,
          ...geocoded,
        };
      }
    } catch (error) {
      console.warn('Reverse geocoding failed while saving resource:', error.message);
    }
  }

  if (!enrichedLocation.address) {
    enrichedLocation.address = `Approximate coordinates: ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`;
  }

  return enrichedLocation;
}

async function listResources(filters = {}) {
  const { type, search, coordinates, radius = 10 } = filters;

  const query = { isActive: true };
  if (type) query.type = type;
  if (search) query.$text = { $search: search };

  let resources;
  if (coordinates) {
    const parsedCoords = String(coordinates).split(',').map((value) => parseFloat(value));
    if (parsedCoords.length !== 2 || parsedCoords.some((value) => Number.isNaN(value))) {
      return {
        status: 400,
        body: { success: false, message: 'coordinates must be provided as "lng,lat"' },
      };
    }

    resources = await Resource.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: parsedCoords },
          $maxDistance: radius * 1000,
        },
      },
    }).populate('createdBy', 'name');
  } else {
    resources = await Resource.find(query).populate('createdBy', 'name');
  }

  return {
    status: 200,
    body: { success: true, count: resources.length, data: resources },
  };
}

async function getResource(resourceId) {
  const resource = await Resource.findById(resourceId).populate('createdBy', 'name');
  if (!resource || !resource.isActive) {
    return { status: 404, body: { success: false, message: 'Resource not found' } };
  }

  return {
    status: 200,
    body: { success: true, data: resource },
  };
}

async function createResource(user, payload) {
  const { name, type, location, phone, email, website, services, capacity, operatingHours } = payload;

  if (
    !name ||
    !type ||
    !location ||
    location.type !== 'Point' ||
    !phone
  ) {
    return { status: 400, body: { success: false, message: 'Missing required fields' } };
  }

  const enrichedLocation = await enrichLocation(location);
  if (!enrichedLocation) {
    return {
      status: 400,
      body: { success: false, message: 'location must be a valid GeoJSON Point' },
    };
  }

  const resource = await Resource.create({
    name,
    type,
    location: enrichedLocation,
    contact: { phone, email, website },
    services: services || [],
    capacity,
    operatingHours,
    createdBy: user && user._id,
  });

  return {
    status: 201,
    body: { success: true, message: 'Resource created successfully', data: resource },
  };
}

async function updateResource(resourceId, payload) {
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return { status: 404, body: { success: false, message: 'Resource not found' } };
  }

  const allowedUpdates = [
    'name',
    'type',
    'phone',
    'email',
    'website',
    'services',
    'capacity',
    'currentOccupancy',
    'operatingHours',
    'isActive',
  ];

  allowedUpdates.forEach((field) => {
    if (payload[field] !== undefined) {
      if (['phone', 'email', 'website'].includes(field)) {
        resource.contact[field] = payload[field];
      } else {
        resource[field] = payload[field];
      }
    }
  });

  if (payload.location !== undefined) {
    const { location } = payload;
    if (!location || location.type !== 'Point') {
      return {
        status: 400,
        body: { success: false, message: 'location must be a valid GeoJSON Point' },
      };
    }

    const enrichedLocation = await enrichLocation(location);
    if (!enrichedLocation) {
      return {
        status: 400,
        body: { success: false, message: 'location must be a valid GeoJSON Point' },
      };
    }

    resource.location = enrichedLocation;
  }

  await resource.save();

  return {
    status: 200,
    body: { success: true, message: 'Resource updated successfully', data: resource },
  };
}

async function deleteResource(resourceId) {
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return { status: 404, body: { success: false, message: 'Resource not found' } };
  }

  resource.isActive = false;
  await resource.save();

  return {
    status: 200,
    body: { success: true, message: 'Resource deleted successfully' },
  };
}

module.exports = {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
};
