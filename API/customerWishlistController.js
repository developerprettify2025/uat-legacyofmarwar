const db = require("../db");

exports.getAllCustomerWishlists = (req, res) => {
  db.query(
    `SELECT CW.CustomerWishlistID, CW.CustomerID, CW.ProductID, CW.ActiveStatus,
            DATE_FORMAT(CW.PostedDate, '%d %b %Y') AS PostedDate,
            C.CustomerName, C.CustomerEmailID, C.CustomerPhoneNo,
            P.ProductName, P.ProductImage, P.ProductCode
     FROM mst_customerwishlistdata CW
     LEFT JOIN mst_customerdata C ON C.CustomerID = CW.CustomerID
     LEFT JOIN mst_productdata P ON P.ProductID = CW.ProductID
     ORDER BY CW.PostedDate DESC, CW.CustomerWishlistID DESC`,
    (error, rows) => {
      if (error) {
        console.error("Load customer wishlists error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to load customer wishlists.",
        });
      }
      return res.json({ success: true, data: rows });
    },
  );
};


exports.getCustomerWishlist = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);

  if (!Number.isInteger(CustomerID) || CustomerID < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid customer ID.",
    });
  }

  const sqlProduct = `
    SELECT
      CW.CustomerWishlistID,
      pd.ProductID,
      pd.CategoryID,
      cd.CategoryName,
      cd.CategoryNameURL,
      cd.CategoryVideo,
      pd.ProductName,
      pd.ProductNameURL,
      pd.ProductImage,
      pd.ProductBannerImage4,
      MIN(pcd.ProductSalePrice) AS ProductSalePrice,
      pcd.ProductMRP,
      GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName,
      1 AS IsWishlist,
      ${CustomerID} AS ItemID
    FROM mst_customerwishlistdata CW
    INNER JOIN mst_productdata pd
      ON pd.ProductID = CW.ProductID
    INNER JOIN mst_categorydata cd
      ON pd.CategoryID = cd.CategoryID
    INNER JOIN mst_productcolordata pcd
      ON pd.ProductID = pcd.ProductID
    INNER JOIN mst_colordata cod
      ON pcd.ColorID = cod.ColorID
    WHERE
      CW.CustomerID = ?
      AND CW.ActiveStatus = 1
      AND pd.ActiveStatus = 1
      AND cd.ActiveStatus = 1
      AND cod.ActiveStatus = 1
      AND pcd.ProductSalePrice > 0
    GROUP BY
      CW.CustomerWishlistID,
      pd.ProductID,
      pd.CategoryID,
      cd.CategoryName,
      cd.CategoryNameURL,
      cd.CategoryVideo,
      pd.ProductName,
      pd.ProductNameURL,
      pd.ProductImage,
      pd.ProductBannerImage4,
      pcd.ProductMRP
    ORDER BY CW.CustomerWishlistID DESC
  `;

  db.query(sqlProduct, [CustomerID], (error, rows) => {
    if (error) {
      console.error("Load customer wishlist error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load wishlist.",
      });
    }

    return res.json({
      success: true,
      data: rows,
    });
  });
};



exports.addProductToWishlist = (req, res) => {
  const CustomerID = Number(req.body.CustomerID);
  const ProductID = Number(req.body.ProductID);
  const UpdatedBy = typeof req.body.UpdatedBy === "string"
    ? req.body.UpdatedBy.trim().slice(0, 100)
    : null;
  if (
    !Number.isInteger(CustomerID) ||
    CustomerID < 1 ||
    !Number.isInteger(ProductID) ||
    ProductID < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid customer and product IDs are required.",
    });
  }

  db.query(
    `SELECT CustomerWishlistID, ActiveStatus
     FROM mst_customerwishlistdata
     WHERE CustomerID = ? AND ProductID = ?
     ORDER BY ActiveStatus DESC, CustomerWishlistID DESC LIMIT 1`,
    [CustomerID, ProductID],
    (findError, wishlistRows) => {
      if (findError) {
        console.error("Check customer wishlist entry error:", findError);
        return res.status(500).json({
          success: false,
          message: "Failed to update wishlist.",
        });
      }

      if (wishlistRows.length) {
        const existing = wishlistRows[0];
        if (Number(existing.ActiveStatus) === 1) {
          return res.json({
            success: true,
            message: "Product is already in the wishlist.",
            CustomerWishlistID: existing.CustomerWishlistID,
          });
        }
        db.query(
          `UPDATE mst_customerwishlistdata
           SET ActiveStatus = 1, UpdatedBy = ?, UpdatedOn = NOW()
           WHERE CustomerWishlistID = ?`,
          [UpdatedBy, existing.CustomerWishlistID],
          (updateError) => {
            if (updateError) {
              console.error("Restore customer wishlist entry error:", updateError);
              return res.status(500).json({
                success: false,
                message: "Failed to add product to wishlist.",
              });
            }
            return res.json({
              success: true,
              message: "Product added to wishlist.",
              CustomerWishlistID: existing.CustomerWishlistID,
            });
          },
        );
        return;
      }

      db.query(
        `SELECT C.CustomerID, P.ProductID
         FROM mst_customerdata C
         CROSS JOIN mst_productdata P
         WHERE C.CustomerID = ? AND P.ProductID = ? LIMIT 1`,
        [CustomerID, ProductID],
        (validateError, rows) => {
          if (validateError) {
            console.error("Validate wishlist customer and product error:", validateError);
            return res.status(500).json({
              success: false,
              message: "Failed to validate customer and product.",
            });
          }
          if (!rows.length) {
            return res.status(404).json({
              success: false,
              message: "Customer or product not found.",
            });
          }
          db.query(
            `INSERT INTO mst_customerwishlistdata
             (CustomerID, ProductID, ActiveStatus, UpdatedBy, UpdatedOn)
             VALUES (?, ?, 1, ?, NOW())`,
            [CustomerID, ProductID, UpdatedBy],
            (insertError, result) => {
              if (insertError) {
                console.error("Add product to wishlist error:", insertError);
                return res.status(500).json({
                  success: false,
                  message: "Failed to add product to wishlist.",
                });
              }
              return res.status(201).json({
                success: true,
                message: "Product added to wishlist.",
                CustomerWishlistID: result.insertId,
              });
            },
          );
        },
      );
    },
  );
};

exports.removeProductFromWishlist = (req, res) => {
  const CustomerID = Number(req.params.CustomerID);
  const ProductID = Number(req.params.ProductID);
  if (
    !Number.isInteger(CustomerID) ||
    CustomerID < 1 ||
    !Number.isInteger(ProductID) ||
    ProductID < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid customer and product IDs are required.",
    });
  }
  db.query(`Delete from mst_customerwishlistdata WHERE CustomerID = ? AND ProductID = ? AND ActiveStatus = 1`,
    [CustomerID, ProductID],
    (error, result) => {
      if (error) {
        console.error("Remove product from wishlist error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to remove product from wishlist.",
        });
      }
      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Product is not in this wishlist.",
        });
      }
      return res.json({ success: true, message: "Product removed from wishlist." });
    },
  );
};
