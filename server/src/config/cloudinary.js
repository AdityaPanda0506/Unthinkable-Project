const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let storageEngine;
let isCloudinaryConfigured = false;

// Attempt configuration using CLOUDINARY_URL or credentials
if (
  process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  isCloudinaryConfigured = true;
}

if (isCloudinaryConfigured) {
  console.log('Cloudinary photo storage is configured and active.');
  storageEngine = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'society_complaints',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Automatic compression
    },
  });
} else {
  console.log('Cloudinary credentials missing. Falling back to local disk storage for complaint photos.');
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
    },
  });
}

/**
 * Delete image utility helper
 */
const deleteImage = async (photoUrl) => {
  if (!photoUrl) return;

  if (isCloudinaryConfigured && photoUrl.includes('cloudinary.com')) {
    try {
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = `society_complaints/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  } else if (photoUrl.startsWith('/uploads/')) {
    try {
      const filepath = path.join(__dirname, '../../public', photoUrl);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }
  }
};

module.exports = {
  storage: storageEngine,
  deleteImage,
  isCloudinaryConfigured,
};
