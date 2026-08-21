const multer = require('multer');
const path = require('path');
const { storage, isCloudinaryConfigured } = require('../config/cloudinary');

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Strictly allow image/jpeg, image/png, and image/webp
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      // Rejects the upload with custom Error
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * Middleware wrapper to handle photo file uploads and format paths.
 */
const uploadSinglePhoto = (req, res, next) => {
  multerUpload.single('photo')(req, res, (err) => {
    if (err) {
      // Pass the error to the global error handler
      return next(err);
    }

    // For local storage, convert internal file path to dynamic public web URL
    if (req.file && !isCloudinaryConfigured) {
      req.file.path = `/uploads/${path.basename(req.file.filename)}`;
    }

    next();
  });
};

module.exports = uploadSinglePhoto;
