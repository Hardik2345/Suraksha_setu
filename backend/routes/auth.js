const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');

router.post('/register', redirectIfAuthenticated, authController.postRegister);
router.post('/login', redirectIfAuthenticated, authController.postLogin);
router.get('/logout', isAuthenticated, authController.logout);
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
