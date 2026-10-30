const express = require("express");
const router = express.Router();
const authController = require("../API/authController");
const verifyToken = require("../middleware/verifyToken");
const upload = require("../middleware/upload");

router.post("/login", authController.login);
router.post(
  "/save-or-update-user",
  upload.fields([{ name: "ProfileImage", maxCount: 1 }]),
  verifyToken,
  authController.saveOrUpdateUser,
);

router.get("/check-login", verifyToken, authController.checkLogin);
router.post("/logout", authController.logout);
router.get("/all-user", verifyToken, authController.getAllUsers);
router.post(
  "/update-status",
  verifyToken,
  authController.updateUserActiveStatus,
);
router.get("/fill-user-data", verifyToken, authController.getUserById);
router.post("/update-password", verifyToken, authController.updatePassword);
router.delete("/delete-user/:loginID", verifyToken, authController.deleteUser);

module.exports = router;
