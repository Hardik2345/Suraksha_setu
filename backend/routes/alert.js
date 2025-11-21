/**
 * @swagger
 * tags:
 *   - name: Alerts
 *     description: Alert broadcasting and notification system
 */
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get alerts for user
 *     tags: [Alerts]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of relevant alerts
 */
router.get('/api/alerts', isAuthenticated, alertController.getAlerts);

/**
 * @swagger
 * /api/alerts/{id}/read:
 *   put:
 *     summary: Mark alert as read
 *     tags: [Alerts]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert marked as read
 */
router.put('/api/alerts/:id/read', isAuthenticated, alertController.markAsRead);

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Create/broadcast an alert (admin)
 *     tags: [Alerts]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Alert created and broadcast
 */
router.post('/api/alerts', isAuthenticated, isAdmin, alertController.createAlert);

/**
 * @swagger
 * /api/alerts/history:
 *   get:
 *     summary: Get alert history (admin)
 *     tags: [Alerts]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Alert history list
 */
router.get('/api/alerts/history', isAuthenticated, isAdmin, alertController.getAlertHistory);

/**
 * @swagger
 * /api/alerts/{id}:
 *   delete:
 *     summary: Deactivate an alert (admin)
 *     tags: [Alerts]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deactivated
 */
router.delete('/api/alerts/:id', isAuthenticated, isAdmin, alertController.deactivateAlert);

module.exports = router;
