const express = require('express');
const sosController = require('./sos.controller');
const { isAuthenticated, isAdmin } = require('../../../../../middleware/auth');

function createSOSRouter() {
  const router = express.Router();

  router.get('/', isAuthenticated, sosController.listSOS);
  router.post('/', isAuthenticated, sosController.createSOS);
  router.get('/:id', isAuthenticated, sosController.viewSOS);
  router.put('/:id', isAuthenticated, isAdmin, sosController.updateStatus);

  return router;
}

module.exports = { createSOSRouter };
