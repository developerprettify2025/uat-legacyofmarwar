const express = require('express');
const router = express.Router();
const productController = require('../API/productController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');

router.get('/all-products', verifyToken, productController.getAllProducts);
router.get('/fill-product-data', verifyToken, productController.getProductById);
router.post(
  '/save-or-update-product',
  upload.fields([
    { name: 'ProductImage', maxCount: 1 },
    { name: 'ProductBannerImage', maxCount: 1 },
    { name: 'ProductBannerImage1', maxCount: 1 },
    { name: 'ProductBannerImage2', maxCount: 1 },
    { name: 'ProductBannerImage3', maxCount: 1 },
    { name: 'ProductBannerImage4', maxCount: 1 },
  ]),
  verifyToken,
  productController.saveOrUpdateProduct
);
router.post('/update-display-order', verifyToken, productController.updateDisplayOrder);
router.get('/max-display-order', verifyToken, productController.getMaxDisplayOrder);
router.delete('/delete-product/:ProductID', verifyToken, productController.deleteProduct);
router.post("/update-status", verifyToken, productController.updateActiveStatus);
router.get('/products', verifyToken, productController.getAllActiveProducts);
router.get('/fetch-product/:slug', verifyToken, productController.getProductDataBySlug);

module.exports = router;