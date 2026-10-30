const express = require('express');
const router = express.Router();
const blogController = require('../API/blogController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');

router.get('/all-blogs', verifyToken, blogController.getAllBlogs);
router.get('/fill-blog-data', verifyToken, blogController.getBlogById);
router.post(
  '/save-or-update-blog',
  upload.fields([
    { name: 'BlogImage', maxCount: 1 },
    { name: 'BlogBannerImage', maxCount: 1 },
  ]),
  verifyToken,
  blogController.saveOrUpdateBlog
);
router.post('/update-display-order', verifyToken, blogController.updateDisplayOrder);
router.get('/max-display-order', verifyToken, blogController.getMaxDisplayOrder);
router.delete('/delete-blog/:BlogID', verifyToken, blogController.deleteBlog);
router.post("/update-status", verifyToken, blogController.updateActiveStatus);
router.get('/blogs', verifyToken, blogController.getAllActiveBlogs);
router.get('/fetch-blog/:slug', verifyToken, blogController.getBlogDataBySlug);

module.exports = router;