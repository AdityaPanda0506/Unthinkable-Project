const express = require('express');
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.get('/', authenticateJWT, getNotices);
router.post('/', authenticateJWT, requireRole(['ADMIN']), createNotice);
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), deleteNotice);

module.exports = router;
