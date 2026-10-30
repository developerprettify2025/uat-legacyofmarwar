const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const destination = path.join(__dirname, "../uploads/OnlineImages/MediaImages");
const allowedTypes = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogv",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdir(destination, { recursive: true }, (error) => {
      callback(error, destination);
    });
  },
  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}${allowedTypes[file.mimetype]}`);
  },
});

module.exports = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (!allowedTypes[file.mimetype]) {
      return callback(new Error("Media file must be an MP4, WebM, or Ogg video."));
    }
    return callback(null, true);
  },
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
});
