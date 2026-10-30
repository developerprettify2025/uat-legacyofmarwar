const db = require("../db");
const path = require("path");
const fs = require("fs");

const deleteOldImage = (imagePath) => {
  // if (!imagePath) return;
  // const fullPath = path.join(
  //   __dirname,
  //   "../uploads/OnlineImages/CategoryImages",
  //   imagePath,
  // );
  // fs.unlink(fullPath, (err) => {
  //   if (err) {
  //     console.error("Error deleting old image:", err);
  //   }
  // });
};

exports.getAllCategorys = (req, res) => {
  const sql = `SELECT ROW_NUMBER() OVER (ORDER BY CategoryID DESC) AS SerialNo, CategoryID, CategoryName, CategoryNameURL, CategoryImage, CategoryBannerImage, DisplayOrder, ActiveStatus, DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate FROM mst_categorydata ORDER BY CategoryID DESC;`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getCategoryById = (req, res) => {
  const CategoryID = req.query.CategoryID;
  if (!CategoryID)
    return res.status(400).json({ success: false, message: "Missing ID" });
  const sql = "SELECT * FROM mst_categorydata WHERE CategoryID = ? LIMIT 1";
  db.query(sql, [CategoryID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    return res.json({ success: true, data: results[0] });
  });
};

exports.saveOrUpdateCategory = (req, res) => {
  const {
    CategoryID,
    CategoryName,
    CategoryNameURL,
    SmallDescription,
    Description,
    ActiveStatus,
    DisplayOrder,
    MetaTitle,
    MetaKeywords,
    MetaDescriptions,
    MetaSchema,
    UpdatedBy,
  } = req.body;
  const currentTime = new Date();
  const CategoryImage = req?.files?.CategoryImage?.[0]?.filename || null;
  const CategoryBannerImage = req?.files?.CategoryBannerImage?.[0]?.filename || null;
  const CategoryVideo = req?.files?.CategoryVideo?.[0]?.filename || null;
  const checkDuplicateSql = `
    SELECT CategoryID FROM mst_categorydata
    WHERE (CategoryName = ? OR CategoryNameURL = ?)
    ${CategoryID ? "AND CategoryID != ?" : ""}
  `;
  const checkParams = CategoryID
    ? [CategoryName, CategoryNameURL, CategoryID]
    : [CategoryName, CategoryNameURL];
  db.query(checkDuplicateSql, checkParams, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error", error: err });
    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Category with the same name or URL already exists",
      });
    }
    if (CategoryID) {
      const getOldSql =
        "SELECT CategoryImage, CategoryBannerImage, CategoryVideo FROM mst_categorydata WHERE CategoryID = ?";
      db.query(getOldSql, [CategoryID], (err, oldResults) => {
        if (err || oldResults.length === 0)
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        const finalImage = CategoryImage || oldResults[0].CategoryImage;
        const finalBanner = CategoryBannerImage || oldResults[0].CategoryBannerImage;
        const finalVideo = CategoryVideo || oldResults[0].CategoryVideo;
        if (
          CategoryImage &&
          oldResults[0].CategoryImage &&
          CategoryImage !== oldResults[0].CategoryImage
        ) {
          deleteOldImage(oldResults[0].CategoryImage);
        }
        if (
          CategoryBannerImage &&
          oldResults[0].CategoryBannerImage &&
          CategoryBannerImage !== oldResults[0].CategoryBannerImage
        ) {
          deleteOldImage(oldResults[0].CategoryBannerImage);
        }
        const updateSql = `
          UPDATE mst_categorydata SET
            CategoryName = ?, CategoryNameURL = ?, CategoryImage = ?, CategoryBannerImage = ?, 
            CategoryVideo = ?, SmallDescription = ?, Description = ?, ActiveStatus = ?, DisplayOrder = ?,
            MetaTitle = ?, MetaKeywords = ?, MetaDescriptions = ?, MetaSchema = ?, 
            UpdatedBy = ?, UpdatedOn = ?
          WHERE CategoryID = ?
        `;
        db.query(
          updateSql,
          [
            CategoryName,
            CategoryNameURL,
            finalImage,
            finalBanner,
            finalVideo,
            SmallDescription,
            Description,
            ActiveStatus,
            DisplayOrder,
            MetaTitle,
            MetaKeywords,
            MetaDescriptions,
            MetaSchema,
            UpdatedBy,
            currentTime,
            CategoryID,
          ],
          (err) => {
            if (err)
              return res
                .status(500)
                .json({ success: false, message: "Update failed", error: err });
            return res.json({
              success: true,
              message: "Category updated successfully",
            });
          },
        );
      });
    } else {
      const insertSql = `
        INSERT INTO mst_categorydata (
          CategoryName, CategoryNameURL, CategoryImage, CategoryBannerImage, 
          CategoryVideo, SmallDescription, Description, ActiveStatus, DisplayOrder,
          MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema, 
          PostedDate, UpdatedBy, UpdatedOn
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertSql,
        [
          CategoryName,
          CategoryNameURL,
          CategoryImage,
          CategoryBannerImage,
          CategoryVideo,
          SmallDescription,
          Description,
          ActiveStatus,
          DisplayOrder,
          MetaTitle,
          MetaKeywords,
          MetaDescriptions,
          MetaSchema,
          currentTime,
          UpdatedBy,
          currentTime,
        ],
        (err) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Insert failed", error: err });
          return res.json({
            success: true,
            message: "Category created successfully",
          });
        },
      );
    }
  });
};

exports.updateDisplayOrder = (req, res) => {
  const updates = req.body;
  if (!Array.isArray(updates))
    return res.status(400).json({ success: false, message: "Invalid format" });
  const queries = updates.map((item) => {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE mst_categorydata SET DisplayOrder = ? WHERE CategoryID = ?",
        [item.DisplayOrder, item.CategoryID],
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
  const sql = `SELECT MAX(DisplayOrder) AS maxOrder FROM mst_categorydata`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ maxOrder: results[0]?.maxOrder || 0 });
  });
};

exports.deleteCategory = (req, res) => {
  const CategoryID = req.params.CategoryID;
  const getImageSql = `SELECT CategoryImage, CategoryBannerImage FROM mst_categorydata WHERE CategoryID = ?`;
  db.query(getImageSql, [CategoryID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "Not found" });
    const { CategoryImage, CategoryBannerImage } = results[0];
    db.query(
      "DELETE FROM mst_categorydata WHERE CategoryID = ?",
      [CategoryID],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        if (result.affectedRows === 0)
          return res.status(404).json({ success: false, message: "Not found" });
        if (CategoryImage) deleteOldImage(CategoryImage);
        if (CategoryBannerImage) deleteOldImage(CategoryBannerImage);
        res.json({ success: true, message: "Category deleted successfully" });
      },
    );
  });
};

exports.updateActiveStatus = (req, res) => {
  const { CategoryID, ActiveStatus } = req.body;
  if (!CategoryID || ActiveStatus === undefined)
    return res
      .status(400)
      .json({ success: false, message: "Missing ID/Status" });
  const sql = `UPDATE mst_categorydata SET ActiveStatus = ?, UpdatedOn = NOW() WHERE CategoryID = ?`;
  db.query(sql, [ActiveStatus, CategoryID], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    res.json({ success: true, message: "Status updated successfully" });
  });
};

exports.getAllActiveCategorys = (req, res) => {
  const sql = `
    SELECT CategoryName, CategoryNameURL, CategoryImage, CategoryBannerImage,
           ActiveStatus, DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
    FROM mst_categorydata Where ActiveStatus=1 ORDER BY CategoryID desc
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
};

exports.getCategoryDataBySlug = (req, res) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }
  const sqlMain = `
    SELECT 
      CategoryID,
      CategoryName,
      CategoryNameURL,
      CategoryImage,
      CategoryBannerImage,
      CategoryVideo,
      SmallDescription,
      Description,
      ActiveStatus,
      MetaTitle,
      MetaKeywords,
      MetaDescriptions,
      MetaSchema,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate,
      UpdatedBy,
      UpdatedOn
    FROM mst_categorydata
    WHERE CategoryNameURL = ?
    LIMIT 1
  `;
  db.query(sqlMain, [slug], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    const category = results[0];
    const sqlMoreCategorys = `
      SELECT 
        CategoryID,
        CategoryName,
        CategoryNameURL,
        CategoryImage,
        DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
      FROM mst_categorydata
      WHERE ActiveStatus = 1 
        AND CategoryID != ?
      ORDER BY CategoryID DESC
      LIMIT 10
    `;
    db.query(sqlMoreCategorys, [category.CategoryID], (err2, moreResults) => {
      if (err2) {
        return res.status(500).json({ success: false, error: err2.message });
      }
      category.moreCategorys = moreResults || [];
      return res.json({
        success: true,
        type: "category",
        data: category,
      });
    });
  });
};
