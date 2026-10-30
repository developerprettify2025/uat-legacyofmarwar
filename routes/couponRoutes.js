const express = require("express");
const router = express.Router();
const couponController = require("../API/couponController");
const verifyToken = require("../middleware/verifyToken");

// Customer: coupon apply (cart page)
router.post("/apply", verifyToken, couponController.applyCoupon);

router.get("/all-coupons", verifyToken, couponController.getAllCoupons);
router.post("/", verifyToken, couponController.saveCoupon);
router.delete("/:CouponID", verifyToken, couponController.deleteCoupon);
router.get("/:CouponID", verifyToken, couponController.getCouponById);

module.exports = router;
