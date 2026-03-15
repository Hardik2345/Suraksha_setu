const SOS = require('../../../../models/SOS');

async function getCitizenDashboard(user) {
  const userId = user._id;
  const recentSOS = await SOS.find({ userId }).sort({ createdAt: -1 }).limit(10);

  const total = await SOS.countDocuments({ userId });
  const pending = await SOS.countDocuments({ userId, status: 'pending' });
  const resolved = await SOS.countDocuments({ userId, status: 'resolved' });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        recentSOS,
        stats: { total, pending, resolved },
      },
    },
  };
}

async function getAdminDashboard() {
  const pendingList = await SOS.find({ status: 'pending' })
    .populate('userId', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(50);

  const statuses = await SOS.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const severities = await SOS.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]);
  const total = await SOS.countDocuments();

  return {
    status: 200,
    body: {
      success: true,
      data: {
        total,
        statuses,
        severities,
        pendingList,
      },
    },
  };
}

module.exports = {
  getCitizenDashboard,
  getAdminDashboard,
};
