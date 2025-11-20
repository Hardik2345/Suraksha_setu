const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/sos', sosController.listSOS);
router.get('/sos/create', sosController.getCreateSOS);
router.post('/sos', sosController.createSOS);
router.get('/sos/:id', sosController.viewSOS);
router.put('/sos/:id/status', isAdmin, sosController.updateStatus);

module.exports = router;
