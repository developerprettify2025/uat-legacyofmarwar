const fs = require("fs");
const path = require("path");
const db = require("../db");

const occasionDirectory = path.resolve(
  __dirname,
  "../uploads/OnlineImages/OccasionImages",
);

const removeOccasionFile = (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  fs.unlink(path.join(occasionDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Could not remove occasion video:", error);
    }
  });
};

exports.getAllOccasions = (req, res) => {
  db.query(
    `SELECT OccasionID, OccasionName, OccasionURL, OccasionImage, DisplayOrder, ActiveStatus,
            PostedDate, UpdatedBy, UpdatedOn
     FROM mst_occasiondata
     ORDER BY DisplayOrder ASC, OccasionID DESC`,
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load occasions",
          error: error.message,
        });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getOccasionById = (req, res) => {
  const OccasionID = Number(req.params.OccasionID);
  if (!Number.isInteger(OccasionID) || OccasionID < 1) {
    return res.status(400).json({ success: false, message: "Invalid occasion ID" });
  }
  db.query(
    `SELECT OccasionID, OccasionName, OccasionURL, OccasionImage, DisplayOrder, ActiveStatus,
            PostedDate, UpdatedBy, UpdatedOn
     FROM mst_occasiondata
     WHERE OccasionID = ?
     LIMIT 1`,
    [OccasionID],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load occasion",
          error: error.message,
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Occasion not found" });
      }
      return res.json({ success: true, data: rows[0] });
    },
  );
};

exports.saveOccasion = (req, res) => {
  const OccasionID = req.body.OccasionID ? Number(req.body.OccasionID) : null;
  const OccasionName =
    typeof req.body.OccasionName === "string" ? req.body.OccasionName.trim() : "";
  const OccasionURL =
    typeof req.body.OccasionURL === "string" ? req.body.OccasionURL.trim() : "";
  const DisplayOrder = Number(req.body.DisplayOrder);
  const ActiveStatus = Number(req.body.ActiveStatus);
  const UpdatedBy = String(req.body.UpdatedBy || "Admin Panel").slice(0, 255);
  const OccasionImage = req.file?.filename || null;

  const invalid = (message, status = 400) => {
    if (OccasionImage) removeOccasionFile(OccasionImage);
    return res.status(status).json({ success: false, message });
  };

  if (
    (OccasionID !== null && (!Number.isInteger(OccasionID) || OccasionID < 1)) ||
    !OccasionName ||
    OccasionName.length > 255 ||
    !Number.isInteger(DisplayOrder) ||
    DisplayOrder < 0 ||
    ![0, 1].includes(ActiveStatus)
  ) {
    return invalid("Enter a name, valid display order, and status.");
  }

  const saveUpdate = (oldImage = null) => {
    if (!OccasionID && !OccasionImage) {
      return invalid("Please upload an occasion video.");
    }
    const finalImage = OccasionImage || oldImage;
    const values = [
      OccasionName,
      OccasionURL,
      finalImage,
      DisplayOrder,
      ActiveStatus,
      UpdatedBy,
    ];

    const finishSave = (error, message, savedID) => {
      if (error) {
        console.error("Save occasion error:", error);
        return invalid("Failed to save occasion.", 500);
      }
      if (OccasionImage && oldImage && OccasionImage !== oldImage) {
        removeOccasionFile(oldImage);
      }
      return res.json({
        success: true,
        message,
        OccasionID: savedID,
      });
    };

    if (OccasionID) {
      db.query(
        `UPDATE mst_occasiondata
         SET OccasionName = ?, OccasionURL = ?, OccasionImage = ?, DisplayOrder = ?,
             ActiveStatus = ?, UpdatedBy = ?, UpdatedOn = NOW()
         WHERE OccasionID = ?`,
        [...values, OccasionID],
         (error) => {
          if (error) return finishSave(error);
          return finishSave(null, "Occasion updated successfully", OccasionID);
        },
      );
      return;
    }

    db.query(
      `INSERT INTO mst_occasiondata (
        OccasionName, OccasionURL, OccasionImage, DisplayOrder, ActiveStatus,
        PostedDate, UpdatedBy, UpdatedOn
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      values,
      (error, result) => {
        if (error) return finishSave(error);
        return finishSave(null, "Occasion created successfully", result.insertId);
      },
    );
  };

  if (OccasionID) {
    db.query(
      "SELECT OccasionImage FROM mst_occasiondata WHERE OccasionID = ? LIMIT 1",
      [OccasionID],
      (error, rows) => {
        if (error) return invalid("Failed to validate occasion.", 500);
        if (!rows.length) return invalid("Occasion not found.", 404);
        return saveUpdate(rows[0].OccasionImage);
      },
    );
  } else {
    saveUpdate();
  }
};

exports.deleteOccasion = (req, res) => {
  const OccasionID = Number(req.params.OccasionID);
  if (!Number.isInteger(OccasionID) || OccasionID < 1) {
    return res.status(400).json({ success: false, message: "Invalid occasion ID" });
  }
  db.query(
    "SELECT OccasionImage FROM mst_occasiondata WHERE OccasionID = ? LIMIT 1",
    [OccasionID],
    (selectError, rows) => {
      if (selectError) {
        return res.status(500).json({
          success: false,
          message: "Failed to load occasion before delete",
          error: selectError.message,
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Occasion not found" });
      }
      db.query(
        "DELETE FROM mst_occasiondata WHERE OccasionID = ?",
        [OccasionID],
        (deleteError, result) => {
          if (deleteError) {
            return res.status(500).json({
              success: false,
              message: "Failed to delete occasion",
              error: deleteError.message,
            });
          }
          if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: "Occasion not found" });
          }
          removeOccasionFile(rows[0].OccasionImage);
          return res.json({ success: true, message: "Occasion deleted successfully" });
        },
      );
    },
  );
};

exports.getMaxDisplayOrder = (req, res) => {
  db.query(
    "SELECT MAX(DisplayOrder) AS maxOrder FROM mst_occasiondata",
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Failed to load occasion display order",
          error: error.message,
        });
      }
      return res.json({ maxOrder: rows[0]?.maxOrder ?? -1 });
    },
  );
};
