const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Routes mounted at /api/alerts
router.get('/', isAuthenticated, alertController.getAlerts);
router.post('/', isAuthenticated, isAdmin, alertController.createAlert);
router.get('/history', isAuthenticated, isAdmin, alertController.getAlertHistory);
router.put('/:id/read', isAuthenticated, alertController.markAsRead);
router.delete('/:id', isAuthenticated, isAdmin, alertController.deactivateAlert);

module.exports = router;
