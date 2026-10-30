const express = require("express");
const router = express.Router();
const orderController = require("../API/customerOrderController");
const verifyToken = require("../middleware/verifyToken");

router.get("/form-data", verifyToken, orderController.getOrderFormData);
router.get("/customer/:CustomerID/addresses", verifyToken, orderController.getCustomerOrderAddresses);
router.get("/all-orders", verifyToken, orderController.getAllOrders);
router.post("/", verifyToken, orderController.createOrder);
router.patch("/:OrderNo/status", verifyToken, orderController.updateOrderStatus);
router.patch("/:OrderNo/payment-status", verifyToken, orderController.updateOrderPaymentStatus);
router.put("/:OrderNo/payment-status", verifyToken, orderController.updateOrderPaymentStatus);
router.get("/customer/:CustomerID", verifyToken, orderController.getCustomerOrders);
router.get("/customer-order/detail/:CustomerID/:OrderNo", verifyToken, orderController.getCustomerOrderDetail);
module.exports = router;
