/**
 * @swagger
 * tags:
 *   - name: SOS
 *     description: Emergency SOS reporting and management
 */
const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated);

/**
 * @swagger
 * /sos:
 *   get:
 *     summary: List SOS reports
 *     tags: [SOS]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type of SOS
 *     responses:
 *       200:
 *         description: List of SOS reports
 */
router.get('/sos', sosController.listSOS);

/**
 * @swagger
 * /sos:
 *   post:
 *     summary: Create a new SOS report
 *     tags: [SOS]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, description, lat, lng]
 *             properties:
 *               type: { type: string }
 *               severity: { type: string }
 *               description: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *           example:
 *             type: flood
 *             severity: high
 *             description: Water rising quickly
 *             lat: 28.7041
 *             lng: 77.1025
 *     responses:
 *       201:
 *         description: SOS created
 */
router.post('/sos', sosController.createSOS);

/**
 * @swagger
 * /sos/{id}:
 *   get:
 *     summary: Get a specific SOS report
 *     tags: [SOS]
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
 *         description: SOS report
 */
router.get('/sos/:id', sosController.viewSOS);

/**
 * @swagger
 * /sos/{id}/status:
 *   put:
 *     summary: Update SOS status (admin)
 *     tags: [SOS]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/sos/:id/status', isAdmin, sosController.updateStatus);

module.exports = router;
