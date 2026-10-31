const fs = require("fs");
const path = require("path");
const db = require("../db");
const { sendEmail } = require("../middleware/emailTemplates");

const otpStore = {};

const customerImageDirectory = path.resolve(
  __dirname,
  "../uploads/OnlineImages/CustomerImages",
);

const removeCustomerImage = (filename) => {
  if (
    !filename ||
    path.basename(filename) !== filename ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|gif|webp|avif)$/i.test(
      filename,
    )
  ) {
    return;
  }
  fs.unlink(path.join(customerImageDirectory, filename), (error) => {
    if (error && error.code !== "ENOENT") {
      console.error("Could not remove customer image:", error);
    }
  });
};

const customerColumns = `CustomerID, CustomerName, CustomerEmailID, CustomerPhoneNo,
                         CustomerImage, GoogleLoginID, FacebookLoginID, ActiveStatus,
                         PostedDate, UpdatedBy, UpdatedOn`;

exports.getAllCustomers = (req, res) => {
  db.query(
    `SELECT ${customerColumns} FROM mst_customerdata ORDER BY CustomerID DESC`,
    (error, rows) => {
      if (error) {
        console.error("Load customers error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to load customers.",
        });
      }
      return res.json({ success: true, data: rows });
    },
  );
};

exports.getCustomerById = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res.status(400).json({ success: false, message: "Invalid customer ID." });
  }
  db.query(
    `SELECT ${customerColumns} FROM mst_customerdata WHERE CustomerID = ? LIMIT 1`,
    [CustomerID],
    (error, rows) => {
      if (error) {
        console.error("Load customer error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to load customer.",
        });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Customer not found." });
      }
      return res.json({ success: true, data: rows[0] });
    },
  );
};

exports.saveCustomer = (req, res) => {
  const CustomerID = req.body.CustomerID ? Number(req.body.CustomerID) : null;
  const CustomerName =
    typeof req.body.CustomerName === "string" ? req.body.CustomerName.trim() : "";
  const CustomerEmailID =
    typeof req.body.CustomerEmailID === "string"
      ? req.body.CustomerEmailID.trim().toLowerCase()
      : "";
  const CustomerPhoneNo =
    typeof req.body.CustomerPhoneNo === "string"
      ? req.body.CustomerPhoneNo.trim()
      : "";
  const uploadedImage = req.file?.filename || null;
  const GoogleLoginID =
    typeof req.body.GoogleLoginID === "string" ? req.body.GoogleLoginID.trim() : "";
  const FacebookLoginID =
    typeof req.body.FacebookLoginID === "string" ? req.body.FacebookLoginID.trim() : "";
  const ActiveStatus = Number(req.body.ActiveStatus);
  const UpdatedBy = String(req.body.UpdatedBy || "Admin Panel").trim().slice(0, 255);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    (CustomerID !== null && (!Number.isInteger(CustomerID) || CustomerID < 1)) ||
    !CustomerName ||
    CustomerName.length > 500 ||
    !emailPattern.test(CustomerEmailID) ||
    CustomerEmailID.length > 500 ||
    !CustomerPhoneNo ||
    CustomerPhoneNo.length > 50 ||
    GoogleLoginID.length > 500 ||
    FacebookLoginID.length > 500 ||
    ![0, 1].includes(ActiveStatus)
  ) {
    if (uploadedImage) removeCustomerImage(uploadedImage);
    return res.status(400).json({
      success: false,
      message: "Customer name, valid email, phone number, and status are required.",
    });
  }

  const checkDuplicates = (next) => {
    db.query(
      `SELECT CustomerID FROM mst_customerdata
       WHERE (LOWER(TRIM(CustomerEmailID)) = ? OR TRIM(CustomerPhoneNo) = ?)
       ${CustomerID ? "AND CustomerID != ?" : ""}
       LIMIT 1`,
      CustomerID
        ? [CustomerEmailID, CustomerPhoneNo, CustomerID]
        : [CustomerEmailID, CustomerPhoneNo],
      (error, rows) => {
        if (error) {
          if (uploadedImage) removeCustomerImage(uploadedImage);
          console.error("Check customer duplicates error:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to validate customer email and phone.",
          });
        }
        if (rows.length) {
          if (uploadedImage) removeCustomerImage(uploadedImage);
          return res.status(409).json({
            success: false,
            message: "Customer email or phone number is already used by another account.",
          });
        }
        return next();
      },
    );
  };

  const persist = (oldImage = "") => {
    const CustomerImage = uploadedImage || oldImage || "";
    const values = [
      CustomerName, CustomerEmailID, CustomerPhoneNo, CustomerImage,
      GoogleLoginID, FacebookLoginID, ActiveStatus, UpdatedBy,
    ];

    const finish = (error, message, savedID) => {
      if (error) {
        if (uploadedImage) removeCustomerImage(uploadedImage);
        console.error("Save customer error:", error);
        return res.status(500).json({ success: false, message: "Failed to save customer." });
      }
      if (uploadedImage && oldImage && uploadedImage !== oldImage) {
        removeCustomerImage(oldImage);
      }
      return res.json({ success: true, message, CustomerID: savedID });
    };

    if (CustomerID) {
      db.query(
        `UPDATE mst_customerdata
         SET CustomerName = ?, CustomerEmailID = ?, CustomerPhoneNo = ?,
             CustomerImage = ?, GoogleLoginID = ?, FacebookLoginID = ?,
             ActiveStatus = ?, UpdatedBy = ?, UpdatedOn = NOW()
         WHERE CustomerID = ?`,
        [...values, CustomerID],
        (error) => finish(error, "Customer updated successfully.", CustomerID),
      );
      return;
    }

    db.query(
      `INSERT INTO mst_customerdata
       (CustomerName, CustomerEmailID, CustomerPhoneNo, CustomerImage,
        GoogleLoginID, FacebookLoginID, ActiveStatus, PostedDate, UpdatedBy, UpdatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      values,
      (error, result) =>
        finish(error, "Customer created successfully.", result?.insertId),
    );
  };

  const verifyDuplicateAndSave = (oldImage = "") =>
    checkDuplicates(() => persist(oldImage));

  if (!CustomerID) return verifyDuplicateAndSave();
  db.query(
    "SELECT CustomerID, CustomerImage FROM mst_customerdata WHERE CustomerID = ? LIMIT 1",
    [CustomerID],
    (error, rows) => {
      if (error) {
        if (uploadedImage) removeCustomerImage(uploadedImage);
        console.error("Validate customer update error:", error);
        return res.status(500).json({ success: false, message: "Failed to validate customer." });
      }
      if (!rows.length) {
        if (uploadedImage) removeCustomerImage(uploadedImage);
        return res.status(404).json({ success: false, message: "Customer not found." });
      }
      return verifyDuplicateAndSave(rows[0].CustomerImage);
    },
  );
};

exports.deleteCustomer = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res.status(400).json({ success: false, message: "Invalid customer ID." });
  }
  db.query(
    "SELECT CustomerImage FROM mst_customerdata WHERE CustomerID = ? LIMIT 1",
    [CustomerID],
    (selectError, rows) => {
      if (selectError) {
        console.error("Load customer before delete error:", selectError);
        return res.status(500).json({ success: false, message: "Failed to delete customer." });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Customer not found." });
      }
      db.query(
        "DELETE FROM mst_customerdata WHERE CustomerID = ?",
        [CustomerID],
        (error, result) => {
          if (error) {
            console.error("Delete customer error:", error);
            return res.status(500).json({ success: false, message: "Failed to delete customer." });
          }
          if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: "Customer not found." });
          }
          removeCustomerImage(rows[0].CustomerImage);
          return res.json({ success: true, message: "Customer deleted successfully." });
        },
      );
    },
  );
};

// API 1: Check customer login
exports.checkUserLoginOrSignup = (req, res) => {
  const { CustomerPhoneNo, CustomerEmailID } = req.body;
  if (!CustomerPhoneNo && !CustomerEmailID) {
    return res.status(400).json({
      success: false,
      message: "Mobile number or email is required.",
    });
  }

  let sql;
  let params;

  if (CustomerPhoneNo) {
    sql = `SELECT CustomerID, CustomerName, CustomerPhoneNo, CustomerEmailID, ActiveStatus FROM mst_customerdata WHERE CustomerPhoneNo = ? LIMIT 1`;
    params = [CustomerPhoneNo];
  } else {
    sql = `SELECT CustomerID, CustomerName, CustomerPhoneNo, CustomerEmailID, ActiveStatus FROM mst_customerdata WHERE CustomerEmailID = ? LIMIT 1`;
    params = [CustomerEmailID];
  }
  db.query(sql, params, (error, rows) => {
    if (error) {
      console.error("Check customer login error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check customer.",
      });
    }
    // Customer does not exist
    if (rows.length === 0) {
      return res.json({
        success: true,
        code: 2,
        isRegistered: false,
        message: "Customer not registered.",
      });
    }
    const customer = rows[0];
    // Customer exists but is inactive
    if (Number(customer.ActiveStatus) !== 1) {
      return res.json({
        success: true,
        code: 0,
        isRegistered: true,
        message: "Customer account is inactive.",
      });
    }
    return res.json({
      success: true,
      code: 1,
      isRegistered: true,
      CustomerID: customer.CustomerID,
      message: "Customer found.",
    });
  });
};

// API 2: Signup with mobile number or email
exports.userSignup = (req, res) => {
  const CustomerName = (req.body.CustomerName || "").trim();
  const CustomerPhoneNo = String(req.body.CustomerPhoneNo || "").replace(/\D/g, "");
  const CustomerEmailID = String(req.body.CustomerEmailID || "").trim().toLowerCase();

  if (!CustomerPhoneNo && !CustomerEmailID) {
    return res.status(400).json({
      success: false,
      message: "Mobile number or email is required.",
    });
  }

  if (CustomerPhoneNo && !/^[6-9]\d{9}$/.test(CustomerPhoneNo)) {
    return res.status(400).json({ success: false, message: "Invalid mobile number." });
  }

  if (CustomerEmailID && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CustomerEmailID)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }

  if (CustomerName.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Customer name is too long.",
    });
  }

  // Check duplicates on whichever fields were provided
  const conditions = [];
  const checkParams = [];
  if (CustomerPhoneNo) {
    conditions.push("CustomerPhoneNo = ?");
    checkParams.push(CustomerPhoneNo);
  }
  if (CustomerEmailID) {
    conditions.push("CustomerEmailID = ?");
    checkParams.push(CustomerEmailID);
  }

  const checkSql = `SELECT CustomerID FROM mst_customerdata WHERE ${conditions.join(" OR ")} LIMIT 1`;

  db.query(checkSql, checkParams, (error, rows) => {
    if (error) {
      console.error("Check signup customer error:", error);
      return res.status(500).json({ success: false, message: "Failed to check customer." });
    }

    if (rows.length > 0) {
      return res.json({
        success: true,
        code: 1,
        alreadyExists: true,
        CustomerID: rows[0].CustomerID,
        message: "Customer already exists.",
      });
    }

    const insertSql = `
      INSERT INTO mst_customerdata
        (CustomerName, CustomerEmailID, CustomerPhoneNo, GoogleLoginID, FacebookLoginID, ActiveStatus)
      VALUES (?, ?, ?, NULL, NULL, 1)`;
    const insertParams = [
      CustomerName || null,
      CustomerEmailID || null,
      CustomerPhoneNo || null,
    ];

    db.query(insertSql, insertParams, (insertError, result) => {
      if (insertError) {
        if (insertError.code === "ER_DUP_ENTRY") {
          return res.json({
            success: true,
            code: 1,
            alreadyExists: true,
            message: "Customer already exists.",
          });
        }
        console.error("Customer signup error:", insertError);
        return res.status(500).json({ success: false, message: "Failed to register customer." });
      }
      const registeredDate = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });
      if (CustomerEmailID) {
        sendEmail("user_welcome", CustomerEmailID, {
          CustomerName: CustomerName || "there",
        }).then((r) => {
          if (!r.success) console.error("Welcome email failed:", r.error);
        }).catch((e) => console.error("Welcome email error:", e));
      }
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        sendEmail("admin_new_user", adminEmail, {
          CustomerName: CustomerName || "Not provided",
          CustomerEmailID: CustomerEmailID || "Not provided",
          CustomerPhoneNo: CustomerPhoneNo || "Not provided",
          RegisteredDate: registeredDate,
        }).then((r) => {
          if (!r.success) console.error("Admin new user email failed:", r.error);
        }).catch((e) => console.error("Admin new user email error:", e));
      }
      return res.status(201).json({
        success: true,
        code: 1,
        alreadyExists: false,
        CustomerID: result.insertId,
        message: "Customer registered successfully.",
      });
    });
  });
};

// API 3: Get customer data by mobile or email
exports.getCustomerByMobileOrEmail = (req, res) => {
  const { CustomerPhoneNo, CustomerEmailID } = req.body;

  if (!CustomerPhoneNo && !CustomerEmailID) {
    return res.status(400).json({
      success: false,
      message: "Mobile number or email is required.",
    });
  }

  const whereColumn = CustomerPhoneNo ? "cd.CustomerPhoneNo" : "cd.CustomerEmailID";
  const param = CustomerPhoneNo || CustomerEmailID;

  const sql = ` SELECT cd.CustomerID, cd.CustomerName, cd.CustomerPhoneNo, cd.CustomerEmailID, cd.CustomerImage, cd.GoogleLoginID, cd.FacebookLoginID, cd.ActiveStatus, cd.PostedDate, cd.UpdatedOn, (SELECT COUNT(1) FROM mst_customerwishlistdata w WHERE w.CustomerID = cd.CustomerID) AS TotalWishlist FROM mst_customerdata cd WHERE ${whereColumn} = ? AND cd.ActiveStatus = 1 ORDER BY cd.CustomerName ASC LIMIT 1`;

  db.query(sql, [param], (error, rows) => {
    if (error) {
      console.error("Get customer data error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to load customer data.",
      });
    }

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active customer not found.",
      });
    }

    return res.json({ success: true, data: rows[0] });
  });
};
// API 4: Check user validity by CustomerID
exports.checkUserValidByCustomerID = (req, res) => {
  const { CustomerID } = req.body;

  if (!CustomerID || !Number.isInteger(Number(CustomerID)) || Number(CustomerID) <= 0) {
    return res.status(400).json({
      success: false,
      isValid: false,
      message: "Valid CustomerID is required.",
    });
  }

  const sql = ` SELECT cd.CustomerID, cd.CustomerName, cd.CustomerPhoneNo, cd.CustomerEmailID, cd.CustomerImage, cd.GoogleLoginID, cd.FacebookLoginID, cd.ActiveStatus, cd.PostedDate, cd.UpdatedOn, (SELECT COUNT(1) FROM mst_customerwishlistdata w WHERE w.CustomerID = cd.CustomerID) AS TotalWishlist FROM mst_customerdata cd WHERE cd.CustomerID = ? AND cd.ActiveStatus = 1 LIMIT 1`;

  db.query(sql, [Number(CustomerID)], (error, rows) => {
    if (error) {
      console.error("Check user validity error:", error);
      return res.status(500).json({
        success: false,
        isValid: false,
        message: "Failed to validate customer.",
      });
    }

    if (rows.length === 0) {
      return res.json({
        success: true,
        isValid: false,
        message: "Customer is invalid or inactive.",
      });
    }

    return res.json({
      success: true,
      isValid: true,
      CustomerID: rows[0].CustomerID,
      data: rows[0],
      message: "Customer is valid.",
    });
  });
};

exports.sendOtpController = async (req, res) => {
  const CustomerEmailID = String(req.body.CustomerEmailID || "")
    .trim()
    .toLowerCase();
  if (!CustomerEmailID || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CustomerEmailID)) {
    return res.status(400).json({
      success: false,
      message: "A valid email is required to send OTP.",
    });
  }
  try {
    const customer = await new Promise((resolve, reject) => {
      db.query(
        `SELECT CustomerName FROM mst_customerdata WHERE CustomerEmailID = ? LIMIT 1`,
        [CustomerEmailID],
        (err, results) => (err ? reject(err) : resolve(results[0] || null)),
      );
    });
    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore[CustomerEmailID] = {
      otp,
      expiry: Date.now() + 5 * 60 * 1000,
    };
    const emailResult = await sendEmail("otp", CustomerEmailID, {
      CustomerName: customer?.CustomerName || "there",
      otp,
    });
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

exports.verifyOtpController = (req, res) => {
  const CustomerEmailID = String(req.body.CustomerEmailID || "")
    .trim()
    .toLowerCase();
  const otp = String(req.body.otp || "").trim();
  const record = otpStore[CustomerEmailID];
  if (!record) {
    return res.status(400).json({
      success: false,
      message: "No OTP found for this email.",
    });
  }
  if (Date.now() > record.expiry) {
    delete otpStore[CustomerEmailID];
    return res.status(400).json({
      success: false,
      message: "OTP expired.",
    });
  }
  if (String(record.otp) !== otp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP.",
    });
  }
  delete otpStore[CustomerEmailID];
  return res.status(200).json({
    success: true,
    message: "OTP verified successfully.",
  });
};
