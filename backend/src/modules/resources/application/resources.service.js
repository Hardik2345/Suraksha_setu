const Resource = require('../../../../models/Resource');

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
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2 ||
    !location.address ||
    !phone
  ) {
    return { status: 400, body: { success: false, message: 'Missing required fields' } };
  }

  const resource = await Resource.create({
    name,
    type,
    location,
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
    if (
      !location ||
      location.type !== 'Point' ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      !location.address
    ) {
      return {
        status: 400,
        body: { success: false, message: 'location must be a valid GeoJSON Point with address' },
      };
    }
    resource.location = location;
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
