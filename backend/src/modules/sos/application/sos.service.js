const SOS = require('../../../../models/SOS');

async function listSOSForUser(user, filters = {}) {
  const query = {};

  if (!user || user.role !== 'admin') {
    query.userId = user._id;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const list = await SOS.find(query)
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 });

  return {
    status: 200,
    body: { success: true, data: list },
  };
}

async function createSOSForUser(user, payload) {
  const { type, severity, description, contactNumber, location } = payload;

  if (!type || !description || !location || location.type !== 'Point' || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return {
      status: 400,
      body: { message: 'Missing required fields: type, description, and a GeoJSON location are required' },
    };
  }

  const sos = await SOS.create({
    userId: user._id,
    type,
    severity: severity || 'high',
    description,
    location,
    contactNumber: contactNumber || (user && user.phone),
  });

  return {
    status: 201,
    body: { success: true, data: sos },
  };
}

async function viewSOSForUser(user, sosId) {
  const sos = await SOS.findById(sosId).populate('userId', 'name email phone');

  if (!sos) {
    return { status: 404, body: { message: 'Not found' } };
  }

  if (user.role !== 'admin' && (!sos.userId || !sos.userId._id.equals(user._id))) {
    return { status: 403, body: { message: 'Forbidden' } };
  }

  return {
    status: 200,
    body: { success: true, data: sos },
  };
}

async function updateSOSStatus(sosId, payload) {
  const { status, adminNotes } = payload;
  const sos = await SOS.findById(sosId);

  if (!sos) {
    return { status: 404, body: { message: 'Not found' } };
  }

  sos.status = status || sos.status;
  if (adminNotes) sos.adminNotes = adminNotes;
  await sos.save();

  return {
    status: 200,
    body: { success: true, data: sos },
  };
}

module.exports = {
  listSOSForUser,
  createSOSForUser,
  viewSOSForUser,
  updateSOSStatus,
};
