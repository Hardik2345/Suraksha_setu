const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/dashboard', isAuthenticated, dashboardController.citizenDashboard);
router.get('/admin/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

module.exports = router;
