const db = require("../db");
const jwt = require("jsonwebtoken");
const AdminStaticData = require("../components/backendcomponents/AdminStaticData.json");

exports.login = (req, res) => {
  const { UserName, Passwords } = req.body;
  const userSql = "SELECT * FROM mst_userdata WHERE ActiveStatus=1 AND UserName = ? AND Passwords = ?";
  db.query(userSql, [UserName, Passwords], (err, results) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "DB error", error: err });
    }
    if (results.length === 0) {
      return res.json({
        success: false,
        message: "Invalid username or password",
      });
    }
    const user = results[0];
    const loginID = user.loginID;
    const permSql = `SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd FROM mst_userpagespermissions WHERE LoginID = ?`;
    db.query(permSql, [loginID], (permErr, permissions) => {
      if (permErr) {
        return res.status(500).json({
          success: false,
          message: "Failed to fetch permissions",
          error: permErr,
        });
      }
      const token = jwt.sign(
        { loginID: user.loginID, UserName: user.UserName, Role: user.Role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000,
        sameSite: "lax",
      });
      return res.json({
        success: true,
        message: "Login successful",
        user: user,
        permissions,
      });
    });
  });
};

exports.saveOrUpdateUser = (req, res) => {
  const body = req.body || {};
  const {
    LoginID,
    FullName,
    EmailID,
    PhoneNumber,
    UserName,
    Role,
    Passwords,
    ActiveStatus,
    UpdatedBy,
    permissions = "{}",
  } = body;
  const numericLoginID = LoginID ? Number(LoginID) : null;
  let ProfileImage = null;
  if (req.files && req.files.ProfileImage && req.files.ProfileImage[0]) {
    ProfileImage = req.files.ProfileImage[0].filename;
  }
  const currentTime = new Date();

  const handlePermissions = (loginId) => {
    // ✅ Guard against malformed/missing permissions JSON so we never
    // throw synchronously inside this async callback (that can crash the process)
    let parsedPermissions;
    try {
      parsedPermissions = JSON.parse(permissions || "{}");
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid permissions data",
      });
    }

    const insertValues = Object.entries(parsedPermissions).map(
      ([pageId, p]) => [
        loginId,
        Number(pageId),
        p.CanRead ?? 0,
        p.CanWrite ?? 0,
        p.CanDelete ?? 0,
        p.CanAdd ?? 0,
      ],
    );
    if (insertValues.length === 0) {
      return res.json({
        success: true,
        message: "User saved successfully (no permissions applied)",
      });
    }
    const deleteSql = `DELETE FROM mst_userpagespermissions WHERE LoginID=?`;
    db.query(deleteSql, [loginId], (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to reset old permissions",
          error: err,
        });
      }
      const insertPermissionSql = `
        INSERT INTO mst_userpagespermissions 
        (LoginID, PageID, CanRead, CanWrite, CanDelete, CanAdd)
        VALUES ?
      `;
      db.query(insertPermissionSql, [insertValues], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "Failed to insert permissions",
            error: err,
          });
        }
        res.json({
          success: true,
          message: "User & permissions saved successfully",
        });
      });
    });
  };

  const checkEmailSql = `SELECT LoginID FROM mst_userdata WHERE EmailID = ? ${numericLoginID ? "AND LoginID <> ?" : ""}`;
  const emailParams = numericLoginID ? [EmailID, numericLoginID] : [EmailID];

  db.query(checkEmailSql, emailParams, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Database error while checking email",
        error: err,
      });
    }
    if (rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists. Please use a different email.",
      });
    }

    const checkPhoneSql = `SELECT LoginID FROM mst_userdata WHERE PhoneNumber = ? ${numericLoginID ? "AND LoginID <> ?" : ""}`;
    const phoneParams = numericLoginID
      ? [PhoneNumber, numericLoginID]
      : [PhoneNumber];

    db.query(checkPhoneSql, phoneParams, (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error while checking phone number",
          error: err,
        });
      }
      if (rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists. Please use a different one.",
        });
      }

      if (numericLoginID) {
        let updateUserSql = `
          UPDATE mst_userdata SET 
            FullName=?, EmailID=?, PhoneNumber=?, Role=?, UserName=?, ActiveStatus=?, UpdatedBy=?, UpdatedOn=? 
            ${ProfileImage ? ", ProfileImage=?" : ""} 
          WHERE LoginID=?
        `;
        let params = [
          FullName,
          EmailID,
          PhoneNumber,
          Role,
          UserName,
          ActiveStatus,
          UpdatedBy,
          currentTime,
        ];

        if (ProfileImage) params.push(ProfileImage);
        params.push(numericLoginID);

        if (Passwords && Passwords.trim() !== "") {
          updateUserSql = `
            UPDATE mst_userdata SET 
              FullName=?, EmailID=?, PhoneNumber=?, Role=?, UserName=?, Passwords=?, ActiveStatus=?, UpdatedBy=?, UpdatedOn=? 
              ${ProfileImage ? ", ProfileImage=?" : ""} 
            WHERE LoginID=?
          `;
          params = [
            FullName,
            EmailID,
            PhoneNumber,
            Role,
            UserName,
            Passwords,
            ActiveStatus,
            UpdatedBy,
            currentTime,
          ];
          if (ProfileImage) params.push(ProfileImage);
          params.push(numericLoginID);
        }

        db.query(updateUserSql, params, (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "User update failed",
              error: err,
            });
          }
          handlePermissions(numericLoginID);
        });
      } else {
        const insertUserSql = `
          INSERT INTO mst_userdata (
            FullName, EmailID, PhoneNumber, Role, UserName, Passwords, ActiveStatus, ProfileImage, RegisterDate, LastLoginDate, UpdatedBy, UpdatedOn
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(
          insertUserSql,
          [
            FullName,
            EmailID,
            PhoneNumber,
            Role,
            UserName,
            Passwords,
            ActiveStatus,
            ProfileImage,
            currentTime,
            null,
            UpdatedBy,
            currentTime,
          ],
          (err, result) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "User insert failed",
                error: err,
              });
            }
            handlePermissions(result.insertId);
          },
        );
      }
    });
  });
};

function getAllPermissions(items, permissions = []) {
  items.forEach((item) => {
    // Only include visible pages
    if (item.Show === "1" && item.PageID) {
      permissions.push({
        PageID: item.PageID,
        CanRead: 1,
        CanWrite: 1,
        CanDelete: 1,
        CanAdd: 1,
      });
    }

    if (item.MoreItem && item.MoreItem.length) {
      getAllPermissions(item.MoreItem, permissions);
    }
  });
  return permissions;
}

exports.checkLogin = (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false });
  }
  const user = req.user;
  const loginID = user.loginID;
  
  if (loginID === 1) {
    const permissions = getAllPermissions(AdminStaticData.Menu.items);
    return res.json({
      loggedIn: true,
      user,
      permissions,
    });
  }

  // Normal Users
  const permSql = `SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd FROM mst_userpagespermissions WHERE LoginID = ? `;
  db.query(permSql, [loginID], (permErr, permissions) => {
    if (permErr) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch permissions",
        error: permErr,
      });
    }
    return res.json({
      loggedIn: true,
      user,
      permissions,
    });
  });
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ success: true, message: "Logged out successfully" });
};

exports.getAllUsers = (req, res) => {
  const sql = `
   SELECT ROW_NUMBER() OVER (ORDER BY loginID DESC) AS SerialNo, 
           loginID, FullName, EmailID, PhoneNumber,Role,ProfileImage, UserName, Passwords, ActiveStatus 
    FROM mst_userdata 
    WHERE loginID <> 1
    ORDER BY loginID DESC;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.json(results);
  });
};

exports.updateUserActiveStatus = (req, res) => {
  const { loginID, ActiveStatus } = req.body;
  if (!loginID || ActiveStatus === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "Missing loginID or ActiveStatus" });
  }
  const sql = `
    UPDATE mst_userdata
    SET ActiveStatus = ?
    WHERE loginID = ?
  `;
  db.query(sql, [ActiveStatus, loginID], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Database error", error: err });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User status updated successfully" });
  });
};

exports.getUserById = (req, res) => {
  const loginID = req.query.loginID;
  if (!loginID) {
    return res.status(400).json({ success: false, message: "Missing loginID" });
  }
  const userSql = `
    SELECT loginID, FullName,Role,ProfileImage, EmailID,Passwords, PhoneNumber, UserName, ActiveStatus
    FROM mst_userdata 
    WHERE loginID = ? 
    LIMIT 1
  `;
  const permSql = `
    SELECT PageID, CanRead, CanWrite, CanDelete, CanAdd
    FROM mst_userpagespermissions
    WHERE loginID = ?
  `;
  db.query(userSql, [loginID], (err, userResults) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Internal server error", error: err });
    }
    if (userResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = userResults[0];
    db.query(permSql, [loginID], (permErr, permResults) => {
      if (permErr) {
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: permErr,
        });
      }
      const permissions = {};
      permResults.forEach((row) => {
        permissions[row.PageID] = {
          CanRead: row.CanRead,
          CanWrite: row.CanWrite,
          CanDelete: row.CanDelete,
          CanAdd: row.CanAdd,
        };
      });
      return res.json({
        success: true,
        data: {
          ...user,
          Permissions: JSON.stringify(permissions),
        },
      });
    });
  });
};

exports.updatePassword = (req, res) => {
  try {
    const loginID = req.body.loginID;
    const oldPassword = req.body.oldPassword || req.body.OldPassword;
    const newPassword = req.body.newPassword || req.body.NewPassword;
    const UpdatedBy = req.body.UpdatedBy || "System";
    if (!loginID || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "LoginID, old password and new password are required",
      });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }
    const sqlFetch = "SELECT Passwords FROM mst_userdata WHERE loginID = ?";
    db.query(sqlFetch, [loginID], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Database error occurred",
          error: err.message,
        });
      }
      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      const user = result[0];
      if (user.Passwords !== oldPassword) {
        return res.status(401).json({
          success: false,
          message: "Old password is incorrect",
        });
      }
      const sqlUpdate = `
        UPDATE mst_userdata
        SET Passwords = ?, UpdatedBy = ?, UpdatedOn = NOW()
        WHERE loginID = ?
      `;

      db.query(
        sqlUpdate,
        [newPassword, UpdatedBy, loginID],
        (err2, updateResult) => {
          if (err2) {
            return res.status(500).json({
              success: false,
              message: "Failed to update password",
              error: err2.message,
            });
          }
          if (updateResult.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "Failed to update password. User may not exist.",
            });
          }
          return res.json({
            success: true,
            message: "Password updated successfully",
          });
        },
      );
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.deleteUser = (req, res) => {
  const loginID = req.params.loginID;
  if (!loginID) {
    return res.status(400).json({ success: false, message: "Missing loginID" });
  }
  if (Number(loginID) === 1) {
    return res
      .status(403)
      .json({ success: false, message: "Super Admin cannot be deleted" });
  }

  // Get profile image to delete
  db.query(
    "SELECT ProfileImage FROM mst_userdata WHERE loginID = ?",
    [loginID],
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Database Error", error: err });
      if (results.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const profileImg = results[0].ProfileImage;

      // Delete permissions first
      db.query(
        "DELETE FROM mst_userpagespermissions WHERE LoginID = ?",
        [loginID],
        (err) => {
          if (err)
            return res.status(500).json({
              success: false,
              message: "Failed to delete permissions",
              error: err,
            });

          // Delete user
          db.query(
            "DELETE FROM mst_userdata WHERE loginID = ?",
            [loginID],
            (err) => {
              if (err)
                return res.status(500).json({
                  success: false,
                  message: "Failed to delete user",
                  error: err,
                });

              // Delete image file if exists (optional cleanup)
              if (profileImg) {
                const path = require("path");
                const fs = require("fs");
                const fullPath = path.join(
                  __dirname,
                  "../uploads/OnlineImages/AuthImages",
                  profileImg,
                );
                if (fs.existsSync(fullPath)) {
                  fs.unlink(fullPath, (err) => {
                    if (err)
                      console.error("Error deleting profile image:", err);
                  });
                }
              }

              res.json({ success: true, message: "User deleted successfully" });
            },
          );
        },
      );
    },
  );
};