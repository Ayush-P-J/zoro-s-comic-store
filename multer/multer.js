const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage(); // Store in memory to process with Sharp

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
      const fileTypes = /jpeg|jpg|png/;
      const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = fileTypes.test(file.mimetype);
      if (extname && mimeType) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, JPG, PNG) are allowed.'));
      }
    }
  });



module.exports = {
    upload

}