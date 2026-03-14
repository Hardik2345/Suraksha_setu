const express = require('express');
const resourcesController = require('./resources.controller');
const { isAuthenticated, isAdmin } = require('../../../../../middleware/auth');

function createResourcesRouter() {
  const router = express.Router();

  router.get('/', resourcesController.listResources);
  router.get('/:id', resourcesController.getResource);
  router.post('/', isAuthenticated, isAdmin, resourcesController.createResource);
  router.put('/:id', isAuthenticated, isAdmin, resourcesController.updateResource);
  router.delete('/:id', isAuthenticated, isAdmin, resourcesController.deleteResource);

  return router;
}

module.exports = { createResourcesRouter };
