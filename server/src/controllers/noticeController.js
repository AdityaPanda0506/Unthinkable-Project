const prisma = require('../config/db');
const { sendImportantNoticeBroadcast } = require('../services/emailService');

/**
 * @desc    Get all notices
 * @route   GET /api/notices
 * @access  Private (All roles)
 */
const getNotices = async (req, res) => {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
      // Pinned notices first, then sorted by newest
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return res.json(notices);
  } catch (error) {
    console.error('Fetch notices error:', error);
    return res.status(500).json({ message: 'Server error fetching notices' });
  }
};

/**
 * @desc    Create a new notice bulletin
 * @route   POST /api/notices
 * @access  Private (Admin only)
 */
const createNotice = async (req, res) => {
  const { title, content, isImportant } = req.body;

  try {
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isImportant: isImportant || false,
        authorId: req.user.userId,
      },
    });

    // If marked important, fetch all residents and broadcast asynchronously
    if (notice.isImportant) {
      const residents = await prisma.user.findMany({
        where: { role: 'RESIDENT' },
        select: { email: true },
      });

      const recipientEmails = residents.map((r) => r.email).filter(Boolean);
      if (recipientEmails.length > 0) {
        sendImportantNoticeBroadcast(recipientEmails, notice.title, notice.content);
      }
    }

    return res.status(201).json(notice);
  } catch (error) {
    console.error('Create notice error:', error);
    return res.status(500).json({ message: 'Server error while publishing notice' });
  }
};

/**
 * @desc    Delete notice bulletin
 * @route   DELETE /api/notices/:id
 * @access  Private (Admin only)
 */
const deleteNotice = async (req, res) => {
  const { id } = req.params;

  try {
    const notice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await prisma.notice.delete({
      where: { id },
    });

    return res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Delete notice error:', error);
    return res.status(500).json({ message: 'Server error while deleting notice' });
  }
};

module.exports = {
  getNotices,
  createNotice,
  deleteNotice,
};
