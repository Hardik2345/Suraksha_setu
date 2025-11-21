/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization endpoints
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, redirectIfAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, passwordConfirm, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               passwordConfirm:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [citizen, admin]
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             password: SecurePass123!
 *             passwordConfirm: SecurePass123!
 *             phone: '9876543210'
 *             role: citizen
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation error
 */
router.post('/register', redirectIfAuthenticated, authController.postRegister);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             email: john@example.com
 *             password: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', redirectIfAuthenticated, authController.postLogin);

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.get('/logout', isAuthenticated, authController.logout);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
