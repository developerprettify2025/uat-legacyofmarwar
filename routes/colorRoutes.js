const express = require("express");
const router = express.Router();
const colorController = require("../API/colorController");
const verifyToken = require("../middleware/verifyToken");

router.get("/all-colors", verifyToken, colorController.getAllColors);
router.post("/", verifyToken, colorController.saveColor);
router.delete("/:ColorID", verifyToken, colorController.deleteColor);
router.get("/:ColorID", verifyToken, colorController.getColorById);

module.exports = router;
