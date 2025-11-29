const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');

// Routes mounted at /api/auth
router.post('/register', redirectIfAuthenticated, authController.postRegister);
router.post('/login', redirectIfAuthenticated, authController.postLogin);
// Support both GET and POST for logout
router.get('/logout', isAuthenticated, authController.logout);
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.getProfile);
// Keep /profile as alias for backwards compatibility
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
