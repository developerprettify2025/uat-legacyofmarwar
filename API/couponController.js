const db = require("../db");

const couponFields = `CouponID, CouponName, CouponCode, CouponType, CouponValue,
                      CouponMinAmount, CouponStartDate, CouponExpiryDate,
                      ActiveStatus, PostedDate, UpdatedBy, UpdatedOn`;
const round2 = (n) => Number(Number(n).toFixed(2));
const parseDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

exports.getAllCoupons = (req, res) => {
  db.query(
    `SELECT ${couponFields} FROM mst_coupondata ORDER BY CouponID DESC`,
    (error, rows) => {
      if (error) {
        console.error("Load coupons error:", error);
        return res.status(500).json({ success: false, message: "Failed to load coupons." });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getCouponById = (req, res) => {
  const CouponID = Number(req.params.CouponID);
  if (!Number.isInteger(CouponID) || CouponID < 1) {
    return res.status(400).json({ success: false, message: "Invalid coupon ID." });
  }
  db.query(
    `SELECT ${couponFields} FROM mst_coupondata WHERE CouponID = ? LIMIT 1`,
    [CouponID],
    (error, rows) => {
      if (error) {
        console.error("Load coupon error:", error);
        return res.status(500).json({ success: false, message: "Failed to load coupon." });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Coupon not found." });
      }
      return res.json({ success: true, data: rows[0] });
    },
  );
};

exports.saveCoupon = (req, res) => {
  const CouponID = req.body.CouponID ? Number(req.body.CouponID) : null;
  const CouponName = typeof req.body.CouponName === "string" ? req.body.CouponName.trim() : "";
  const CouponCode = typeof req.body.CouponCode === "string"
    ? req.body.CouponCode.trim().toUpperCase()
    : "";
  const CouponType = typeof req.body.CouponType === "string"
    ? req.body.CouponType.trim()
    : "";
  const CouponValue = Number(req.body.CouponValue);
  const CouponMinAmount = Number(req.body.CouponMinAmount);
  const CouponStartDate = req.body.CouponStartDate;
  const CouponExpiryDate = req.body.CouponExpiryDate;
  const ActiveStatus = Number(req.body.ActiveStatus);
  const UpdatedBy = String(req.body.UpdatedBy || "Admin Panel").trim().slice(0, 90);

  if (
    (CouponID !== null && (!Number.isInteger(CouponID) || CouponID < 1)) ||
    !CouponName ||
    CouponName.length > 255 ||
    !/^[A-Z0-9_-]{1,100}$/.test(CouponCode) ||
    !["Percentage", "Fixed Amount"].includes(CouponType) ||
    !Number.isInteger(CouponValue) ||
    CouponValue < 1 ||
    CouponValue > 2147483647 ||
    (CouponType === "Percentage" && CouponValue > 100) ||
    !Number.isInteger(CouponMinAmount) ||
    CouponMinAmount < 0 ||
    CouponMinAmount > 2147483647 ||
    !parseDate(CouponStartDate) ||
    !parseDate(CouponExpiryDate) ||
    CouponExpiryDate < CouponStartDate ||
    ![0, 1].includes(ActiveStatus)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid coupon name, code, type, value, minimum amount, date range, and status.",
    });
  }

  const validateCodeAndSave = () => {
    db.query(
      `SELECT CouponID FROM mst_coupondata
       WHERE UPPER(TRIM(CouponCode)) = ?
       ${CouponID ? "AND CouponID != ?" : ""}
       LIMIT 1`,
      CouponID ? [CouponCode, CouponID] : [CouponCode],
      (error, rows) => {
        if (error) {
          console.error("Validate coupon code error:", error);
          return res.status(500).json({ success: false, message: "Failed to validate coupon code." });
        }
        if (rows.length) {
          return res.status(409).json({
            success: false,
            message: "A coupon with this code already exists.",
          });
        }

        const values = [
          CouponName,
          CouponCode,
          CouponType,
          CouponValue,
          CouponMinAmount,
          CouponStartDate,
          CouponExpiryDate,
          ActiveStatus,
          UpdatedBy,
        ];
        if (CouponID) {
          db.query(
            `UPDATE mst_coupondata
             SET CouponName = ?, CouponCode = ?, CouponType = ?, CouponValue = ?,
                 CouponMinAmount = ?, CouponStartDate = ?, CouponExpiryDate = ?,
                 ActiveStatus = ?, UpdatedBy = ?, UpdatedOn = NOW()
             WHERE CouponID = ?`,
            [...values, CouponID],
            (updateError) => {
              if (updateError) {
                console.error("Update coupon error:", updateError);
                return res.status(500).json({ success: false, message: "Failed to save coupon." });
              }
              return res.json({
                success: true,
                message: "Coupon updated successfully.",
                CouponID,
              });
            },
          );
          return;
        }

        db.query(
          `INSERT INTO mst_coupondata
           (CouponName, CouponCode, CouponType, CouponValue, CouponMinAmount,
            CouponStartDate, CouponExpiryDate, ActiveStatus, UpdatedBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values,
          (insertError, result) => {
            if (insertError) {
              console.error("Create coupon error:", insertError);
              return res.status(500).json({ success: false, message: "Failed to save coupon." });
            }
            return res.status(201).json({
              success: true,
              message: "Coupon created successfully.",
              CouponID: result.insertId,
            });
          },
        );
      },
    );
  };

  if (!CouponID) return validateCodeAndSave();
  db.query(
    "SELECT CouponID FROM mst_coupondata WHERE CouponID = ? LIMIT 1",
    [CouponID],
    (error, rows) => {
      if (error) {
        console.error("Validate coupon update error:", error);
        return res.status(500).json({ success: false, message: "Failed to validate coupon." });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Coupon not found." });
      }
      return validateCodeAndSave();
    },
  );
};

exports.deleteCoupon = (req, res) => {
  const CouponID = Number(req.params.CouponID);
  if (!Number.isInteger(CouponID) || CouponID < 1) {
    return res.status(400).json({ success: false, message: "Invalid coupon ID." });
  }
  db.query(
    "DELETE FROM mst_coupondata WHERE CouponID = ?",
    [CouponID],
    (error, result) => {
      if (error) {
        console.error("Delete coupon error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete coupon." });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: "Coupon not found." });
      }
      return res.json({ success: true, message: "Coupon deleted successfully." });
    },
  );
};

// Customer coupon apply: code + cart amount check karke discount batata hai
exports.applyCoupon = (req, res) => {
  const CouponCode =
    typeof req.body.CouponCode === "string"
      ? req.body.CouponCode.trim().toUpperCase()
      : "";
  const CartAmount = Number(req.body.CartAmount);

  if (!/^[A-Z0-9_-]{1,100}$/.test(CouponCode)) {
    return res.status(400).json({ success: false, message: "Enter a valid coupon code." });
  }
  if (!Number.isFinite(CartAmount) || CartAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid cart amount." });
  }

  db.query(
    `SELECT CouponID, CouponName, CouponCode, CouponType, CouponValue, CouponMinAmount,
            DATE_FORMAT(CouponStartDate, '%Y-%m-%d') AS CouponStartDate,
            DATE_FORMAT(CouponExpiryDate, '%Y-%m-%d') AS CouponExpiryDate,
            ActiveStatus,
            (CURDATE() < CouponStartDate) AS NotStarted,
            (CURDATE() > CouponExpiryDate) AS Expired
     FROM mst_coupondata
     WHERE UPPER(TRIM(CouponCode)) = ?
     LIMIT 1`,
    [CouponCode],
    (error, rows) => {
      if (error) {
        console.error("Apply coupon error:", error);
        return res.status(500).json({ success: false, message: "Failed to apply coupon." });
      }

      const c = rows[0];
      if (!c) {
        return res.status(404).json({ success: false, message: "Invalid coupon code." });
      }
      if (Number(c.ActiveStatus) !== 1) {
        return res.status(400).json({ success: false, message: "This coupon is not active." });
      }
      if (c.NotStarted) {
        return res.status(400).json({ success: false, message: "This coupon is not started yet." });
      }
      if (c.Expired) {
        return res.status(400).json({ success: false, message: "This coupon has expired." });
      }
      if (CartAmount < Number(c.CouponMinAmount)) {
        return res.status(400).json({
          success: false,
          message: `Minimum order of ₹${c.CouponMinAmount} required for this coupon.`,
        });
      }

      const value = Number(c.CouponValue);
      const rawDiscount =
        c.CouponType === "Percentage" ? (CartAmount * value) / 100 : value;
      const CouponDiscount = round2(Math.min(rawDiscount, CartAmount));

      return res.json({
        success: true,
        message: "Coupon applied successfully.",
        data: {
          CouponID: c.CouponID,
          CouponName: c.CouponName,
          CouponCode: c.CouponCode,
          CouponType: c.CouponType,
          CouponValue: value,
          CouponMinAmount: Number(c.CouponMinAmount),
          CouponStartDate: c.CouponStartDate,
          CouponExpiryDate: c.CouponExpiryDate,
          CouponDiscount,
        },
      });
    },
  );
};
