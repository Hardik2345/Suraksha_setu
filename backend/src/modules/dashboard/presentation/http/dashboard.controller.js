const dashboardService = require('../../application/dashboard.service');

exports.citizenDashboard = async (req, res, next) => {
  try {
    const result = await dashboardService.getCitizenDashboard(req.user);
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};

exports.adminDashboard = async (req, res, next) => {
  try {
    const result = await dashboardService.getAdminDashboard();
    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
};
