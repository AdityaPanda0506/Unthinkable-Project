const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const prisma = require('./config/db');

const app = express();

// Middleware Configuration
app.use(cors({
  origin: '*', // Allow all origins for local testing
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure public uploads and temp directory exist for fallback storage
const uploadsDir = path.join(__dirname, '../public/uploads');
const tempDir = path.join(__dirname, '../public/temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Serve public uploads statically for local fallback
app.use('/uploads', express.static(uploadsDir));

// Route Mountings
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Server Error]:', err.stack || err.message || err);

  // 1. Prisma Unique Constraint Violation (e.g. Duplicate Email)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Email address already registered',
    });
  }

  // 2. Multer File Size Limit Exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size limit exceeded. Maximum file size is 5MB.',
    });
  }

  // 3. Multer Custom File Filter Validation Error
  if (err.message && err.message.includes('Only JPG, PNG, and WebP are allowed')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
});

/**
 * Automatically seeds the database setting: overdue_threshold_days = "3"
 */
async function seedSettings() {
  try {
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { key: 'overdue_threshold_days' },
    });
    if (!existingSetting) {
      await prisma.systemSetting.create({
        data: {
          key: 'overdue_threshold_days',
          value: '3',
        },
      });
      console.log('Database seeded: overdue_threshold_days set to "3" successfully.');
    }
  } catch (error) {
    console.error('Failed to seed default settings database table:', error);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Execute seeding
  await seedSettings();
});
