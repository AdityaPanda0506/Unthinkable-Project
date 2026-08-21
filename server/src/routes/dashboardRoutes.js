const express = require('express');
const router = express.Router();
const { getAdminMetrics, updateThreshold } = require('../controllers/dashboardController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.get('/', authenticateJWT, requireRole(['ADMIN']), getAdminMetrics);
router.put('/threshold', authenticateJWT, requireRole(['ADMIN']), updateThreshold);

module.exports = router;
