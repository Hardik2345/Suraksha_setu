const express = require('express');
const authController = require('./auth.controller');
const { isAuthenticated, redirectIfAuthenticated } = require('../../../../../middleware/auth');

function createAuthRouter() {
  const router = express.Router();

  router.post('/register', redirectIfAuthenticated, authController.postRegister);
  router.post('/login', redirectIfAuthenticated, authController.postLogin);
  router.get('/logout', isAuthenticated, authController.logout);
  router.post('/logout', isAuthenticated, authController.logout);
  router.get('/me', isAuthenticated, authController.getProfile);
  router.get('/profile', isAuthenticated, authController.getProfile);
  router.patch('/location', isAuthenticated, authController.updateLocation);

  return router;
}

module.exports = { createAuthRouter };
