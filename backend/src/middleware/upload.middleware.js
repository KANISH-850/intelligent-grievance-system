// Multer middleware for handling file uploads
// Uses the local storage directory defined in storage.service.js

const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR } = require('../services/storage.service');

// Configure Multer storage to use the upload directory with safe filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Preserve original extension, generate random name for safety
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

// File filter to accept only JPEG, PNG, WebP and limit size
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file type. Only JPEG, PNG, and WebP are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MiB per file
});

module.exports = { upload };
