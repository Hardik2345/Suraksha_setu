const express = require('express');
const alertsController = require('./alerts.controller');
const { isAuthenticated, isAdmin } = require('../../../../../middleware/auth');

function createAlertsRouter() {
  const router = express.Router();

  router.get('/', isAuthenticated, alertsController.getAlerts);
  router.post('/', isAuthenticated, isAdmin, alertsController.createAlert);
  router.get('/history', isAuthenticated, isAdmin, alertsController.getAlertHistory);
  router.put('/:id/read', isAuthenticated, alertsController.markAsRead);
  router.delete('/:id', isAuthenticated, isAdmin, alertsController.deactivateAlert);

  return router;
}

module.exports = { createAlertsRouter };
