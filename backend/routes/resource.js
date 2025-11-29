const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Routes mounted at /api/resources
router.get('/', resourceController.listResources);
router.get('/:id', resourceController.getResource);
router.post('/', isAuthenticated, isAdmin, resourceController.createResource);
router.put('/:id', isAuthenticated, isAdmin, resourceController.updateResource);
router.delete('/:id', isAuthenticated, isAdmin, resourceController.deleteResource);

module.exports = router;
