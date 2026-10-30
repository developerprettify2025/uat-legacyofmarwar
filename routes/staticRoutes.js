const express = require('express');
const router = express.Router();
const multer = require('multer');
const staticController = require('../API/staticController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

router.get('/all-statics', verifyToken, staticController.getAllStatics);
router.get('/fill-static-data', verifyToken, staticController.getStaticById);
router.post(
  '/save-or-update-static',
  verifyToken,
  upload.fields([
    { name: 'StaticImage', maxCount: 1 },
    { name: 'StaticBannerVideo', maxCount: 1 }
  ]),
  staticController.saveOrUpdateStatic
);
router.delete('/delete-static/:StaticID', verifyToken, staticController.deleteStatic);
router.get('/meta_data/:ID', verifyToken, staticController.getMataDataById);
router.get('/meta_data_by_url/:url', verifyToken, staticController.getMataDataByUrl);


module.exports = router;