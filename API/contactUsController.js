const db = require('../db');
const { sendEmail } = require('../middleware/emailTemplates');
const LEAD_STATUSES = ["New", "Open", "Closed", "Fake"];

exports.getAllLeads = (req, res) => {
  const sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ContactID DESC) AS SerialNo,
      ContactID, VendorID, FullName, EmailID, PhoneNo,
      CompanyName, Message, LeadReply, EnquiryType, EnquiryFor,
      CountryName, PageName,
      CASE WHEN LeadStatus = 'Close' THEN 'Closed' ELSE LeadStatus END AS LeadStatus,
      DATE_FORMAT(PostedDate, '%d %b %Y') AS PostedDate, IsRead
    FROM mst_contact_us 
    ORDER BY ContactID DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(results);
  });
};

exports.saveNewEnquiry = (req, res) => {
  const {
    VendorID = 0,
    FullName,
    EmailID,
    PhoneNo,
    CompanyName = null,
    Message,
    EnquiryType,
    EnquiryFor,
    CountryName = null,
    PageName = "/thank-you",
    LeadStatus = "New",
  } = req.body;

  const currentTime = new Date();
  const IsRead = 0;

  const insertSql = `
    INSERT INTO mst_contact_us (
      VendorID, FullName, EmailID, PhoneNo, CompanyName, Message, 
      EnquiryType, EnquiryFor, CountryName,
      PageName, PostedDate, IsRead, LeadStatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    VendorID, FullName, EmailID, PhoneNo, CompanyName, Message,
    EnquiryType, EnquiryFor, CountryName,
    PageName, currentTime, IsRead, LeadStatus
  ];

  db.query(insertSql, values, async (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to save enquiry",
        error: err.message
      });
    }

    const postedDate = currentTime.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const userEmailData = {
      FullName,
      EmailID,
      PhoneNo,
      Message,
      CountryName,
      PageName,
    };
    const adminEmailData = {
      FullName,
      EmailID,
      PhoneNo,
      Message,
      EnquiryType,
      EnquiryFor,
      CountryName,
      PageName,
      PostedDate: postedDate,
    };
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    try {
      await Promise.all([
        EmailID ? sendEmail("user_enquiry", EmailID, userEmailData) : Promise.resolve(),
        adminEmail ? sendEmail("admin_enquiry", adminEmail, adminEmailData) : Promise.resolve(),
      ]);
    } catch (mailErr) {
      console.error("Enquiry email notification failed:", mailErr);
    }

    res.json({
      success: true,
      message: "Enquiry submitted successfully!",
      contactId: result.insertId
    });
  });
};

exports.updateLeadStatus = (req, res) => {
  const ContactID = Number(req.params.ContactID);
  const LeadStatus = typeof req.body.LeadStatus === "string"
    ? req.body.LeadStatus.trim()
    : "";
  const Remark = typeof req.body.Remark === "string" ? req.body.Remark.trim() : "";

  if (!Number.isInteger(ContactID) || ContactID < 1) {
    return res.status(400).json({ success: false, message: "Invalid enquiry ID." });
  }
  if (!LEAD_STATUSES.includes(LeadStatus)) {
    return res.status(400).json({
      success: false,
      message: `Lead status must be one of: ${LEAD_STATUSES.join(", ")}.`,
    });
  }
  if (!Remark || Remark.length > 5000) {
    return res.status(400).json({
      success: false,
      message: "A remark of up to 5000 characters is required.",
    });
  }

  db.query(
    `UPDATE mst_contact_us
     SET LeadStatus = ?,
         LeadReply = CASE
           WHEN COALESCE(LeadReply, '') = '' THEN ?
           ELSE CONCAT(LeadReply, '<br/>', ?)
         END
     WHERE ContactID = ?`,
    [LeadStatus, Remark, Remark, ContactID],
    (err, result) => {
      if (err) {
        console.error("Update lead status error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update lead status.",
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Enquiry not found." });
      }
      return res.json({
        success: true,
        message: "Lead status updated successfully.",
        ContactID,
        LeadStatus,
      });
    },
  );
};

exports.deleteEnquiry = (req, res) => {
  const ContactID = req.params.ContactID;
  const sql = 'DELETE FROM mst_contact_us WHERE ContactID = ?';
  db.query(sql, [ContactID], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  });
};
