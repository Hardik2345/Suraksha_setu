/**
 * @swagger
 * tags:
 *   - name: Resources
 *     description: Emergency resource management (hospitals, shelters, etc.)
 */
const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: List resources
 *     tags: [Resources]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of resources
 */
router.get('/api/resources', isAuthenticated, resourceController.listResources);

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Get a single resource
 *     tags: [Resources]
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
 *         description: Resource object
 */
router.get('/api/resources/:id', isAuthenticated, resourceController.getResource);

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Create a new resource (admin)
 *     tags: [Resources]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Resource created
 */
router.post('/api/resources', isAuthenticated, isAdmin, resourceController.createResource);

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Update a resource (admin)
 *     tags: [Resources]
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
 *         description: Resource updated
 */
router.put('/api/resources/:id', isAuthenticated, isAdmin, resourceController.updateResource);

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Delete a resource (admin)
 *     tags: [Resources]
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
 *         description: Resource deleted
 */
router.delete('/api/resources/:id', isAuthenticated, isAdmin, resourceController.deleteResource);

module.exports = router;
