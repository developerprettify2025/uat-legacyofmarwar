const express = require("express");
const router = express.Router();
const customerController = require("../API/customerController");
const customerUpload = require("../middleware/customerUpload");
const verifyToken = require("../middleware/verifyToken");

router.get("/all-customers", verifyToken, customerController.getAllCustomers);
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    customerUpload.single("CustomerImage")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.code === "LIMIT_FILE_SIZE"
            ? "Customer image must be 10 MB or smaller."
            : error.message,
        });
      }
      return next();
    });
  },
  customerController.saveCustomer,
);
router.delete("/:CustomerID", verifyToken, customerController.deleteCustomer);
router.get("/:CustomerID", verifyToken, customerController.getCustomerById);
router.post("/check-login", customerController.checkUserLoginOrSignup);
router.post("/signup", customerController.userSignup);
router.post("/send-otp", customerController.sendOtpController);
router.post("/verify-otp", customerController.verifyOtpController);
router.post("/login-by-otp", customerController.getCustomerByMobileOrEmail);
router.post("/check-valid", customerController.checkUserValidByCustomerID);
module.exports = router;
