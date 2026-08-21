const prisma = require('../config/db');
const { deleteImage } = require('../config/cloudinary');
const { sendStatusChangeNotification } = require('../services/emailService');

/**
 * Helper to calculate dynamic SLA Overdue flag based on System Settings threshold
 */
const checkOverdueStatus = (complaint, thresholdDays) => {
  if (complaint.status === 'RESOLVED') {
    return false;
  }

  const now = new Date();
  const created = new Date(complaint.createdAt);
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  
  return (now.getTime() - created.getTime()) >= thresholdMs;
};

/**
 * @desc    Submit a new complaint
 * @route   POST /api/complaints
 * @access  Private (Resident only)
 */
const createComplaint = async (req, res) => {
  const { title, description, category } = req.body;

  try {
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const photoUrl = req.file ? req.file.path : null;

    // Execute Complaint Creation & History Logging inside transaction
    const complaint = await prisma.$transaction(async (tx) => {
      // 1. Create Complaint
      const newComplaint = await tx.complaint.create({
        data: {
          title,
          description,
          category,
          photoUrl,
          residentId: req.user.userId,
          priority: 'MEDIUM', // default
          status: 'OPEN',     // default
        },
      });

      // 2. Log History
      await tx.complaintHistory.create({
        data: {
          complaintId: newComplaint.id,
          changedById: req.user.userId,
          fromStatus: null,
          toStatus: 'OPEN',
          adminNote: 'Complaint raised by resident',
        },
      });

      return newComplaint;
    });

    return res.status(201).json(complaint);
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ message: 'Server error while submitting complaint' });
  }
};

/**
 * @desc    Fetch resident's complaints
 * @route   GET /api/complaints/my
 * @access  Private (Resident only)
 */
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { residentId: req.user.userId },
      include: {
        history: {
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Load overdue threshold for rendering dynamic flags
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'overdue_threshold_days' },
    });
    const thresholdDays = setting ? parseInt(setting.value) : 3;

    const enriched = complaints.map(c => ({
      ...c,
      isOverdue: checkOverdueStatus(c, thresholdDays),
    }));

    return res.json(enriched);
  } catch (error) {
    console.error('Fetch my complaints error:', error);
    return res.status(500).json({ message: 'Server error fetching your complaints' });
  }
};

/**
 * @desc    Fetch all complaints with query filters (Admin)
 * @route   GET /api/complaints
 * @access  Private (Admin only)
 */
const getAllComplaints = async (req, res) => {
  const { status, category, priority, search } = req.query;

  try {
    let whereClause = {};

    // Filters
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    if (category) {
      whereClause.category = category;
    }
    if (priority) {
      whereClause.priority = priority.toUpperCase();
    }

    // Search query on title, description, resident name or flat
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        {
          resident: {
            OR: [
              { name: { contains: search } },
              { flatNumber: { contains: search } },
            ],
          },
        },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        resident: {
          select: { id: true, name: true, email: true, phone: true, flatNumber: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Load System Setting for overdue threshold
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'overdue_threshold_days' },
    });
    const thresholdDays = setting ? parseInt(setting.value) : 3;

    // Calculate dynamic properties
    const enriched = complaints.map((complaint) => {
      const isOverdue = checkOverdueStatus(complaint, thresholdDays);
      return {
        ...complaint,
        isOverdue,
      };
    });

    // Sort by: isOverdue DESC, then createdAt DESC
    enriched.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json(enriched);
  } catch (error) {
    console.error('Fetch all complaints error:', error);
    return res.status(500).json({ message: 'Server error while retrieving complaints registry' });
  }
};

/**
 * @desc    Get complaint detail & audit logs
 * @route   GET /api/complaints/:id
 * @access  Private (Admin or submitting Resident)
 */
const getComplaintById = async (req, res) => {
  const { id } = req.params;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        resident: {
          select: { id: true, name: true, email: true, phone: true, flatNumber: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        history: {
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role-based route guard
    if (req.user.role === 'RESIDENT' && complaint.residentId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'overdue_threshold_days' },
    });
    const thresholdDays = setting ? parseInt(setting.value) : 3;

    return res.json({
      ...complaint,
      isOverdue: checkOverdueStatus(complaint, thresholdDays),
    });
  } catch (error) {
    console.error('Fetch complaint details error:', error);
    return res.status(500).json({ message: 'Server error fetching complaint details' });
  }
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNote, assignedToId } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: 'Target status state is required' });
    }

    const targetStatus = status.toUpperCase();
    if (targetStatus !== 'OPEN' && targetStatus !== 'IN_PROGRESS' && targetStatus !== 'RESOLVED') {
      return res.status(400).json({ message: 'Invalid target status state' });
    }

    // Run interactive transaction for atomic safety
    const result = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.findUnique({
        where: { id },
        include: { resident: true },
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      if (complaint.status === 'RESOLVED') {
        throw new Error('Complaint already resolved');
      }

      const fromStatus = complaint.status;
      let updateData = { status: targetStatus };
      if (targetStatus === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId;
      }

      const updated = await tx.complaint.update({
        where: { id },
        data: updateData,
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          changedById: req.user.userId,
          fromStatus,
          toStatus: targetStatus,
          adminNote: adminNote || `Status updated to ${targetStatus}`,
        },
      });

      return { updated, residentEmail: complaint.resident?.email, title: complaint.title, fromStatus };
    });

    // Asynchronously send status change email notification (fire-and-forget)
    sendStatusChangeNotification(
      result.residentEmail,
      result.title,
      result.fromStatus,
      targetStatus,
      adminNote
    );

    return res.json(result.updated);
  } catch (error) {
    console.error('Update status error:', error);
    if (error.message === 'Complaint already resolved') {
      return res.status(400).json({ message: 'Complaint already resolved' });
    }
    if (error.message === 'Complaint not found') {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    return res.status(500).json({ message: 'Server error while updating status' });
  }
};


/**
 * @desc    Update complaint priority
 * @route   PATCH /api/complaints/:id/priority
 * @access  Private (Admin only)
 */
const updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority, adminNote } = req.body;

  try {
    if (!priority) {
      return res.status(400).json({ message: 'Priority level is required' });
    }

    const targetPriority = priority.toUpperCase();
    if (targetPriority !== 'LOW' && targetPriority !== 'MEDIUM' && targetPriority !== 'HIGH') {
      return res.status(400).json({ message: 'Invalid priority level' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const fromPriority = complaint.priority;

    // Update Complaint and Log in Transaction
    const [updatedComplaint] = await prisma.$transaction([
      prisma.complaint.update({
        where: { id },
        data: { priority: targetPriority },
      }),
      prisma.complaintHistory.create({
        data: {
          complaintId: id,
          changedById: req.user.userId,
          fromStatus: complaint.status,
          toStatus: complaint.status,
          adminNote: adminNote || `Priority updated from ${fromPriority} to ${targetPriority}`,
        },
      }),
    ]);

    return res.json(updatedComplaint);
  } catch (error) {
    console.error('Update priority error:', error);
    return res.status(500).json({ message: 'Server error while updating priority' });
  }
};

/**
 * @desc    Delete complaint (Admin only)
 * @route   DELETE /api/complaints/:id
 * @access  Private (Admin only)
 */
const deleteComplaint = async (req, res) => {
  const { id } = req.params;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.photoUrl) {
      await deleteImage(complaint.photoUrl);
    }

    await prisma.complaint.delete({
      where: { id },
    });

    return res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    return res.status(500).json({ message: 'Server error deleting complaint' });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateStatus,
  updatePriority,
  deleteComplaint,
  checkOverdueStatus,
};
