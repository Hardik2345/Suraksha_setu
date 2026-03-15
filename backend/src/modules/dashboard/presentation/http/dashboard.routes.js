const express = require('express');
const dashboardController = require('./dashboard.controller');
const { isAuthenticated, isAdmin } = require('../../../../../middleware/auth');

function createCitizenDashboardRouter() {
  const router = express.Router();

  router.get('/stats', isAuthenticated, dashboardController.citizenDashboard);

  return router;
}

function createAdminDashboardRouter() {
  const router = express.Router();

  router.get('/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

  return router;
}

function createLegacyDashboardRouter() {
  const router = express.Router();

  router.get('/stats', isAuthenticated, dashboardController.citizenDashboard);
  router.get('/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

  return router;
}

module.exports = {
  createCitizenDashboardRouter,
  createAdminDashboardRouter,
  createLegacyDashboardRouter,
};
