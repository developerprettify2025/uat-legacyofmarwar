const express = require("express");
const router = express.Router();
const addressController = require("../API/customerShippingAddressController");
const verifyToken = require("../middleware/verifyToken");

router.get("/:CustomerID", verifyToken, addressController.getCustomerShippingAddresses);
router.post("/", verifyToken, addressController.saveCustomerShippingAddress);
router.delete(
  "/:CustomerID/:CustomerShippingAddressID",
  verifyToken,
  addressController.deleteCustomerShippingAddress,
);

module.exports = router;
