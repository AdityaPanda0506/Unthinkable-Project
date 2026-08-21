const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateStatus,
  updatePriority,
  deleteComplaint,
} = require('../controllers/complaintController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const uploadSinglePhoto = require('../middleware/upload');

// Resident routes
router.post('/', authenticateJWT, uploadSinglePhoto, createComplaint);
router.get('/my', authenticateJWT, getMyComplaints);

// Admin routes
router.get('/', authenticateJWT, requireRole(['ADMIN']), getAllComplaints);
router.patch('/:id/status', authenticateJWT, requireRole(['ADMIN']), updateStatus);
router.patch('/:id/priority', authenticateJWT, requireRole(['ADMIN']), updatePriority);
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), deleteComplaint);

// Shared details route
router.get('/:id', authenticateJWT, getComplaintById);

module.exports = router;
