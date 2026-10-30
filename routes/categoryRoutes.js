const express = require('express');
const router = express.Router();
const categoryController = require('../API/categoryController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');

router.get('/all-categorys', verifyToken, categoryController.getAllCategorys);
router.get('/fill-category-data', verifyToken, categoryController.getCategoryById);
router.post(
  '/save-or-update-category',
  upload.fields([
    { name: 'CategoryImage', maxCount: 1 },
    { name: 'CategoryBannerImage', maxCount: 1 },
    { name: 'CategoryVideo', maxCount: 1 },
  ]),
  verifyToken,
  categoryController.saveOrUpdateCategory
);
router.post('/update-display-order', verifyToken, categoryController.updateDisplayOrder);
router.get('/max-display-order', verifyToken, categoryController.getMaxDisplayOrder);
router.delete('/delete-category/:CategoryID', verifyToken, categoryController.deleteCategory);
router.post("/update-status", verifyToken, categoryController.updateActiveStatus);
router.get('/categorys', verifyToken, categoryController.getAllActiveCategorys);
router.get('/fetch-category/:slug', verifyToken, categoryController.getCategoryDataBySlug);

module.exports = router;