/**
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Dashboard data and statistics
 */
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Citizen dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Citizen dashboard data
 */
router.get('/dashboard', isAuthenticated, dashboardController.citizenDashboard);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */
router.get('/admin/dashboard', isAuthenticated, isAdmin, dashboardController.adminDashboard);

module.exports = router;
