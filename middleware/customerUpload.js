const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const destination = path.join(__dirname, "../uploads/OnlineImages/CustomerImages");
const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

module.exports = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(destination, { recursive: true }, (error) =>
        callback(error, destination),
      );
    },
    filename: (req, file, callback) => {
      callback(null, `${randomUUID()}${allowedTypes[file.mimetype]}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(new Error("Customer image must be a JPEG, PNG, GIF, WebP, or AVIF image."));
    }
    return callback(null, true);
  },
  limits: { files: 1, fileSize: 10 * 1024 * 1024 },
});
