const express = require('express');
const geocodingController = require('./geocoding.controller');
const { isAuthenticated } = require('../../../../../middleware/auth');

function createGeocodingRouter() {
  const router = express.Router();

  router.get('/reverse', isAuthenticated, geocodingController.reverseGeocode);

  return router;
}

module.exports = { createGeocodingRouter };
