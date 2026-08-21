const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);

module.exports = router;
