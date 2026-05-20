const express = require('express');
const outbreakMapController = require('./outbreakMap.controller');
const { isAuthenticated, isAdmin } = require('../../../../../middleware/auth');

function createOutbreakMapRouter() {
  const router = express.Router();

  router.get('/outbreak-map', isAuthenticated, isAdmin, outbreakMapController.getOutbreakMap);

  return router;
}

module.exports = { createOutbreakMapRouter };
