const express = require("express");
const router = express.Router();
const mediaController = require("../API/mediaController");
const mediaUpload = require("../middleware/mediaUpload");
const verifyToken = require("../middleware/verifyToken");

router.get("/all-medias", verifyToken, mediaController.getAllMedias);
router.get("/max-display-order", verifyToken, mediaController.getMaxDisplayOrder);
router.post(
  "/",
  verifyToken,
  (req, res, next) => {
    mediaUpload.single("MediaImage")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.code === "LIMIT_FILE_SIZE"
            ? "Media video must be 10 MB or smaller."
            : error.message,
        });
      }
      return next();
    });
  },
  mediaController.saveMedia,
);
router.delete("/:MediaID", verifyToken, mediaController.deleteMedia);
router.get("/:MediaID", verifyToken, mediaController.getMediaById);

module.exports = router;
