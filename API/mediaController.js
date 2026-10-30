const fs = require("fs");
const path = require("path");
const db = require("../db");

const mediaDirectory = path.resolve(
  __dirname,
  "../uploads/OnlineImages/MediaImages",
);

const removeMediaFile = (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  fs.unlink(path.join(mediaDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Could not remove media video:", error);
    }
  });
};

exports.getAllMedias = (req, res) => {
  db.query(
    `SELECT MediaID, MediaName, MediaURL, MediaImage, DisplayOrder, ActiveStatus,
            PostedDate, UpdatedBy, UpdatedOn
     FROM mst_mediadata
     ORDER BY DisplayOrder ASC, MediaID DESC`,
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load medias",
          error: error.message,
        });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getMediaById = (req, res) => {
  const MediaID = Number(req.params.MediaID);
  if (!Number.isInteger(MediaID) || MediaID < 1) {
    return res.status(400).json({ success: false, message: "Invalid media ID" });
  }
  db.query(
    `SELECT MediaID, MediaName, MediaURL, MediaImage, DisplayOrder, ActiveStatus,
            PostedDate, UpdatedBy, UpdatedOn
     FROM mst_mediadata
     WHERE MediaID = ?
     LIMIT 1`,
    [MediaID],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load media",
          error: error.message,
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Media not found" });
      }
      return res.json({ success: true, data: rows[0] });
    },
  );
};

exports.saveMedia = (req, res) => {
  const MediaID = req.body.MediaID ? Number(req.body.MediaID) : null;
  const MediaName =
    typeof req.body.MediaName === "string" ? req.body.MediaName.trim() : "";
  const MediaURL =
    typeof req.body.MediaURL === "string" ? req.body.MediaURL.trim() : "";
  const DisplayOrder = Number(req.body.DisplayOrder);
  const ActiveStatus = Number(req.body.ActiveStatus);
  const UpdatedBy = String(req.body.UpdatedBy || "Admin Panel").slice(0, 255);
  const MediaImage = req.file?.filename || null;

  const invalid = (message, status = 400) => {
    if (MediaImage) removeMediaFile(MediaImage);
    return res.status(status).json({ success: false, message });
  };

  if (
    (MediaID !== null && (!Number.isInteger(MediaID) || MediaID < 1)) ||
    !MediaName ||
    MediaName.length > 255 ||
    !Number.isInteger(DisplayOrder) ||
    DisplayOrder < 0 ||
    ![0, 1].includes(ActiveStatus)
  ) {
    return invalid("Enter a name, valid display order, and status.");
  }

  const saveUpdate = (oldImage = null) => {
    if (!MediaID && !MediaImage) {
      return invalid("Please upload an media video.");
    }
    const finalImage = MediaImage || oldImage;
    const values = [
      MediaName,
      MediaURL,
      finalImage,
      DisplayOrder,
      ActiveStatus,
      UpdatedBy,
    ];

    const finishSave = (error, message, savedID) => {
      if (error) {
        console.error("Save media error:", error);
        return invalid("Failed to save media.", 500);
      }
      if (MediaImage && oldImage && MediaImage !== oldImage) {
        removeMediaFile(oldImage);
      }
      return res.json({
        success: true,
        message,
        MediaID: savedID,
      });
    };

    if (MediaID) {
      db.query(
        `UPDATE mst_mediadata
         SET MediaName = ?, MediaURL = ?, MediaImage = ?, DisplayOrder = ?,
             ActiveStatus = ?, UpdatedBy = ?, UpdatedOn = NOW()
         WHERE MediaID = ?`,
        [...values, MediaID],
         (error) => {
          if (error) return finishSave(error);
          return finishSave(null, "Media updated successfully", MediaID);
        },
      );
      return;
    }

    db.query(
      `INSERT INTO mst_mediadata (
        MediaName, MediaURL, MediaImage, DisplayOrder, ActiveStatus,
        PostedDate, UpdatedBy, UpdatedOn
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      values,
      (error, result) => {
        if (error) return finishSave(error);
        return finishSave(null, "Media created successfully", result.insertId);
      },
    );
  };

  if (MediaID) {
    db.query(
      "SELECT MediaImage FROM mst_mediadata WHERE MediaID = ? LIMIT 1",
      [MediaID],
      (error, rows) => {
        if (error) return invalid("Failed to validate media.", 500);
        if (!rows.length) return invalid("Media not found.", 404);
        return saveUpdate(rows[0].MediaImage);
      },
    );
  } else {
    saveUpdate();
  }
};

exports.deleteMedia = (req, res) => {
  const MediaID = Number(req.params.MediaID);
  if (!Number.isInteger(MediaID) || MediaID < 1) {
    return res.status(400).json({ success: false, message: "Invalid media ID" });
  }
  db.query(
    "SELECT MediaImage FROM mst_mediadata WHERE MediaID = ? LIMIT 1",
    [MediaID],
    (selectError, rows) => {
      if (selectError) {
        return res.status(500).json({
          success: false,
          message: "Failed to load media before delete",
          error: selectError.message,
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Media not found" });
      }
      db.query(
        "DELETE FROM mst_mediadata WHERE MediaID = ?",
        [MediaID],
        (deleteError, result) => {
          if (deleteError) {
            return res.status(500).json({
              success: false,
              message: "Failed to delete media",
              error: deleteError.message,
            });
          }
          if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: "Media not found" });
          }
          removeMediaFile(rows[0].MediaImage);
          return res.json({ success: true, message: "Media deleted successfully" });
        },
      );
    },
  );
};

exports.getMaxDisplayOrder = (req, res) => {
  db.query(
    "SELECT MAX(DisplayOrder) AS maxOrder FROM mst_mediadata",
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load media display order",
          error: error.message,
        });
      }
      return res.json({ maxOrder: rows[0]?.maxOrder ?? -1 });
    },
  );
};
