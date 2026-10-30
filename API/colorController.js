const db = require("../db");

const colorFields = `ColorID, ColorName, ColorCode, ActiveStatus,
                     DisplayOrder, PostedDate, UpdatedBy, UpdatedOn`;

exports.getAllColors = (req, res) => {
  db.query(
    `SELECT ${colorFields} FROM mst_colordata ORDER BY DisplayOrder ASC, ColorID DESC`,
    (error, rows) => {
      if (error) {
        console.error("Load colors error:", error);
        return res.status(500).json({ success: false, message: "Failed to load colors." });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getColorById = (req, res) => {
  const ColorID = Number(req.params.ColorID);
  if (!Number.isInteger(ColorID) || ColorID < 1) {
    return res.status(400).json({ success: false, message: "Invalid color ID." });
  }
  db.query(
    `SELECT ${colorFields} FROM mst_colordata WHERE ColorID = ? LIMIT 1`,
    [ColorID],
    (error, rows) => {
      if (error) {
        console.error("Load color error:", error);
        return res.status(500).json({ success: false, message: "Failed to load color." });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Color not found." });
      }
      return res.json({ success: true, data: rows[0] });
    },
  );
};

exports.saveColor = (req, res) => {
  const ColorID = req.body.ColorID ? Number(req.body.ColorID) : null;
  const ColorName = typeof req.body.ColorName === "string" ? req.body.ColorName.trim() : "";
  const ColorCode = typeof req.body.ColorCode === "string" ? req.body.ColorCode.trim() : "";
  const DisplayOrder = req.body.DisplayOrder === "" || req.body.DisplayOrder == null
    ? null
    : Number(req.body.DisplayOrder);
  const ActiveStatus = Number(req.body.ActiveStatus);
  const UpdatedBy = String(req.body.UpdatedBy || "Admin Panel").slice(0, 255);
  if (
    (ColorID !== null && (!Number.isInteger(ColorID) || ColorID < 1)) ||
    !ColorName ||
    ColorName.length > 255 ||
    !ColorCode ||
    ColorCode.length > 255 ||
    (DisplayOrder !== null && (!Number.isInteger(DisplayOrder) || DisplayOrder < 0)) ||
    ![0, 1].includes(ActiveStatus)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a color name, color code, valid display order, and status.",
    });
  }

  const persist = () => {
    const values = [
      ColorName,
      ColorCode,
      ActiveStatus,
      DisplayOrder,
      UpdatedBy,
    ];

    if (ColorID) {
      db.query(
        `UPDATE mst_colordata
         SET ColorName = ?, ColorCode = ?, ActiveStatus = ?,
             DisplayOrder = ?, UpdatedBy = ?, UpdatedOn = NOW()
         WHERE ColorID = ?`,
        [...values, ColorID],
        (error) => {
          if (error) {
            console.error("Update color error:", error);
            return res.status(500).json({ success: false, message: "Failed to save color." });
          }
          return res.json({ success: true, message: "Color updated successfully.", ColorID });
        },
      );
      return;
    }

    db.query(
      `INSERT INTO mst_colordata
       (ColorName, ColorCode, ColorImage, ActiveStatus, DisplayOrder, PostedDate, UpdatedBy, UpdatedOn)
       VALUES (?, ?, '', ?, ?, NOW(), ?, NOW())`,
      values,
      (error, result) => {
        if (error) {
          console.error("Create color error:", error);
          return res.status(500).json({ success: false, message: "Failed to save color." });
        }
        return res.json({
          success: true,
          message: "Color created successfully.",
          ColorID: result.insertId,
        });
      },
    );
  };

  const validateNameAndPersist = () => {
    db.query(
      `SELECT ColorID FROM mst_colordata
       WHERE LOWER(TRIM(ColorName)) = LOWER(?)
       ${ColorID ? "AND ColorID != ?" : ""}
       LIMIT 1`,
      ColorID ? [ColorName, ColorID] : [ColorName],
      (error, rows) => {
        if (error) {
          console.error("Validate color name error:", error);
          return res.status(500).json({ success: false, message: "Failed to validate color name." });
        }
        if (rows.length) {
          return res.status(409).json({
            success: false,
            message: "A color with this name already exists.",
          });
        }
        return persist();
      },
    );
  };

  if (!ColorID) return validateNameAndPersist();
  db.query(
    "SELECT ColorID FROM mst_colordata WHERE ColorID = ? LIMIT 1",
    [ColorID],
    (error, rows) => {
      if (error) {
        console.error("Validate color update error:", error);
        return res.status(500).json({ success: false, message: "Failed to validate color." });
      }
      if (!rows.length) return res.status(404).json({ success: false, message: "Color not found." });
      return validateNameAndPersist();
    },
  );
};

exports.deleteColor = (req, res) => {
  const ColorID = Number(req.params.ColorID);
  if (!Number.isInteger(ColorID) || ColorID < 1) {
    return res.status(400).json({ success: false, message: "Invalid color ID." });
  }
  db.query(
    "DELETE FROM mst_colordata WHERE ColorID = ?",
    [ColorID],
    (deleteError, result) => {
      if (deleteError) {
        console.error("Delete color error:", deleteError);
        return res.status(500).json({ success: false, message: "Failed to delete color." });
      }
      if (!result.affectedRows) return res.status(404).json({ success: false, message: "Color not found." });
      return res.json({ success: true, message: "Color deleted successfully." });
    },
  );
};
