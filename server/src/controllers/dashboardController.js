const prisma = require('../config/db');

/**
 * @desc    Get aggregated operational metrics for the admin overview
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getAdminMetrics = async (req, res) => {
  try {
    // 1. Fetch complaints
    const allComplaints = await prisma.complaint.findMany({
      include: {
        resident: {
          select: { id: true, name: true, flatNumber: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Fetch overdue threshold
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'overdue_threshold_days' },
    });
    const thresholdDays = setting ? parseInt(setting.value) : 3;
    const now = new Date();
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

    let totalComplaints = allComplaints.length;
    let countsByStatus = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
    let countsByCategory = { PLUMBING: 0, ELECTRICAL: 0, SECURITY: 0, CLEANLINESS: 0, OTHER: 0 };
    let overdueCount = 0;
    let overdueList = [];

    allComplaints.forEach((c) => {
      // Group by status
      const status = c.status.toUpperCase();
      if (countsByStatus[status] !== undefined) {
        countsByStatus[status]++;
      }

      // Group by category
      const category = c.category.toUpperCase();
      if (countsByCategory[category] !== undefined) {
        countsByCategory[category]++;
      } else {
        countsByCategory[category] = 1;
      }

      // Overdue calculation
      const createdTime = new Date(c.createdAt).getTime();
      const isOverdue = c.status !== 'RESOLVED' && (now.getTime() - createdTime >= thresholdMs);
      if (isOverdue) {
        overdueCount++;
        overdueList.push({
          ...c,
          isOverdue: true,
        });
      }
    });

    // 3. Fetch active staff lists for assignment drop-downs
    const staffList = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // 4. Build recent complaints feed (limit 5)
    const recentComplaints = allComplaints.slice(0, 5).map((c) => {
      const createdTime = new Date(c.createdAt).getTime();
      return {
        ...c,
        isOverdue: c.status !== 'RESOLVED' && (now.getTime() - createdTime >= thresholdMs),
      };
    });

    // 5. Total Resident count
    const totalResidents = await prisma.user.count({
      where: { role: 'RESIDENT' },
    });

    return res.json({
      totalComplaints,
      countsByStatus,
      countsByCategory,
      overdueCount,
      overdueList,
      recentComplaints,
      staffList,
      totalResidents,
      thresholdDays,
    });
  } catch (error) {
    console.error('Fetch admin metrics dashboard error:', error);
    return res.status(500).json({ message: 'Server error compiling dashboard metrics' });
  }
};

/**
 * @desc    Update overdue threshold days setting
 * @route   PUT /api/admin/dashboard/threshold
 * @access  Private (Admin only)
 */
const updateThreshold = async (req, res) => {
  const { threshold } = req.body;

  try {
    if (!threshold || isNaN(threshold) || parseInt(threshold) <= 0) {
      return res.status(400).json({ message: 'A valid positive threshold number of days is required' });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'overdue_threshold_days' },
      update: { value: String(threshold) },
      create: { key: 'overdue_threshold_days', value: String(threshold) },
    });

    return res.json({ message: 'Overdue threshold setting updated successfully' });
  } catch (error) {
    console.error('Update threshold error:', error);
    return res.status(500).json({ message: 'Server error while saving setting' });
  }
};

module.exports = {
  getAdminMetrics,
  updateThreshold,
};
