const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Citizen dashboard - mounted at /api/dashboard
router.get('/stats', isAuthenticated, dashboardController.citizenDashboard);

// Admin dashboard - mounted at /api/admin
router.get('/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

module.exports = router;
