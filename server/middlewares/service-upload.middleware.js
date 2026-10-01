
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../uploads/services');

fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = allowedTypes[file.mimetype];
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes[file.mimetype]) {
      return cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Each image must be 5 MB or smaller.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Maximum 5 images are allowed per service.'
          : err.message;

      return res.status(400).json({ success: false, message });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image upload failed.',
      });
    }

    next();
  });
};