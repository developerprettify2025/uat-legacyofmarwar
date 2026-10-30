
const db = require("../db");

// Common product joins
const sqlView = ` mst_productdata pd INNER JOIN mst_categorydata cd ON pd.CategoryID = cd.CategoryID INNER JOIN mst_productcolordata pcd ON pd.ProductID = pcd.ProductID INNER JOIN mst_colordata cod ON pcd.ColorID = cod.ColorID LEFT JOIN mst_customerwishlistdata w ON w.ProductID = pd.ProductID AND w.CustomerID = ? WHERE pd.ActiveStatus = 1 AND cd.ActiveStatus = 1 AND cod.ActiveStatus = 1 AND pcd.ProductSalePrice > 0 `;
const sqlOccasionsView = ` mst_productdata pd INNER JOIN mst_categorydata cd ON pd.CategoryID = cd.CategoryID INNER JOIN mst_productcolordata pcd ON pd.ProductID = pcd.ProductID INNER JOIN mst_colordata cod ON pcd.ColorID = cod.ColorID LEFT JOIN mst_customerwishlistdata w ON w.ProductID = pd.ProductID AND w.CustomerID = ? INNER JOIN mst_productoccasiondata pod ON pod.ProductID = pd.ProductID INNER JOIN mst_occasiondata od ON pod.OccasionID = od.OccasionID WHERE pd.ActiveStatus = 1 AND cd.ActiveStatus = 1 AND cod.ActiveStatus = 1 AND pcd.ProductSalePrice > 0 AND od.ActiveStatus = 1 `;
const getCustomerID = (req) => {
  const value = req.body?.CustomerID ?? req.query?.CustomerID ?? 0;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : 0;
};

const executeQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

// Common wishlist expression.
// Use MAX because product variants can produce multiple rows.
const wishlistColumn = `MAX(CASE WHEN w.CustomerWishlistID IS NOT NULL THEN 1 ELSE 0 END) AS IsWishlisted`;
// --------------------------------------------------
// Header data
// --------------------------------------------------
exports.getAllDataOfHeader = async (req, res) => {
  const CustomerID = getCustomerID(req);
  const categorySql = ` SELECT cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage FROM ${sqlView} GROUP BY cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.DisplayOrder ORDER BY cd.DisplayOrder ASC `;
  const pageSql = ` SELECT * FROM mst_staticdata WHERE StaticID = 4 ORDER BY StaticID ASC `;
  try {
    const [categories, page] = await Promise.all([
      executeQuery(categorySql, [CustomerID]),
      executeQuery(pageSql),
    ]);

    return res.json({
      success: true,
      categories,
      page: page[0] || null,
    });
  } catch (err) {
    console.error("Header SQL Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch header data.",
      error: err.message,
    });
  }
};

// --------------------------------------------------
// Product search
// --------------------------------------------------
exports.searchProducts = async (req, res) => {
  const CustomerID = getCustomerID(req);
  const keyword = String(req.query.keyword || "").trim();

  if (!keyword) {
    return res.status(400).json({
      success: false,
      message: "Please enter a search keyword.",
      products: [],
    });
  }

  const likeKeyword = `%${keyword}%`;

  const sql = `SELECT
      pd.ProductID,
      pd.ProductCode,
      pd.ProductName,
      pd.ProductNameURL,
      pd.ProductImage,
      pd.ProductBannerImage4,
      MIN(pcd.ProductSalePrice) AS ProductSalePrice,
      GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName,
      ${wishlistColumn},
      ${CustomerID} as ItemID
    FROM ${sqlView}
      AND (
        pd.ProductCode LIKE ?
        OR pd.ProductName LIKE ?
        OR pd.ProductNameURL LIKE ?
        OR cd.CategoryName LIKE ?
        OR cd.CategoryNameURL LIKE ?
        OR cod.ColorName LIKE ?
      )
    GROUP BY
      pd.ProductID,
      pd.ProductCode,
      pd.ProductName,
      pd.ProductNameURL,
      pd.ProductImage,
      pd.ProductBannerImage4,
      pd.DisplayOrder
    ORDER BY
      CASE
        WHEN pd.ProductName = ? THEN 1
        WHEN pd.ProductCode = ? THEN 2
        WHEN pd.ProductNameURL = ? THEN 3
        WHEN pd.ProductName LIKE ? THEN 4
        WHEN pd.ProductCode LIKE ? THEN 5
        WHEN pd.ProductNameURL LIKE ? THEN 6
        WHEN cd.CategoryName LIKE ? THEN 7
        WHEN cd.CategoryNameURL LIKE ? THEN 8
        WHEN cod.ColorName LIKE ? THEN 9
        ELSE 10
      END ASC,
      pd.ProductName ASC
    LIMIT 20
  `;

  const params = [
    CustomerID,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    keyword,
    keyword,
    keyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
    likeKeyword,
  ];

  try {
    const products = await executeQuery(sql, params);

    return res.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (err) {
    console.error("Search SQL Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to search products.",
      error: err.message,
    });
  }
};

// --------------------------------------------------
// Footer data
// --------------------------------------------------
exports.getAllDataOfFooter = async (req, res) => {
  const categorySql = ` SELECT cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.SmallDescription FROM mst_treatmentdata td INNER JOIN mst_categorydata cd ON td.CategoryID = cd.CategoryID WHERE td.ActiveStatus = 1 AND cd.ActiveStatus = 1 GROUP BY cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.SmallDescription, cd.DisplayOrder ORDER BY cd.DisplayOrder ASC `;

  try {
    const results = await executeQuery(categorySql);

    return res.json({ data: results });
  } catch (err) {
    console.error("Footer SQL Error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch footer data.",
      error: err.message,
    });
  }
};

// --------------------------------------------------
// Treatment and product data
// --------------------------------------------------
exports.getAllDataOfProductListing = async (req, res) => {
  const CustomerID = getCustomerID(req);
  console.log("Homepage CustomerID:", CustomerID);

  // Listing Page products
  const sqlProduct = `SELECT pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, pcd.ProductSalePrice, pcd.ProductMRP, cod.ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} GROUP BY pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, pcd.ProductSalePrice, pcd.ProductMRP, cod.ColorName, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC `;
  // Listing Page category
  const sqlCategory = ` SELECT cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage FROM ${sqlView} GROUP BY cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.DisplayOrder ORDER BY cd.DisplayOrder ASC `;
  // Listing Page color
  const sqlColor = ` SELECT pcd.ColorID, cod.ColorName FROM ${sqlView} GROUP BY pcd.ColorID, cod.ColorName ORDER BY cod.ColorName ASC `;
  try {
    const [
      products,
      categories,
      color,
    ] = await Promise.all([
      executeQuery(sqlProduct, [CustomerID]),
      executeQuery(sqlCategory, [CustomerID]),
      executeQuery(sqlColor, [CustomerID]),
    ]);

    return res.json({
      success: true,
      products,
      categories,
      color,
    });
  } catch (err) {
    console.error("Homepage SQL Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// --------------------------------------------------
// Homepage data
// --------------------------------------------------
exports.getHomePageData = async (req, res) => {
  const CustomerID = getCustomerID(req);
  console.log("Homepage CustomerID:", CustomerID);

  // Homepage products
  const sqlProduct = ` SELECT pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, MIN(pcd.ProductSalePrice) AS ProductSalePrice, GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} GROUP BY pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC `;
  // Homepage categories
  const sqlCategory = ` SELECT cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage FROM ${sqlView} GROUP BY cd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.DisplayOrder ORDER BY cd.DisplayOrder ASC `;
  const sqlOnlyHomeProduct = ` SELECT pd.ProductID, pd.ProductName, pd.ProductNameURL, pd.ProductTagline,  pd.ProductBannerImage3 as ProductImage, MIN(pcd.ProductSalePrice) AS ProductSalePrice, GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} and pd.DisplayOnHome = 1 GROUP BY pd.ProductID, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductBannerImage3, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC LIMIT 10 `;
  // Exclusive products
  const sqlOnlyProduct = ` SELECT pd.ProductID, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, MIN(pcd.ProductSalePrice) AS ProductSalePrice, GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} and pd.DisplayOnExclusive=1 GROUP BY pd.ProductID, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC `;
  // Occasion products
  const sqlOccasions = ` SELECT pd.ProductID, pod.OccasionID, od.OccasionName, od.OccasionURL, od.OccasionImage, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, MIN(pcd.ProductSalePrice) AS ProductSalePrice, GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlOccasionsView} GROUP BY pd.ProductID, pod.OccasionID, od.OccasionName, od.OccasionURL, od.OccasionImage, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC `;
  const sqlMedia = ` SELECT MediaName, MediaImage FROM mst_mediadata WHERE ActiveStatus = 1 ORDER BY DisplayOrder DESC LIMIT 10 `;
  try {
    const [
      products,
      categories,
      homeProducts,
      onlyProducts,
      occasions,
      media,
    ] = await Promise.all([
      executeQuery(sqlProduct, [CustomerID]),
      executeQuery(sqlCategory, [CustomerID]),
      executeQuery(sqlOnlyHomeProduct, [CustomerID]),
      executeQuery(sqlOnlyProduct, [CustomerID]),
      executeQuery(sqlOccasions, [CustomerID]),
      executeQuery(sqlMedia),
    ]);

    return res.json({
      success: true,
      products,
      categories,
      homeProducts,
      onlyProducts,
      occasions,
      media,
    });
  } catch (err) {
    console.error("Homepage SQL Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getAllDataOfProductDetails = async (req, res) => {
  const CustomerID = Number(getCustomerID(req)) || 0;

  // ProductID can come from query (?ProductID=1), route (/:ProductID) or body
  const ProductID = Number(
    req.query?.ProductID ?? req.params?.ProductID ?? req.body?.ProductID
  );

  if (!ProductID) {
    return res.status(400).json({
      success: false,
      error: "ProductID is required",
    });
  }

  // Product details (one row, colors come from sqlColor)
  const sqlProductDetails = `SELECT pd.*, cd.CategoryName, cd.CategoryNameURL, cd.CategoryImage, cd.CategoryBannerImage, cd.CategoryVideo, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} and pd.ProductID=? ORDER BY pd.DisplayOrder ASC LIMIT 1 `;

  // Related products (every product except the current one)
  const sqlReatedProduct = `SELECT pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, MIN(pcd.ProductSalePrice) AS ProductSalePrice, MIN(pcd.ProductMRP) AS ProductMRP, GROUP_CONCAT(DISTINCT cod.ColorName) AS ColorName, ${wishlistColumn}, ${CustomerID} as ItemID FROM ${sqlView} and pd.ProductID<>? GROUP BY pd.ProductID, pd.CategoryID, cd.CategoryName, cd.CategoryNameURL, cd.CategoryVideo, pd.ProductName, pd.ProductNameURL, pd.ProductTagline, pd.ProductImage, pd.ProductBannerImage4, pd.DisplayOrder ORDER BY pd.DisplayOrder ASC LIMIT 10 `;

  // Color-wise price / stock of this product
  const sqlColor = ` SELECT * FROM ${sqlView} and pd.ProductID=? ORDER BY cod.ColorName ASC `;

  try {
    const [productRows, relatedProducts, colors] = await Promise.all([
      executeQuery(sqlProductDetails, [CustomerID, ProductID]),
      executeQuery(sqlReatedProduct, [CustomerID, ProductID]),
      executeQuery(sqlColor, [CustomerID, ProductID]),
    ]);

    if (!productRows || productRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    return res.json({
      success: true,
      product: productRows[0],
      relatedProducts,
      colors,
    });
  } catch (err) {
    console.error("Product Details SQL Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
