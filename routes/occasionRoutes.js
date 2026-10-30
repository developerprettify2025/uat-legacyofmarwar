const express = require("express");
const router = express.Router();
const occasionController = require("../API/occasionController");
const occasionUpload = require("../middleware/occasionUpload");
const verifyToken = require("../middleware/verifyToken");

router.get("/all-occasions", verifyToken, occasionController.getAllOccasions);
router.get("/max-display-order", verifyToken, occasionController.getMaxDisplayOrder);
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    occasionUpload.single("OccasionImage")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.code === "LIMIT_FILE_SIZE"
            ? "Occasion video must be 10 MB or smaller."
            : error.message,
        });
      }
      return next();
    });
  },
  occasionController.saveOccasion,
);
router.delete("/:OccasionID", verifyToken, occasionController.deleteOccasion);
router.get("/:OccasionID", verifyToken, occasionController.getOccasionById);

module.exports = router;
