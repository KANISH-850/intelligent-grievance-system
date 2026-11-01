// Storage Service for handling file uploads
// Uses a local directory (configurable via env var UPLOAD_DIR) for development.
// Provides a simple abstraction so it can be swapped with S3 later.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Store a buffer (or file) on disk with a safe unique filename.
 * Returns the absolute path where the file was stored.
 */
async function storeFile(originalName, mimeType, buffer) {
  // Generate a random filename preserving extension
  const ext = path.extname(originalName).toLowerCase();
  const safeName = crypto.randomBytes(16).toString('hex') + ext;
  const destPath = path.join(UPLOAD_DIR, safeName);

  await fs.promises.writeFile(destPath, buffer);
  return destPath;
}

module.exports = {
  storeFile,
  UPLOAD_DIR,
};
