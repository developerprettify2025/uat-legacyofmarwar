const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.baseUrl.split('/').pop();
    cb(null, path.join(__dirname, `../uploads/OnlineImages/${type.charAt(0).toUpperCase() + type.slice(1)}Images`));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

module.exports = upload;