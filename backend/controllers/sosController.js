const SOS = require('../models/SOS');

// List SOS reports (citizen sees own, admin sees all)
exports.listSOS = async (req, res, next) => {
  try {
    const query = {};
    if (!req.user || req.user.role !== 'admin') query.userId = req.user._id;
    if (req.query.status) query.status = req.query.status;
    const list = await SOS.find(query).populate('userId', 'name email phone').sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

exports.getCreateSOS = (req, res) => {
  res.json({ message: 'POST /sos to create a new SOS' });
};

exports.createSOS = async (req, res, next) => {
  try {
    // Accept either top-level lat/lng or nested location: { lat, lng }
    const { type, severity, description, lat, lng, address, contactNumber, location } = req.body;

    const rlat = lat ?? (location && location.lat);
    const rlng = lng ?? (location && location.lng);
    const raddress = address ?? (location && location.address);

    if (!type || !description || rlat === undefined || rlng === undefined) {
      return res.status(400).json({ message: 'Missing required fields: type, description, lat and lng are required' });
    }

    const sos = await SOS.create({
      userId: req.user._id,
      type,
      severity: severity || 'high',
      description,
      location: { lat: rlat, lng: rlng, address: raddress },
      contactNumber: contactNumber || (req.user && req.user.phone)
    });

    res.status(201).json({ success: true, data: sos });
  } catch (err) {
    next(err);
  }
};

exports.viewSOS = async (req, res, next) => {
  try {
    const sos = await SOS.findById(req.params.id).populate('userId', 'name email phone');
    if (!sos) return res.status(404).json({ message: 'Not found' });
    // Authorization: owner or admin
    if (req.user.role !== 'admin' && !sos.userId._id.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    res.json({ success: true, data: sos });
  } catch (err) {
    next(err);
  }
};

// Admin only: update status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const sos = await SOS.findById(req.params.id);
    if (!sos) return res.status(404).json({ message: 'Not found' });
    sos.status = status || sos.status;
    if (adminNotes) sos.adminNotes = adminNotes;
    await sos.save();
    res.json({ success: true, data: sos });
  } catch (err) {
    next(err);
  }
};
