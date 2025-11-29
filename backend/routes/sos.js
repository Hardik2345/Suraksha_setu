const express = require('express');

const router = express.Router();
const sosController = require('../controllers/sosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Routes mounted at /api/sos
router.get('/', isAuthenticated, sosController.listSOS);
router.post('/', isAuthenticated, sosController.createSOS);
router.get('/:id', isAuthenticated, sosController.viewSOS);
router.put('/:id', isAuthenticated, isAdmin, sosController.updateStatus);

module.exports = router;
