const db = require("../db");
const path = require("path");
const fs = require("fs");

const deleteOldImage = (imagePath) => {
  // if (!imagePath) return;
  // const fullPath = path.join(
  //   __dirname,
  //   "../uploads/OnlineImages/PageImages",
  //   imagePath,
  // );
  // fs.unlink(fullPath, (err) => {
  //   if (err && err.code !== "ENOENT") {
  //     console.error("Error deleting old image:", err);
  //   }
  // });
};

exports.getAllStatics = (req, res) => {
  const sql = `
    SELECT ROW_NUMBER() OVER (ORDER BY StaticID DESC) AS SerialNo,
           StaticID, StaticName, StaticNameURL, ActiveStatus,
           DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
    FROM mst_staticdata ORDER BY StaticID DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
};

exports.getStaticById = (req, res) => {
  const StaticID = req.query.StaticID;
  if (!StaticID) return res.status(400).json({ success: false, message: "Missing Static ID" });
  const sql = "SELECT * FROM mst_staticdata WHERE StaticID = ? LIMIT 1";
  db.query(sql, [StaticID], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Internal server error" });
    if (results.length === 0) return res.status(404).json({ success: false, message: "Static not found" });
    return res.json({ success: true, data: results[0] });
  });
};

exports.saveOrUpdateStatic = (req, res) => {
  const {
    StaticID,
    StaticName,
    StaticNameURL,
    SmallDescription,
    Description,
    ActiveStatus,
    StaticAddress,
    StaticAddress2,
    StaticPhoneNumber,
    StaticPhoneNumber2,
    StaticEmail,
    StaticTwitterLink,
    StaticFacebookLink,
    StaticInstagramLink,
    StaticLinkedInLink,
    StaticYouTubeLink,
    StaticWhatsAppLink,
    StaticPinterestLink,
    MetaTitle,
    MetaKeywords,
    MetaDescriptions,
    MetaSchema,
    UpdatedBy,
  } = req.body;
  const StaticImage =
    req.files?.StaticImage?.[0]?.filename || req.body.StaticImage || null;
  const StaticBannerVideo =
    req.files?.StaticBannerVideo?.[0]?.filename ||
    req.body.StaticBannerVideo ||
    null;
  const currentTime = new Date();
  const checkDuplicateSql = `
    SELECT StaticID FROM mst_staticdata 
    WHERE (StaticName = ? OR StaticNameURL = ?) 
    ${StaticID ? "AND StaticID != ?" : ""}
  `;
  const checkParams = StaticID
    ? [StaticName, StaticNameURL, StaticID]
    : [StaticName, StaticNameURL];

  db.query(checkDuplicateSql, checkParams, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });

    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Static with the same name or URL already exists",
      });
    }
    if (StaticID) {
      const fetchImageSql =
        "SELECT StaticImage, StaticBannerVideo FROM mst_staticdata WHERE StaticID = ?";
      db.query(fetchImageSql, [StaticID], (err, result) => {
        if (err || result.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid StaticID" });
        }
        const oldData = result[0];

        if (
          StaticImage &&
          oldData.StaticImage &&
          StaticImage !== oldData.StaticImage
        ) {
          deleteOldImage(oldData.StaticImage);
        }
        if (
          StaticBannerVideo &&
          oldData.StaticBannerVideo &&
          StaticBannerVideo !== oldData.StaticBannerVideo
        ) {
          deleteOldImage(oldData.StaticBannerVideo);
        }

        const updateSql = `
          UPDATE mst_staticdata SET
            StaticName = ?, StaticNameURL = ?,
            ${StaticImage ? "StaticImage = ?," : ""}
            ${StaticBannerVideo ? "StaticBannerVideo = ?," : ""}
            SmallDescription = ?, Description = ?, ActiveStatus = ?,
            StaticAddress = ?, StaticAddress2 = ?,
            StaticPhoneNumber = ?, StaticPhoneNumber2 = ?, StaticEmail = ?,
            StaticTwitterLink = ?, StaticFacebookLink = ?, StaticInstagramLink = ?,
            StaticLinkedInLink = ?, StaticYouTubeLink = ?, StaticWhatsAppLink = ?, StaticPinterestLink = ?,
            MetaTitle = ?, MetaKeywords = ?, MetaDescriptions = ?, MetaSchema = ?,
            UpdatedBy = ?, UpdatedOn = ?
          WHERE StaticID = ?
        `;
        const updateParams = [
          StaticName,
          StaticNameURL,
          ...(StaticImage ? [StaticImage] : []),
          ...(StaticBannerVideo ? [StaticBannerVideo] : []),
          SmallDescription,
          Description,
          ActiveStatus,
          StaticAddress,
          StaticAddress2,
          StaticPhoneNumber,
          StaticPhoneNumber2,
          StaticEmail,
          StaticTwitterLink,
          StaticFacebookLink,
          StaticInstagramLink,
          StaticLinkedInLink,
          StaticYouTubeLink,
          StaticWhatsAppLink,
          StaticPinterestLink,
          MetaTitle,
          MetaKeywords,
          MetaDescriptions,
          MetaSchema,
          UpdatedBy,
          currentTime,
          StaticID,
        ];

        db.query(updateSql, updateParams, (err) => {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({
                success: false,
                message: err.message || "Update failed",
              });
          }
          return res.json({
            success: true,
            message: "Static updated successfully",
          });
        });
      });
    } else {
      const insertSql = `
        INSERT INTO mst_staticdata (
          StaticName, StaticNameURL, StaticImage, StaticBannerVideo,
          SmallDescription, Description, ActiveStatus,
          StaticAddress, StaticAddress2,
          StaticPhoneNumber, StaticPhoneNumber2, StaticEmail,
          StaticTwitterLink, StaticFacebookLink, StaticInstagramLink,
          StaticLinkedInLink, StaticYouTubeLink, StaticWhatsAppLink, StaticPinterestLink,
          MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema,
          PostedDate, UpdatedBy, UpdatedOn
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        StaticName,
        StaticNameURL,
        StaticImage,
        StaticBannerVideo,
        SmallDescription,
        Description,
        ActiveStatus,
        StaticAddress,
        StaticAddress2,
        StaticPhoneNumber,
        StaticPhoneNumber2,
        StaticEmail,
        StaticTwitterLink,
        StaticFacebookLink,
        StaticInstagramLink,
        StaticLinkedInLink,
        StaticYouTubeLink,
        StaticWhatsAppLink,
        StaticPinterestLink,
        MetaTitle,
        MetaKeywords,
        MetaDescriptions,
        MetaSchema,
        currentTime,
        UpdatedBy,
        currentTime,
      ];

      db.query(insertSql, insertParams, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message:
              err.sqlMessage ||
              err.message ||
              "Insert failed due to server error",
          });
        }
        return res.json({
          success: true,
          message: "Static created successfully",
        });
      });
    }
  });
};

exports.deleteStatic = (req, res) => {
  const StaticID = req.params.StaticID;
  const fetchSql =
    "SELECT StaticImage, StaticBannerVideo FROM mst_staticdata WHERE StaticID = ?";

  db.query(fetchSql, [StaticID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Static not found" });

    const oldData = results[0];
    const sql = "DELETE FROM mst_staticdata WHERE StaticID = ?";

    db.query(sql, [StaticID], (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ success: false, message: "Database error" });

      deleteOldImage(oldData.StaticImage);
      deleteOldImage(oldData.StaticBannerVideo);

      res.json({ success: true, message: "Static deleted successfully" });
    });
  });
};

exports.getMataDataById = (req, res) => {
  const StaticID = req.params.ID;
  if (!StaticID)
    return res
      .status(400)
      .json({ success: false, message: "Missing Static ID" });

  const sql = "SELECT * FROM mst_staticdata WHERE StaticID = ? LIMIT 1";
  db.query(sql, [StaticID], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
    if (!results || results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Static not found" });
    return res.json({ success: true, data: results[0] });
  });
};

exports.getMataDataByUrl = (req, res) => {
  const url = String(req.params.url || "").trim();

  if (!url || url.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Missing URL parameter",
    });
  }

  // 1. Static Page Metadata
  const sqlStatic = `
    SELECT
      StaticID,
      StaticName,
      StaticImage,
      SmallDescription,
      MetaTitle,
      MetaDescriptions,
      MetaKeywords,
      MetaSchema,
      'static' AS type
    FROM mst_staticdata
    WHERE StaticNameURL = ? AND ActiveStatus = 1
    LIMIT 1
  `;

  // 2. Product Metadata
  const sqlProduct = `
    SELECT
      ProductID AS StaticID,
      ProductName AS StaticName,
      ProductBannerImage AS StaticImage,
      ProductCode AS SmallDescription,
      MetaTitle,
      MetaDescriptions,
      MetaKeywords,
      MetaSchema,
      'Product' AS type
    FROM mst_productdata
    WHERE ProductNameURL = ?
    LIMIT 1
  `;

  // 3. Category Metadata
  const sqlCategory = `
    SELECT
      CategoryID AS StaticID,
      CategoryName AS StaticName,
      CategoryBannerImage AS StaticImage,
      SmallDescription,
      MetaTitle,
      MetaDescriptions,
      MetaKeywords,
      MetaSchema,
      'Category' AS type
    FROM mst_categorydata
    WHERE CategoryNameURL = ?
    LIMIT 1
  `;

  // 4. Blog Metadata
  const sqlBlog = `
    SELECT
      BlogID AS StaticID,
      BlogName AS StaticName,
      BlogBannerImage AS StaticImage,
      SmallDescription,
      MetaTitle,
      MetaDescriptions,
      MetaKeywords,
      MetaSchema,
      'Blog' AS type
    FROM mst_blogdata
    WHERE BlogNameURL = ?
    LIMIT 1
  `;

  // Helper function for database errors
  const handleError = (err, source) => {
    console.error(`Meta fetch error (${source}):`, err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  };

  // Helper function to send a successful response
  const sendResponse = (results) => {
    return res.json({
      success: true,
      found: true,
      data: results[0],
    });
  };

  // 1. Check Static Page
  db.query(sqlStatic, [url], (err, staticResults) => {
    if (err) return handleError(err, "static");

    if (staticResults?.length > 0) {
      return sendResponse(staticResults);
    }

    // 2. Check Product
    db.query(sqlProduct, [url], (err, productResults) => {
      if (err) return handleError(err, "product");

      if (productResults?.length > 0) {
        return sendResponse(productResults);
      }

      // 3. Check Category
      db.query(sqlCategory, [url], (err, categoryResults) => {
        if (err) return handleError(err, "category");

        if (categoryResults?.length > 0) {
          return sendResponse(categoryResults);
        }

        // 4. Check Blog
        db.query(sqlBlog, [url], (err, blogResults) => {
          if (err) return handleError(err, "blog");

          if (blogResults?.length > 0) {
            return sendResponse(blogResults);
          }

          // 5. Metadata Not Found
          // 404 status nahi bhej rahe, warna frontend par console error aata hai.
          // Frontend `data === null` dekh kar notFound() (404 page) dikhayega.
          return res.json({
            success: false,
            found: false,
            data: null,
            message: "Meta data not found",
          });
        });
      });
    });
  });
};

/*exports.getMataDataByUrl = (req, res) => {
  const url = req.params.url;
  if (!url) {
    return res
      .status(400)
      .json({ success: false, message: "Missing URL parameter" });
  }

  const sqlStatic = `
    SELECT 
      StaticID,
      MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema,
      'static' AS type
    FROM mst_staticdata
    WHERE StaticNameURL = ? AND ActiveStatus = 1
    LIMIT 1
  `;

  const sqlProduct = `
    SELECT 
      CategoryID AS StaticID,
      MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema,
      'Treatment' AS type
    FROM mst_productdata
    WHERE TreatmentNameURL = ?
    LIMIT 1
  `;

  const sqlCategory = `
    SELECT 
      CategoryID AS StaticID,
      MetaTitle, MetaDescriptions, MetaKeywords, MetaSchema,
      'Treatment' AS type
    FROM mst_categorydata
    WHERE CategoryNameURL = ?
    LIMIT 1
  `;

  db.query(sqlStatic, [url], (err, staticResults) => {
    if (err) {
      console.error("Meta fetch error (static):", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }

    if (staticResults?.length > 0) {
      return res.json({ success: true, data: staticResults[0] });
    }

    db.query(sqlProduct, [url], (err, projectResults) => {
      if (err) {
        console.error("Meta fetch error (project):", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }

      if (projectResults?.length > 0) {
        return res.json({ success: true, data: projectResults[0] });
      }

      return res
        .status(404)
        .json({ success: false, message: "Meta data not found" });
    });
  });
};*/