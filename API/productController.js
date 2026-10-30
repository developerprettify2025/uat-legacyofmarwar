const db = require("../db");
const path = require("path");
const fs = require("fs");
const MAX_SQL_INT = 2147483647;

const getProductNameInitials = (productName) =>
  String(productName || "")
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, "").charAt(0))
    .join("")
    .toUpperCase();

const deleteOldImage = (imagePath) => {
  // if (!imagePath) return;
  // const fullPath = path.join(
  //   __dirname,
  //   "../uploads/OnlineImages/ProductImages",
  //   imagePath,
  // );
  // fs.unlink(fullPath, (err) => {
  //   if (err) {
  //     console.error("Error deleting old image:", err);
  //   }
  // });
};

exports.getAllProducts = (req, res) => {
  const sql = `SELECT ROW_NUMBER() OVER (ORDER BY PD.ProductID DESC) AS SerialNo, ProductID, PD.ProductName, PD.ProductNameURL, PD.ProductCode, PD.CategoryID, CD.CategoryName, PD.ProductImage, PD.ProductBannerImage, PD.ProductBannerImage1, PD.ProductBannerImage2, PD.ProductBannerImage3, PD.ProductBannerImage4, PD.DisplayOrder, PD.ActiveStatus, DATE_FORMAT(PD.PostedDate, '%d %b %Y') AS PostedDate FROM mst_productdata PD inner join mst_categorydata CD on PD.CategoryID = CD.CategoryID ORDER BY PD.ProductID DESC;`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getProductById = (req, res) => {
  const ProductID = req.query.ProductID;
  if (!ProductID)
    return res.status(400).json({ success: false, message: "Missing ID" });
  const sql = "SELECT * FROM mst_productdata WHERE ProductID = ? LIMIT 1";
  db.query(sql, [ProductID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    db.query(
      "SELECT OccasionID FROM mst_productoccasiondata WHERE ProductID = ? ORDER BY OccasionID",
      [ProductID],
      (occasionError, occasionRows) => {
        if (occasionError) {
          return res.status(500).json({ success: false, message: "Failed to load product occasions" });
        }
        db.query(
          `SELECT ProductColorID, ColorID, ProductMRP, ProductSalePrice,
                  ProductOldStock, ProductTotalStock, ProductOutOfStock
           FROM mst_productcolordata WHERE ProductID = ? ORDER BY ColorID`,
          [ProductID],
          (colorError, colorRows) => {
            if (colorError) {
              console.error("Load product colors error:", colorError);
              return res.status(500).json({ success: false, message: "Failed to load product colors" });
            }
            return res.json({
              success: true,
              data: {
                ...results[0],
                OccasionIDs: occasionRows.map(({ OccasionID }) => OccasionID),
                ProductColors: colorRows,
              },
            });
          },
        );
      },
    );
  });
};


exports.saveOrUpdateProduct = async (req, res) => {
  const {
    ProductID,
    ProductName,
    ProductNameURL,
    ProductTagline,
    ProductSmallDescription,
    CategoryID,
    Description,
    SpecificationDescription,
    ReturnPolicyDescription,
    ShippingPolicyDescription,
    ActiveStatus,
    DisplayOrder,
    DisplayOnExclusive,
    DisplayOnHome,
    MetaTitle,
    MetaKeywords,
    MetaDescriptions,
    MetaSchema,
    UpdatedBy,
  } = req.body;

  const currentTime = new Date();

  const ProductImage = req?.files?.ProductImage?.[0]?.filename || null;
  const ProductBannerImage = req?.files?.ProductBannerImage?.[0]?.filename || null;
  const ProductBannerImage1 = req?.files?.ProductBannerImage1?.[0]?.filename || null;
  const ProductBannerImage2 = req?.files?.ProductBannerImage2?.[0]?.filename || null;
  const ProductBannerImage3 = req?.files?.ProductBannerImage3?.[0]?.filename || null;
  const ProductBannerImage4 = req?.files?.ProductBannerImage4?.[0]?.filename || null;

  const normalizedCategoryID = Number(CategoryID);

  if (!Number.isInteger(normalizedCategoryID) || normalizedCategoryID < 1) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid category.",
    });
  }

  // Product tagline validation
  const normalizedTagline =
    typeof ProductTagline === "string" ? ProductTagline.trim() : "";

  if (normalizedTagline.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Product tagline must be 255 characters or less.",
    });
  }

  const normalizedProductSmallDescription =
    typeof ProductSmallDescription === "string"
    ? ProductSmallDescription.trim()
    : "";

  // const normalizedProductSmallDescription= typeof ProductSmallDescription === "string" ? ProductSmallDescription.trim() : "";
  // if (normalizedProductSmallDescription.length > 255) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Product tagline must be 255 characters or less.",
  //   });
  // }
  // DisplayOnExclusive: 0 or 1
  const normalizedExclusive =
    DisplayOnExclusive === undefined ||
      DisplayOnExclusive === null ||
      DisplayOnExclusive === ""
      ? 0
      : DisplayOnExclusive === true || DisplayOnExclusive === "true"
        ? 1
        : DisplayOnExclusive === false || DisplayOnExclusive === "false"
          ? 0
          : Number(DisplayOnExclusive);

  if (![0, 1].includes(normalizedExclusive)) {
    return res.status(400).json({
      success: false,
      message: "Display on exclusive must be 0 or 1.",
    });
  }

  // DisplayOnHome: 0 or 1
  const normalizedDisplayOnHome =
    DisplayOnHome === undefined ||
      DisplayOnHome === null ||
      DisplayOnHome === ""
      ? 0
      : DisplayOnHome === true || DisplayOnHome === "true"
        ? 1
        : DisplayOnHome === false || DisplayOnHome === "false"
          ? 0
          : Number(DisplayOnHome);

  if (![0, 1].includes(normalizedDisplayOnHome)) {
    return res.status(400).json({
      success: false,
      message: "Display on home must be 0 or 1.",
    });
  }

  // Occasion validation
  let occasionIDs = [];
  const shouldUpdateOccasions = req.body.OccasionIDs !== undefined;

  try {
    const submittedOccasionIDs = shouldUpdateOccasions
      ? typeof req.body.OccasionIDs === "string"
        ? JSON.parse(req.body.OccasionIDs)
        : req.body.OccasionIDs
      : [];

    if (!Array.isArray(submittedOccasionIDs)) {
      throw new Error("OccasionIDs must be an array");
    }

    occasionIDs = [...new Set(submittedOccasionIDs.map(Number))];

    if (occasionIDs.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error("OccasionIDs contains an invalid ID");
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid occasion selection.",
    });
  }

  // Product colors validation
  let productColors = [];
  const shouldUpdateProductColors = req.body.ProductColors !== undefined;

  try {
    const submittedColors = shouldUpdateProductColors
      ? typeof req.body.ProductColors === "string"
        ? JSON.parse(req.body.ProductColors)
        : req.body.ProductColors
      : [];

    if (!Array.isArray(submittedColors)) {
      throw new Error("ProductColors must be an array");
    }

    const seenColorIDs = new Set();

    productColors = submittedColors.map((color) => {
      const ColorID = Number(color?.ColorID);
      const ProductMRP = Number(color?.ProductMRP);
      const ProductSalePrice = Number(color?.ProductSalePrice);
      const ProductNewStock = Number(color?.ProductNewStock);
      const ProductOutOfStock = Number(color?.ProductOutOfStock);

      if (
        !Number.isInteger(ColorID) ||
        ColorID < 1 ||
        seenColorIDs.has(ColorID) ||
        [ProductMRP, ProductSalePrice, ProductNewStock].some(
          (value) =>
            !Number.isInteger(value) ||
            value < 0 ||
            value > MAX_SQL_INT
        ) ||
        ![0, 1].includes(ProductOutOfStock)
      ) {
        throw new Error(
          "ProductColors contains invalid color, price, or stock values"
        );
      }

      seenColorIDs.add(ColorID);

      return {
        ColorID,
        ProductMRP,
        ProductSalePrice,
        ProductNewStock,
        ProductOutOfStock,
      };
    });

    if (
      productColors.some(
        ({ ProductMRP, ProductSalePrice }) =>
          ProductSalePrice >= ProductMRP
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Sale price must be less than MRP for every selected color.",
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid product color, price, or stock selection.",
    });
  }

  // Duplicate product validation
  const checkDuplicateSql = `
    SELECT ProductID
    FROM mst_productdata
    WHERE (ProductName = ? OR ProductNameURL = ?)
    ${ProductID ? "AND ProductID != ?" : ""}
  `;

  const checkParams = ProductID
    ? [ProductName, ProductNameURL, ProductID]
    : [ProductName, ProductNameURL];

  let connection;

  try {
    connection = await new Promise((resolve, reject) => {
      db.getConnection((error, conn) =>
        error ? reject(error) : resolve(conn)
      );
    });

    const queries = connection.promise();

    await queries.beginTransaction();

    // Validate category
    const [[category]] = await queries.query(
      "SELECT CategoryID FROM mst_categorydata WHERE CategoryID = ? LIMIT 1",
      [normalizedCategoryID]
    );

    if (!category) {
      await queries.rollback();
      connection.release();
      connection = null;

      return res.status(400).json({
        success: false,
        message: "Selected category was not found.",
      });
    }

    // Validate occasions
    if (occasionIDs.length) {
      const [validOccasions] = await queries.query(
        `SELECT OccasionID
         FROM mst_occasiondata
         WHERE OccasionID IN (${occasionIDs.map(() => "?").join(",")})`,
        occasionIDs
      );

      if (validOccasions.length !== occasionIDs.length) {
        await queries.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
          success: false,
          message: "One or more selected occasions were not found.",
        });
      }
    }

    // Validate colors
    if (productColors.length) {
      const [validColors] = await queries.query(
        `SELECT ColorID
         FROM mst_colordata
         WHERE ColorID IN (${productColors.map(() => "?").join(",")})`,
        productColors.map(({ ColorID }) => ColorID)
      );

      if (validColors.length !== productColors.length) {
        await queries.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
          success: false,
          message: "One or more selected colors were not found.",
        });
      }
    }

    // Check duplicate name or URL
    const [duplicates] = await queries.query(
      checkDuplicateSql,
      checkParams
    );

    if (duplicates.length) {
      await queries.rollback();
      connection.release();
      connection = null;

      return res.status(400).json({
        success: false,
        message: "Product with the same name or URL already exists.",
      });
    }

    const uploadedImages = [
      ProductImage,
      ProductBannerImage,
      ProductBannerImage1,
      ProductBannerImage2,
      ProductBannerImage3,
      ProductBannerImage4,
    ];

    let savedProductID = ProductID;
    let ProductCode;
    let oldProduct = null;

    // ==========================================
    // UPDATE PRODUCT
    // ==========================================
    if (ProductID) {
      const [oldProducts] = await queries.query(
        `SELECT
           ProductImage,
           ProductBannerImage,
           ProductBannerImage1,
           ProductBannerImage2,
           ProductBannerImage3,
           ProductBannerImage4,
           ProductCode
         FROM mst_productdata
         WHERE ProductID = ?
         LIMIT 1`,
        [ProductID]
      );

      if (!oldProducts.length) {
        await queries.rollback();
        connection.release();
        connection = null;

        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      oldProduct = oldProducts[0];
      ProductCode = oldProduct.ProductCode;

      // Preserve existing images when no new image is uploaded
      const finalImages = [
        ProductImage || oldProduct.ProductImage,
        ProductBannerImage || oldProduct.ProductBannerImage,
        ProductBannerImage1 || oldProduct.ProductBannerImage1,
        ProductBannerImage2 || oldProduct.ProductBannerImage2,
        ProductBannerImage3 || oldProduct.ProductBannerImage3,
        ProductBannerImage4 || oldProduct.ProductBannerImage4,
      ];

      await queries.query(
        `UPDATE mst_productdata SET
           ProductName = ?,
           ProductNameURL = ?,
           ProductTagline = ?,
           ProductSmallDescription =?,
           CategoryID = ?,
           ProductImage = ?,
           ProductBannerImage = ?,
           ProductBannerImage1 = ?,
           ProductBannerImage2 = ?,
           ProductBannerImage3 = ?,
           ProductBannerImage4 = ?,
           Description = ?,
           SpecificationDescription = ?,
           ReturnPolicyDescription = ?,
           ShippingPolicyDescription = ?,
           ActiveStatus = ?,
           DisplayOrder = ?,
           DisplayOnExclusive = ?,
           DisplayOnHome = ?,
           MetaTitle = ?,
           MetaKeywords = ?,
           MetaDescriptions = ?,
           MetaSchema = ?,
           UpdatedBy = ?,
           UpdatedOn = ?
         WHERE ProductID = ?`,
        [
          ProductName,
          ProductNameURL,
          normalizedTagline,
          ProductSmallDescription,
          normalizedCategoryID,
          ...finalImages,
          Description,
          SpecificationDescription,
          ReturnPolicyDescription,
          ShippingPolicyDescription,
          ActiveStatus,
          DisplayOrder,
          normalizedExclusive,
          normalizedDisplayOnHome, // FIX: DisplayOnHome on update
          MetaTitle,
          MetaKeywords,
          MetaDescriptions,
          MetaSchema,
          UpdatedBy,
          currentTime,
          ProductID,
        ]
      );
    } else {
      // ==========================================
      // ADD NEW PRODUCT
      // ==========================================
      const [insertResult] = await queries.query(
        `INSERT INTO mst_productdata (
           ProductName,
           ProductNameURL,
           ProductTagline,
           ProductSmallDescription, 
           CategoryID,
           ProductCode,
           ProductImage,
           ProductBannerImage,
           ProductBannerImage1,
           ProductBannerImage2,
           ProductBannerImage3,
           ProductBannerImage4,
           Description,
           SpecificationDescription,
           ReturnPolicyDescription,
           ShippingPolicyDescription,
           ActiveStatus,
           DisplayOrder,
           DisplayOnExclusive,
           DisplayOnHome,
           MetaTitle,
           MetaKeywords,
           MetaDescriptions,
           MetaSchema,
           PostedDate,
           UpdatedBy,
           UpdatedOn
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ProductName,
          ProductNameURL,
          normalizedTagline,
          ProductSmallDescription,
          normalizedCategoryID,
          "",
          ...uploadedImages,
          Description,
          SpecificationDescription,
          ReturnPolicyDescription,
          ShippingPolicyDescription,
          ActiveStatus,
          DisplayOrder,
          normalizedExclusive,
          normalizedDisplayOnHome,
          MetaTitle,
          MetaKeywords,
          MetaDescriptions,
          MetaSchema,
          currentTime,
          UpdatedBy,
          currentTime,
        ]
      );

      savedProductID = insertResult.insertId;

      ProductCode = `LM${savedProductID}C${normalizedCategoryID}${getProductNameInitials(
        ProductName
      )}`;

      await queries.query(
        "UPDATE mst_productdata SET ProductCode = ? WHERE ProductID = ?",
        [ProductCode, savedProductID]
      );
    }

    // ==========================================
    // SAVE PRODUCT OCCASIONS
    // ==========================================
    if (shouldUpdateOccasions) {
      await queries.query(
        "DELETE FROM mst_productoccasiondata WHERE ProductID = ?",
        [savedProductID]
      );

      if (occasionIDs.length) {
        await queries.query(
          `INSERT INTO mst_productoccasiondata
           (ProductID, OccasionID)
           VALUES ${occasionIDs.map(() => "(?, ?)").join(", ")}`,
          occasionIDs.flatMap((occasionID) => [
            savedProductID,
            occasionID,
          ])
        );
      }
    }

    // ==========================================
    // SAVE PRODUCT COLORS AND STOCK
    // ==========================================
    if (shouldUpdateProductColors) {
      const [currentProductColors] = await queries.query(
        `SELECT ColorID, ProductTotalStock
         FROM mst_productcolordata
         WHERE ProductID = ?
         FOR UPDATE`,
        [savedProductID]
      );

      const currentStockByColor = new Map(
        currentProductColors.map(({ ColorID, ProductTotalStock }) => [
          Number(ColorID),
          Number(ProductTotalStock),
        ])
      );

      const colorRows = productColors.map((color) => {
        const previousStock =
          currentStockByColor.get(color.ColorID) || 0;

        return {
          ...color,
          ProductOldStock: previousStock,
          ProductTotalStock:
            previousStock + color.ProductNewStock,
        };
      });

      if (
        colorRows.some(
          (color) => color.ProductTotalStock > MAX_SQL_INT
        )
      ) {
        await queries.rollback();
        connection.release();
        connection = null;

        return res.status(400).json({
          success: false,
          message: "Total stock exceeds the supported limit.",
        });
      }

      await queries.query(
        "DELETE FROM mst_productcolordata WHERE ProductID = ?",
        [savedProductID]
      );

      if (colorRows.length) {
        await queries.query(
          `INSERT INTO mst_productcolordata (
             ProductID,
             ColorID,
             ProductMRP,
             ProductSalePrice,
             ProductOldStock,
             ProductTotalStock,
             ProductOutOfStock,
             PostedDate,
             UpdatedOn
           )
           VALUES ${colorRows
            .map(() => "(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())")
            .join(", ")}`,
          colorRows.flatMap((color) => [
            savedProductID,
            color.ColorID,
            color.ProductMRP,
            color.ProductSalePrice,
            color.ProductOldStock,
            color.ProductTotalStock,
            color.ProductOutOfStock,
          ])
        );
      }
    }

    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================
    await queries.commit();

    connection.release();
    connection = null;

    // Delete replaced images after successful update
    if (oldProduct) {
      const oldImages = [
        oldProduct.ProductImage,
        oldProduct.ProductBannerImage,
        oldProduct.ProductBannerImage1,
        oldProduct.ProductBannerImage2,
        oldProduct.ProductBannerImage3,
        oldProduct.ProductBannerImage4,
      ];

      oldImages.forEach((oldImage, index) => {
        if (
          uploadedImages[index] &&
          oldImage !== uploadedImages[index]
        ) {
          deleteOldImage(oldImage);
        }
      });
    }

    // Success response
    return res.json({
      success: true,
      message: ProductID
        ? "Product updated successfully"
        : "Product created successfully",
      ProductID: savedProductID,
      ProductCode,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.promise().rollback();
      } catch (rollbackError) {
        console.error(
          "Product save rollback failed:",
          rollbackError
        );
      }

      connection.release();
    }

    console.error("Save product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save product.",
    });
  }
};


/*exports.saveOrUpdateProduct = async (req, res) => {
  const {
    ProductID,
    ProductName,
    ProductNameURL,
    ProductTagline,
    CategoryID,
    Description,
    SpecificationDescription,
    ReturnPolicyDescription,
    ShippingPolicyDescription,
    ActiveStatus,
    DisplayOrder,
    DisplayOnExclusive,
    DisplayOnHome,
    MetaTitle,
    MetaKeywords,
    MetaDescriptions,
    MetaSchema,
    UpdatedBy,
  } = req.body;
  const currentTime = new Date();
  const ProductImage = req?.files?.ProductImage?.[0]?.filename || null;
  const ProductBannerImage = req?.files?.ProductBannerImage?.[0]?.filename || null;
  const ProductBannerImage1 = req?.files?.ProductBannerImage1?.[0]?.filename || null;
  const ProductBannerImage2 = req?.files?.ProductBannerImage2?.[0]?.filename || null;
  const ProductBannerImage3 = req?.files?.ProductBannerImage3?.[0]?.filename || null;
  const ProductBannerImage4 = req?.files?.ProductBannerImage4?.[0]?.filename || null;
  const normalizedCategoryID = Number(CategoryID);
  if (!Number.isInteger(normalizedCategoryID) || normalizedCategoryID < 1) {
    return res.status(400).json({ success: false, message: "Please select a valid category." });
  }

  // Tagline: optional, trim karke max 255 characters
  const normalizedTagline =
    typeof ProductTagline === "string" ? ProductTagline.trim() : "";
  if (normalizedTagline.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Product tagline must be 255 characters or less.",
    });
  }

  // DisplayOnExclusive: 0 ya 1 (khali ho to 0)
  const normalizedExclusive =
    DisplayOnExclusive === undefined || DisplayOnExclusive === null || DisplayOnExclusive === ""
      ? 0
      : DisplayOnExclusive === true || DisplayOnExclusive === "true"
        ? 1
        : DisplayOnExclusive === false || DisplayOnExclusive === "false"
          ? 0
          : Number(DisplayOnExclusive);
  if (![0, 1].includes(normalizedExclusive)) {
    return res.status(400).json({
      success: false,
      message: "Display on exclusive must be 0 or 1.",
    });
  }

  // DisplayOnExclusive: 0 ya 1 (khali ho to 0)
  const normalizedDisplayOnHome =
    DisplayOnHome === undefined || DisplayOnHome === null || DisplayOnHome === ""
      ? 0
      : DisplayOnHome === true || DisplayOnHome === "true"
        ? 1
        : DisplayOnHome === false || DisplayOnHome === "false"
          ? 0
          : Number(DisplayOnHome);
  if (![0, 1].includes(normalizedDisplayOnHome)) {
    return res.status(400).json({
      success: false,
      message: "Display on exclusive must be 0 or 1.",
    });
  }

  let occasionIDs = [];
  const shouldUpdateOccasions = req.body.OccasionIDs !== undefined;
  try {
    const submittedOccasionIDs = shouldUpdateOccasions
      ? typeof req.body.OccasionIDs === "string"
        ? JSON.parse(req.body.OccasionIDs)
        : req.body.OccasionIDs
      : [];
    if (!Array.isArray(submittedOccasionIDs)) throw new Error("OccasionIDs must be an array");
    occasionIDs = [...new Set(submittedOccasionIDs.map(Number))];
    if (occasionIDs.some((id) => !Number.isInteger(id) || id < 1)) {
      throw new Error("OccasionIDs contains an invalid ID");
    }
  } catch {
    return res.status(400).json({ success: false, message: "Invalid occasion selection." });
  }
  let productColors = [];
  const shouldUpdateProductColors = req.body.ProductColors !== undefined;
  try {
    const submittedColors = shouldUpdateProductColors
      ? typeof req.body.ProductColors === "string"
        ? JSON.parse(req.body.ProductColors)
        : req.body.ProductColors
      : [];
    if (!Array.isArray(submittedColors)) throw new Error("ProductColors must be an array");
    const seenColorIDs = new Set();
    productColors = submittedColors.map((color) => {
      const ColorID = Number(color?.ColorID);
      const ProductMRP = Number(color?.ProductMRP);
      const ProductSalePrice = Number(color?.ProductSalePrice);
      const ProductNewStock = Number(color?.ProductNewStock);
      const ProductOutOfStock = Number(color?.ProductOutOfStock);
      if (
        !Number.isInteger(ColorID) || ColorID < 1 || seenColorIDs.has(ColorID) ||
        [ProductMRP, ProductSalePrice, ProductNewStock]
          .some((value) => !Number.isInteger(value) || value < 0 || value > MAX_SQL_INT) ||
        ![0, 1].includes(ProductOutOfStock)
      ) {
        throw new Error("ProductColors contains invalid color, price, or stock values");
      }
      seenColorIDs.add(ColorID);
      return {
        ColorID,
        ProductMRP,
        ProductSalePrice,
        ProductNewStock,
        ProductOutOfStock,
      };
    });
    if (productColors.some(({ ProductMRP, ProductSalePrice }) => ProductSalePrice >= ProductMRP)) {
      return res.status(400).json({
        success: false,
        message: "Sale price must be less than MRP for every selected color.",
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid product color, price, or stock selection.",
    });
  }

  const checkDuplicateSql = `
    SELECT ProductID FROM mst_productdata
    WHERE (ProductName = ? OR ProductNameURL = ?)
    ${ProductID ? "AND ProductID != ?" : ""}
  `;
  const checkParams = ProductID
    ? [ProductName, ProductNameURL, ProductID]
    : [ProductName, ProductNameURL];
  let connection;
  try {
    connection = await new Promise((resolve, reject) => {
      db.getConnection((error, conn) => (error ? reject(error) : resolve(conn)));
    });
    const queries = connection.promise();
    await queries.beginTransaction();

    const [[category]] = await queries.query(
      "SELECT CategoryID FROM mst_categorydata WHERE CategoryID = ? LIMIT 1",
      [normalizedCategoryID],
    );
    if (!category) {
      await queries.rollback();
      connection.release();
      connection = null;
      return res.status(400).json({ success: false, message: "Selected category was not found." });
    }

    if (occasionIDs.length) {
      const [validOccasions] = await queries.query(
        `SELECT OccasionID FROM mst_occasiondata WHERE OccasionID IN (${occasionIDs.map(() => "?").join(",")})`,
        occasionIDs,
      );
      if (validOccasions.length !== occasionIDs.length) {
        await queries.rollback();
        connection.release();
        connection = null;
        return res.status(400).json({ success: false, message: "One or more selected occasions were not found." });
      }
    }

    if (productColors.length) {
      const [validColors] = await queries.query(
        `SELECT ColorID FROM mst_colordata WHERE ColorID IN (${productColors.map(() => "?").join(",")})`,
        productColors.map(({ ColorID }) => ColorID),
      );
      if (validColors.length !== productColors.length) {
        await queries.rollback();
        connection.release();
        connection = null;
        return res.status(400).json({
          success: false,
          message: "One or more selected colors were not found.",
        });
      }
    }

    const [duplicates] = await queries.query(checkDuplicateSql, checkParams);
    if (duplicates.length) {
      await queries.rollback();
      connection.release();
      connection = null;
      return res.status(400).json({
        success: false,
        message: "Product with the same name or URL already exists",
      });
    }

    const uploadedImages = [
      ProductImage,
      ProductBannerImage,
      ProductBannerImage1,
      ProductBannerImage2,
      ProductBannerImage3,
      ProductBannerImage4,
    ];
    let savedProductID = ProductID;
    let ProductCode;
    let oldProduct = null;

    if (ProductID) {
      const [oldProducts] = await queries.query(
        `SELECT ProductImage, ProductBannerImage, ProductBannerImage1, ProductBannerImage2,
                ProductBannerImage3, ProductBannerImage4, ProductCode
         FROM mst_productdata WHERE ProductID = ? LIMIT 1`,
        [ProductID],
      );
      if (!oldProducts.length) {
        await queries.rollback();
        connection.release();
        connection = null;
        return res.status(404).json({ success: false, message: "Product not found." });
      }
      oldProduct = oldProducts[0];
      ProductCode = oldProduct.ProductCode;
      const finalImages = [
        ProductImage || oldProduct.ProductImage,
        ProductBannerImage || oldProduct.ProductBannerImage,
        ProductBannerImage1 || oldProduct.ProductBannerImage1,
        ProductBannerImage2 || oldProduct.ProductBannerImage2,
        ProductBannerImage3 || oldProduct.ProductBannerImage3,
        ProductBannerImage4 || oldProduct.ProductBannerImage4,
      ];
      await queries.query(
        `UPDATE mst_productdata SET
           ProductName = ?, ProductNameURL = ?, ProductTagline = ?, CategoryID = ?,
           ProductImage = ?, ProductBannerImage = ?,
           ProductBannerImage1 = ?, ProductBannerImage2 = ?, ProductBannerImage3 = ?, ProductBannerImage4 = ?,
           Description = ?, SpecificationDescription = ?, ReturnPolicyDescription = ?,
           ShippingPolicyDescription = ?, ActiveStatus = ?, DisplayOrder = ?, DisplayOnExclusive = ?, DisplayOnHome = ?,
           MetaTitle = ?, MetaKeywords = ?, MetaDescriptions = ?, MetaSchema = ?,
           UpdatedBy = ?, UpdatedOn = ?
         WHERE ProductID = ?`,
        [
          ProductName, ProductNameURL, normalizedTagline, normalizedCategoryID, ...finalImages,
          Description, SpecificationDescription, ReturnPolicyDescription,
          ShippingPolicyDescription, ActiveStatus, DisplayOrder, normalizedExclusive,
          MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema, UpdatedBy, currentTime,
          ProductID,
        ],
      );
    } else {
      const [insertResult] = await queries.query(
        `INSERT INTO mst_productdata (
           ProductName, ProductNameURL, ProductTagline, CategoryID, ProductCode, ProductImage, ProductBannerImage,
           ProductBannerImage1, ProductBannerImage2, ProductBannerImage3, ProductBannerImage4,
           Description, SpecificationDescription, ReturnPolicyDescription,
           ShippingPolicyDescription, ActiveStatus, DisplayOrder, DisplayOnExclusive, DisplayOnHome,
           MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema, PostedDate, UpdatedBy, UpdatedOn
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ProductName, ProductNameURL, normalizedTagline, normalizedCategoryID, "",
          ...uploadedImages, Description, SpecificationDescription,
          ReturnPolicyDescription, ShippingPolicyDescription, ActiveStatus,
          DisplayOrder, normalizedExclusive, normalizedDisplayOnHome, MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema,
          currentTime, UpdatedBy, currentTime,
        ],
      );
      savedProductID = insertResult.insertId;
      ProductCode = `LM${savedProductID}C${normalizedCategoryID}${getProductNameInitials(ProductName)}`;
      await queries.query(
        "UPDATE mst_productdata SET ProductCode = ? WHERE ProductID = ?",
        [ProductCode, savedProductID],
      );
    }

    if (shouldUpdateOccasions) {
      await queries.query(
        "DELETE FROM mst_productoccasiondata WHERE ProductID = ?",
        [savedProductID],
      );
      if (occasionIDs.length) {
        await queries.query(
          `INSERT INTO mst_productoccasiondata (ProductID, OccasionID) VALUES ${occasionIDs.map(() => "(?, ?)").join(", ")}`,
          occasionIDs.flatMap((occasionID) => [savedProductID, occasionID]),
        );
      }
    }

    if (shouldUpdateProductColors) {
      const [currentProductColors] = await queries.query(
        `SELECT ColorID, ProductTotalStock
         FROM mst_productcolordata WHERE ProductID = ? FOR UPDATE`,
        [savedProductID],
      );
      const currentStockByColor = new Map(
        currentProductColors.map(({ ColorID, ProductTotalStock }) => [
          Number(ColorID),
          Number(ProductTotalStock),
        ]),
      );
      const colorRows = productColors.map((color) => {
        const previousStock = currentStockByColor.get(color.ColorID) || 0;
        return {
          ...color,
          ProductOldStock: previousStock,
          ProductTotalStock: previousStock + color.ProductNewStock,
        };
      });
      if (colorRows.some((color) => color.ProductTotalStock > MAX_SQL_INT)) {
        await queries.rollback();
        connection.release();
        connection = null;
        return res.status(400).json({
          success: false,
          message: "Total stock exceeds the supported limit.",
        });
      }
      await queries.query(
        "DELETE FROM mst_productcolordata WHERE ProductID = ?",
        [savedProductID],
      );
      if (productColors.length) {
        await queries.query(
          `INSERT INTO mst_productcolordata
           (ProductID, ColorID, ProductMRP, ProductSalePrice, ProductOldStock,
            ProductTotalStock, ProductOutOfStock, PostedDate, UpdatedOn)
           VALUES ${productColors.map(() => "(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())").join(", ")}`,
          colorRows.flatMap((color) => [
            savedProductID,
            color.ColorID,
            color.ProductMRP,
            color.ProductSalePrice,
            color.ProductOldStock,
            color.ProductTotalStock,
            color.ProductOutOfStock,
          ]),
        );
      }
    }

    await queries.commit();
    connection.release();
    connection = null;

    if (oldProduct) {
      const oldImages = [
        oldProduct.ProductImage,
        oldProduct.ProductBannerImage,
        oldProduct.ProductBannerImage1,
        oldProduct.ProductBannerImage2,
        oldProduct.ProductBannerImage3,
        oldProduct.ProductBannerImage4,
      ];
      oldImages.forEach((oldImage, index) => {
        if (uploadedImages[index] && oldImage !== uploadedImages[index]) deleteOldImage(oldImage);
      });
    }

    return res.json({
      success: true,
      message: ProductID ? "Product updated successfully" : "Product created successfully",
      ProductID: savedProductID,
      ProductCode,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.promise().rollback();
      } catch (rollbackError) {
        console.error("Product save rollback failed:", rollbackError);
      }
      connection.release();
    }
    console.error("Save product error:", error);
    return res.status(500).json({ success: false, message: "Failed to save product." });
  }
};*/

exports.updateDisplayOrder = (req, res) => {
  const updates = req.body;
  if (!Array.isArray(updates))
    return res.status(400).json({ success: false, message: "Invalid format" });
  const queries = updates.map((item) => {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE mst_productdata SET DisplayOrder = ? WHERE ProductID = ?",
        [item.DisplayOrder, item.ProductID],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        },
      );
    });
  });
  Promise.all(queries)
    .then(() =>
      res.json({
        success: true,
        message: "Display order updated successfully",
      }),
    )
    .catch((err) =>
      res.status(500).json({ success: false, message: "Database error" }),
    );
};

exports.getMaxDisplayOrder = (req, res) => {
  const sql = `SELECT MAX(DisplayOrder) AS maxOrder FROM mst_productdata`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ maxOrder: results[0]?.maxOrder || 0 });
  });
};

exports.deleteProduct = async (req, res) => {
  const ProductID = Number(req.params.ProductID);
  if (!Number.isInteger(ProductID) || ProductID < 1) {
    return res.status(400).json({ success: false, message: "Invalid product ID." });
  }
  let connection;
  try {
    connection = await new Promise((resolve, reject) => {
      db.getConnection((error, conn) => (error ? reject(error) : resolve(conn)));
    });
    const queries = connection.promise();
    await queries.beginTransaction();
    const [products] = await queries.query(
      `SELECT ProductImage, ProductBannerImage, ProductBannerImage1, ProductBannerImage2,
              ProductBannerImage3, ProductBannerImage4
       FROM mst_productdata WHERE ProductID = ? LIMIT 1`,
      [ProductID],
    );
    if (!products.length) {
      await queries.rollback();
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    await queries.query("DELETE FROM mst_productcolordata WHERE ProductID = ?", [ProductID]);
    await queries.query("DELETE FROM mst_productoccasiondata WHERE ProductID = ?", [ProductID]);
    const [deletedProduct] = await queries.query(
      "DELETE FROM mst_productdata WHERE ProductID = ?",
      [ProductID],
    );
    if (!deletedProduct.affectedRows) {
      await queries.rollback();
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    await queries.commit();
    const {
      ProductImage,
      ProductBannerImage,
      ProductBannerImage1,
      ProductBannerImage2,
      ProductBannerImage3,
      ProductBannerImage4,
    } = products[0];
    if (ProductImage) deleteOldImage(ProductImage);
    if (ProductBannerImage) deleteOldImage(ProductBannerImage);
    [ProductBannerImage1, ProductBannerImage2, ProductBannerImage3, ProductBannerImage4].forEach(deleteOldImage);
    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    if (connection) {
      try {
        await connection.promise().rollback();
      } catch (rollbackError) {
        console.error("Product delete rollback failed:", rollbackError);
      }
    }
    console.error("Delete product error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete product." });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateActiveStatus = (req, res) => {
  const { ProductID, ActiveStatus } = req.body;
  if (!ProductID || ActiveStatus === undefined)
    return res
      .status(400)
      .json({ success: false, message: "Missing ID/Status" });
  const sql = `UPDATE mst_productdata SET ActiveStatus = ?, UpdatedOn = NOW() WHERE ProductID = ?`;
  db.query(sql, [ActiveStatus, ProductID], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    res.json({ success: true, message: "Status updated successfully" });
  });
};

exports.getAllActiveProducts = (req, res) => {
  const sql = `
    SELECT ProductName, ProductNameURL, ProductCode, CategoryID, ProductImage, ProductBannerImage,
           ProductBannerImage1, ProductBannerImage2, ProductBannerImage3, ProductBannerImage4,
           ActiveStatus, DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
    FROM mst_productdata Where ActiveStatus=1 ORDER BY ProductID desc
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
};

exports.getProductDataBySlug = (req, res) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }
  const sqlMain = `
    SELECT 
      ProductID,
      ProductName,
      ProductNameURL,
      ProductTagline,
      ProductSmallDescription
      ProductCode,
      CategoryID,
      ProductImage,
      ProductBannerImage,
      ProductBannerImage1,
      ProductBannerImage2,
      ProductBannerImage3,
      ProductBannerImage4,
      Description,
      SpecificationDescription,
      ReturnPolicyDescription,
      ShippingPolicyDescription,
      ActiveStatus,
      MetaTitle,
      MetaKeywords,
      MetaDescriptions,
      MetaSchema,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate,
      UpdatedBy,
      UpdatedOn
    FROM mst_productdata
    WHERE ProductNameURL = ? AND ActiveStatus = 1
    LIMIT 1
  `;
  db.query(sqlMain, [slug], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const product = results[0];
    db.query(
      `SELECT o.OccasionID, o.OccasionName, o.OccasionURL
       FROM mst_productoccasiondata po
       INNER JOIN mst_occasiondata o ON o.OccasionID = po.OccasionID
       WHERE po.ProductID = ?
       ORDER BY o.DisplayOrder, o.OccasionID`,
      [product.ProductID],
      (occasionError, occasionResults) => {
        if (occasionError) {
          return res.status(500).json({ success: false, error: occasionError.message });
        }
        product.Occasions = occasionResults;
        product.OccasionIDs = occasionResults.map(({ OccasionID }) => OccasionID);
        db.query(
          `SELECT pc.ColorID, c.ColorName, c.ColorCode,
                  pc.ProductMRP, pc.ProductSalePrice, pc.ProductOldStock,
                  pc.ProductTotalStock, pc.ProductOutOfStock
           FROM mst_productcolordata pc
           INNER JOIN mst_colordata c ON c.ColorID = pc.ColorID
           WHERE pc.ProductID = ?
           ORDER BY c.DisplayOrder, c.ColorID`,
          [product.ProductID],
          (colorError, colorResults) => {
            if (colorError) {
              return res.status(500).json({ success: false, error: colorError.message });
            }
            product.ProductColors = colorResults;
            const sqlMoreProducts = `
          SELECT
            ProductID,
            ProductName,
            ProductNameURL,
            ProductImage,
            DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
          FROM mst_productdata
          WHERE ActiveStatus = 1
            AND ProductID != ?
          ORDER BY ProductID DESC
          LIMIT 10
        `;
            db.query(sqlMoreProducts, [product.ProductID], (err2, moreResults) => {
              if (err2) {
                return res.status(500).json({ success: false, error: err2.message });
              }
              product.moreProducts = moreResults || [];
              return res.json({
                success: true,
                type: "product",
                data: product,
              });
            });
          });
      },
    );
  });
};
