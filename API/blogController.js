const db = require("../db");
const path = require("path");
const fs = require("fs");

const deleteOldImage = (imagePath) => {
  // if (!imagePath) return;
  // const fullPath = path.join(
  //   __dirname,
  //   "../uploads/OnlineImages/BlogImages",
  //   imagePath,
  // );
  // fs.unlink(fullPath, (err) => {
  //   if (err) {
  //     console.error("Error deleting old image:", err);
  //   }
  // });
};

exports.getAllBlogs = (req, res) => {
  const sql = `SELECT ROW_NUMBER() OVER (ORDER BY BlogID DESC) AS SerialNo, BlogID, BlogName, BlogNameURL, BlogImage, BlogBannerImage, DisplayOrder, ActiveStatus, DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate FROM mst_blogdata ORDER BY BlogID DESC;`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getBlogById = (req, res) => {
  const BlogID = req.query.BlogID;
  if (!BlogID)
    return res.status(400).json({ success: false, message: "Missing ID" });
  const sql = "SELECT * FROM mst_blogdata WHERE BlogID = ? LIMIT 1";
  db.query(sql, [BlogID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    if (results.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    return res.json({ success: true, data: results[0] });
  });
};

exports.saveOrUpdateBlog = (req, res) => {
  const {
    BlogID,
    BlogName,
    BlogNameURL,
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
  const BlogImage = req?.files?.BlogImage?.[0]?.filename || null;
  const BlogBannerImage = req?.files?.BlogBannerImage?.[0]?.filename || null;
  const checkDuplicateSql = `
    SELECT BlogID FROM mst_blogdata
    WHERE (BlogName = ? OR BlogNameURL = ?)
    ${BlogID ? "AND BlogID != ?" : ""}
  `;
  const checkParams = BlogID
    ? [BlogName, BlogNameURL, BlogID]
    : [BlogName, BlogNameURL];
  db.query(checkDuplicateSql, checkParams, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error", error: err });
    if (results.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Blog with the same name or URL already exists",
      });
    }
    if (BlogID) {
      const getOldSql =
        "SELECT BlogImage, BlogBannerImage FROM mst_blogdata WHERE BlogID = ?";
      db.query(getOldSql, [BlogID], (err, oldResults) => {
        if (err || oldResults.length === 0)
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        const finalImage = BlogImage || oldResults[0].BlogImage;
        const finalBanner = BlogBannerImage || oldResults[0].BlogBannerImage;
        if (
          BlogImage &&
          oldResults[0].BlogImage &&
          BlogImage !== oldResults[0].BlogImage
        ) {
          deleteOldImage(oldResults[0].BlogImage);
        }
        if (
          BlogBannerImage &&
          oldResults[0].BlogBannerImage &&
          BlogBannerImage !== oldResults[0].BlogBannerImage
        ) {
          deleteOldImage(oldResults[0].BlogBannerImage);
        }
        const updateSql = `
          UPDATE mst_blogdata SET
            BlogName = ?, BlogNameURL = ?, BlogImage = ?, BlogBannerImage = ?, 
            Description = ?, ActiveStatus = ?, DisplayOrder = ?,
            MetaTitle = ?, MetaKeywords = ?, MetaDescriptions = ?, MetaSchema = ?, 
            UpdatedBy = ?, UpdatedOn = ?
          WHERE BlogID = ?
        `;
        db.query(
          updateSql,
          [
            BlogName,
            BlogNameURL,
            finalImage,
            finalBanner,
            Description,
            ActiveStatus,
            DisplayOrder,
            MetaTitle,
            MetaKeywords,
            MetaDescriptions,
            MetaSchema,
            UpdatedBy,
            currentTime,
            BlogID,
          ],
          (err) => {
            if (err)
              return res
                .status(500)
                .json({ success: false, message: "Update failed", error: err });
            return res.json({
              success: true,
              message: "Blog updated successfully",
            });
          },
        );
      });
    } else {
      const insertSql = `
        INSERT INTO mst_blogdata (
          BlogName, BlogNameURL, BlogImage, BlogBannerImage, 
          Description, ActiveStatus, DisplayOrder,
          MetaTitle, MetaKeywords, MetaDescriptions, MetaSchema, 
          PostedDate, UpdatedBy, UpdatedOn
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(
        insertSql,
        [
          BlogName,
          BlogNameURL,
          BlogImage,
          BlogBannerImage,
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
            message: "Blog created successfully",
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
        "UPDATE mst_blogdata SET DisplayOrder = ? WHERE BlogID = ?",
        [item.DisplayOrder, item.BlogID],
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
  const sql = `SELECT MAX(DisplayOrder) AS maxOrder FROM mst_blogdata`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ maxOrder: results[0]?.maxOrder || 0 });
  });
};

exports.deleteBlog = (req, res) => {
  const BlogID = req.params.BlogID;
  const getImageSql = `SELECT BlogImage, BlogBannerImage FROM mst_blogdata WHERE BlogID = ?`;
  db.query(getImageSql, [BlogID], (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "Not found" });
    const { BlogImage, BlogBannerImage } = results[0];
    db.query(
      "DELETE FROM mst_blogdata WHERE BlogID = ?",
      [BlogID],
      (err, result) => {
        if (err)
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        if (result.affectedRows === 0)
          return res.status(404).json({ success: false, message: "Not found" });
        if (BlogImage) deleteOldImage(BlogImage);
        if (BlogBannerImage) deleteOldImage(BlogBannerImage);
        res.json({ success: true, message: "Blog deleted successfully" });
      },
    );
  });
};

exports.updateActiveStatus = (req, res) => {
  const { BlogID, ActiveStatus } = req.body;
  if (!BlogID || ActiveStatus === undefined)
    return res
      .status(400)
      .json({ success: false, message: "Missing ID/Status" });
  const sql = `UPDATE mst_blogdata SET ActiveStatus = ?, UpdatedOn = NOW() WHERE BlogID = ?`;
  db.query(sql, [ActiveStatus, BlogID], (err, result) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    res.json({ success: true, message: "Status updated successfully" });
  });
};

exports.getAllActiveBlogs = (req, res) => {
  const sql = `SELECT BlogName, BlogNameURL, BlogImage, BlogBannerImage, ActiveStatus, DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate FROM mst_blogdata Where ActiveStatus=1 ORDER BY BlogID desc`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
};

exports.getBlogDataBySlug = (req, res) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid slug" });
  }
  const sqlMain = `
    SELECT 
      BlogID,
      BlogName,
      BlogNameURL,
      BlogImage,
      BlogBannerImage,
      Description,
      ActiveStatus,
      MetaTitle,
      MetaKeywords,
      MetaDescriptions,
      MetaSchema,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate,
      UpdatedBy,
      UpdatedOn
    FROM mst_blogdata
    WHERE BlogNameURL = ? AND ActiveStatus = 1
    LIMIT 1
  `;
  db.query(sqlMain, [slug], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }
    const blog = results[0];
    const sqlMoreBlogs = `
      SELECT 
        BlogID,
        BlogName,
        BlogNameURL,
        BlogImage,
        DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate
      FROM mst_blogdata
      WHERE ActiveStatus = 1 
        AND BlogID != ?
      ORDER BY BlogID DESC
      LIMIT 10
    `;
    db.query(sqlMoreBlogs, [blog.BlogID], (err2, moreResults) => {
      if (err2) {
        return res.status(500).json({ success: false, error: err2.message });
      }
      blog.moreBlogs = moreResults || [];
      return res.json({
        success: true,
        type: "blog",
        data: blog,
      });
    });
  });
};
