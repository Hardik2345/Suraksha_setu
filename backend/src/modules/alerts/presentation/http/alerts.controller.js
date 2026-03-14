const alertsService = require('../../application/alerts.service');

exports.getAlerts = async (req, res, next) => {
  try {
    const result = await alertsService.listAlertsForUser(req.user);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    next(err);
  }
};

exports.createAlert = async (req, res, next) => {
  try {
    const result = await alertsService.createAlertForUser(req.user, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error creating alert:', err);
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const result = await alertsService.markAlertAsRead(req.params.id, req.user);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error marking alert as read:', err);
    next(err);
  }
};

exports.getAlertHistory = async (req, res, next) => {
  try {
    const result = await alertsService.getAlertHistory();
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error fetching alert history:', err);
    next(err);
  }
};

exports.deactivateAlert = async (req, res, next) => {
  try {
    const result = await alertsService.deactivateAlert(req.params.id);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error deactivating alert:', err);
    next(err);
  }
};
