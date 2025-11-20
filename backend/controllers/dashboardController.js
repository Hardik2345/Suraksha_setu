const SOS = require('../models/SOS');

// Citizen dashboard: recent SOS for the logged-in user and simple stats
exports.citizenDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const recentSOS = await SOS.find({ userId }).sort({ createdAt: -1 }).limit(10);

    const total = await SOS.countDocuments({ userId });
    const pending = await SOS.countDocuments({ userId, status: 'pending' });
    const resolved = await SOS.countDocuments({ userId, status: 'resolved' });

    res.json({
      success: true,
      data: {
        recentSOS,
        stats: { total, pending, resolved }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Admin dashboard: global aggregates and list of pending SOS
exports.adminDashboard = async (req, res, next) => {
  try {
    const pendingList = await SOS.find({ status: 'pending' }).populate('userId', 'name email phone').sort({ createdAt: -1 }).limit(50);

    // counts by status
    const statuses = await SOS.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // counts by severity
    const severities = await SOS.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // overall totals
    const total = await SOS.countDocuments();

    res.json({
      success: true,
      data: {
        total,
        statuses,
        severities,
        pendingList
      }
    });
  } catch (err) {
    next(err);
  }
};
