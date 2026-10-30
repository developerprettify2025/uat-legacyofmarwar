const db = require("../db");

exports.getAdminDashboard = async (req, res) => {
  try {
    const queries = {
      TotalBlog: "SELECT COUNT(*) as count FROM mst_blogdata",
      TotalCategory: "SELECT COUNT(*) as count FROM mst_categorydata",
      TotalTreatment: "SELECT COUNT(*) as count FROM mst_treatmentdata",
      TotalTestimonial: "SELECT COUNT(*) as count FROM mst_testimonialdata",
      TotalOurTeam: "SELECT COUNT(*) as count FROM mst_our_team",
      TotalTeamType: "SELECT COUNT(*) as count FROM mst_teamtypedata",
      TotalStaticPage: "SELECT COUNT(*) as count FROM mst_staticdata",
      TotalEnquiry: "SELECT COUNT(*) as count FROM mst_contact_us",
      TotalUser: "SELECT COUNT(*) as count FROM mst_userdata",
    };

    const results = {};

    const executeQuery = (key, sql) => {
      return new Promise((resolve) => {
        db.query(sql, (err, rows) => {
          if (err) {
            console.error(`Error querying ${key}:`, err.message);
            resolve(0);
          } else {
            resolve(rows[0]?.count || 0);
          }
        });
      });
    };

    const promises = Object.keys(queries).map(async (key) => {
      results[key] = await executeQuery(key, queries[key]);
    });

    await Promise.all(promises);

    // recent interactions (last 10 enquiries)
    const recentEnquiriesSql = `
      SELECT *, DATE_FORMAT(PostedDate, '%d %b %Y, %h:%i %p') AS FormattedDate 
      FROM mst_contact_us 
      ORDER BY ContactID DESC 
      LIMIT 5 
    `;
    const recentEnquiries = await new Promise((resolve) => {
      db.query(recentEnquiriesSql, (err, rows) => {
        if (err) resolve([]);
        else resolve(rows);
      });
    });

    res.json({
      success: true,
      predictionCounts: results,
      recentEnquiries: recentEnquiries,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMonthWiseReport = (req, res) => {
  const sql = `
    SELECT MONTH(PostedDate) as month, COUNT(*) as count 
    FROM mst_contact_us  
    WHERE YEAR(PostedDate) = YEAR(CURDATE()) 
    GROUP BY MONTH(PostedDate) 
  `;
  db.query(sql, (err, results) => {
    const currentYearArray = Array(12).fill(0);
    if (!err && results) {
      results.forEach((row) => {
        if (row.month >= 1 && row.month <= 12) {
          currentYearArray[row.month - 1] = row.count;
        }
      });
    }
    res.json({ success: true, currentYearArray });
  });
};
