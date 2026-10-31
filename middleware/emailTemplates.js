const nodemailer = require("nodemailer");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmail(subject, greeting, mainContent) {
  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f2ea;font-family:Verdana,Geneva,Tahoma,sans-serif;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0"
        style="max-width:700px;margin:0 auto;background-color:#ffffff;">
        <tr>
            <td style="background-color:#faf1e2;padding:16px 24px;border-bottom:3px solid #9a7b3c;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="width:50%;vertical-align:middle;">
                            <a href="https://www.legacyofmarwar.com" target="_blank">
                                <img src="https://www.legacyofmarwar.com/images/logo-dark.png" alt="Legacy of Marwar"
                                    height="60" style="display:block;height:60px;border:0;">
                            </a>
                        </td>
                        <td
                            style="width:50%;vertical-align:middle;text-align:right;font-size:12px;line-height:20px;color:#2b2118;">
                            <div>
                                Email: <a href="mailto:legacyofmarwar@gmail.com"
                                    style="color:#2b2118;text-decoration:none;">legacyofmarwar@gmail.com</a>
                            </div>
                            <div>
                                Phone: <a href="tel:+919811887651"
                                    style="color:#2b2118;text-decoration:none;">+91-9811887651</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding:40px 32px 40px;font-size:14px;color:#5a5149;">
                <p style="margin:0 0 16px;color:#2b2118;font-weight:600;font-size:16px;">${greeting}</p>
                ${mainContent}
            </td>
        </tr>
        <tr>
            <td style="background-color:#6b4226;padding:28px 32px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="width:45%;vertical-align:top;padding-right:12px;">
                            <p style="margin:0;color:#ffffff;font-weight:700;font-size:14px;">Legacy of Marwar Team</p>
                            <p style="margin:6px 0 0;color:#e2c98f;font-size:12px;letter-spacing:1px;">PURE &bull; TIMELESS</p>
                        </td>
                        <td
                            style="width:55%;vertical-align:top;text-align:right;font-size:13px;line-height:20px;color:#f3e6d3;">
                            <p style="margin:0 0 6px;color:#ffffff;font-weight:700;font-size:14px;">Registered Head Office</p>
                            <p style="margin:0;color:#f3e6d3;">
                                ANAAYAH CREATIVES &amp; DESIGNS<br>
                                Flat No 258, 3rd Floor, C A Apartments,<br>
                                Paschim Vihar, New Delhi 110063
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="background-color:#6b4226;padding:20px 32px 24px;">
                <p style="margin:0;border-top:1px solid #8a6342;padding-top:14px;font-size:12px;color:#d9c5a8;">
                    &copy; ${new Date().getFullYear()} Legacy of Marwar. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`,
  };
}

function detailTable(rows) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:16px 0 0;">
      ${rows
      .map(
        ([label, value]) => `
        <tr>
          <td style="padding:8px;border:1px solid #e4d5b8;background-color:#faf1e2;font-weight:600;width:35%;color:#2b2118;">${escapeHtml(label)}</td>
          <td style="padding:8px;border:1px solid #e4d5b8;color:#5a5149;">${value}</td>
        </tr>`,
      )
      .join("")}
    </table>
  `;
}

function generateEmailTemplate(emailType, data) {
  if (emailType === "otp") {
    return wrapEmail(
      "Your login verification code - Legacy of Marwar",
      `Hi ${escapeHtml(data.CustomerName || "there")},`,
      `
        <p style="margin:0 0 20px;line-height:22px;">Use the verification code below to continue logging in or signing up:</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="background-color:#faf1e2;border:1px solid #9a7b3c;border-radius:8px;padding:18px;">
              <span style="font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:700;letter-spacing:10px;color:#6b4226;">${escapeHtml(data.otp)}</span>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;line-height:22px;">This code is valid for <b>5 minutes</b>. Please do not share it with anyone. If you did not request this, you can safely ignore this email.</p>
      `,
    );
  }

  if (emailType === "user_welcome") {
    return wrapEmail(
      "Welcome to Legacy of Marwar",
      `Hi ${escapeHtml(data.CustomerName || "there")},`,
      `
        <p style="margin:0 0 16px;line-height:22px;">
          Welcome to <strong style="color:#6b4226;">Legacy of Marwar</strong>! Your account has been created successfully.
        </p>
        <p style="margin:0 0 20px;line-height:22px;">
          Explore handcrafted 925 silver jewellery inspired by the rich heritage of Marwar, delivered across India.
        </p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr>
            <td align="center" style="background-color:#6b4226;border-radius:6px;">
              <a href="https://www.legacyofmarwar.com" target="_blank"
                style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                Start Shopping
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;line-height:22px;">
          If you need any help, reply to this email or contact us at
          <a href="mailto:legacyofmarwar@gmail.com" style="color:#6b4226;">legacyofmarwar@gmail.com</a>.
        </p>
      `,
    );
  }

  if (emailType === "admin_new_user") {
    return wrapEmail(
      "New user registered - Legacy of Marwar",
      "Hi Team,",
      `
        <p style="margin:0;line-height:22px;">
          A new user has just registered on <strong>Legacy of Marwar</strong>.
        </p>
        ${detailTable([
        ["Name", escapeHtml(data.CustomerName)],
        ["Email", escapeHtml(data.CustomerEmailID)],
        ["Phone", escapeHtml(data.CustomerPhoneNo)],
        ["Registered On", escapeHtml(
          data.RegisteredDate ||
          new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        )],
      ])}
      `,
    );
  }

  if (emailType === "user_enquiry") {
    return wrapEmail(
      "Thank you for your enquiry - Legacy of Marwar",
      `Hi ${escapeHtml(data.FullName || "there")},`,
      `
        <p style="margin:0 0 16px;line-height:22px;">Thank you for contacting <strong>Legacy of Marwar</strong>. We have received your enquiry and our team will get back to you shortly.</p>
        ${detailTable([
        ["Name", escapeHtml(data.FullName)],
        ["Email", escapeHtml(data.EmailID)],
        ["Phone", escapeHtml(data.PhoneNo)],
        ["Message", escapeHtml(data.Message)],
      ])}
      `,
    );
  }

  if (emailType === "admin_enquiry") {
    return wrapEmail(
      "New enquiry received - Legacy of Marwar",
      "Hi Team,",
      ` 
        <p style="margin:0;line-height:22px;"><strong>${escapeHtml(data.FullName)}</strong> submitted a new enquiry.</p>
        ${detailTable([
        ["Name", escapeHtml(data.FullName)],
        ["Email", escapeHtml(data.EmailID)],
        ["Phone", escapeHtml(data.PhoneNo)],
        ["Enquiry Type", escapeHtml(data.EnquiryType)],
        ["Enquiry For", escapeHtml(data.EnquiryFor)],
        ["Page", escapeHtml(data.PageName)],
        ["Message", escapeHtml(data.Message)],
        ["Received", escapeHtml(data.PostedDate)],
      ])}
      `,
    );
  }

  if (emailType === "order_confirmation") {
    const itemRows = (data.items || [])
      .map(
        (item) => `
          <tr>
            <td style="padding:8px;border:1px solid #e4d5b8;color:#5a5149;">${escapeHtml(item.ProductName)}${item.ColorName ? ` (${escapeHtml(item.ColorName)})` : ""}</td>
            <td style="padding:8px;border:1px solid #e4d5b8;text-align:center;color:#5a5149;">${escapeHtml(item.ProductQuantity)}</td>
            <td style="padding:8px;border:1px solid #e4d5b8;text-align:right;color:#5a5149;">₹ ${Number(item.ProductTotalAmount || 0).toLocaleString("en-IN")}</td>
          </tr>`,
      ).join("");

    return wrapEmail(
      `Order confirmed #${data.OrderNo} - Legacy of Marwar`,
      `Hi ${escapeHtml(data.CustomerName || "there")},`,
      `
        <p style="margin:0 0 16px;line-height:22px;">Thank you for shopping with <strong>Legacy of Marwar</strong>. Your payment was successful and we have received your order.</p>
        <p style="margin:0 0 16px;line-height:22px;"><strong>Order number:</strong> ${escapeHtml(data.OrderNo)}<br /><strong>Amount paid:</strong> ₹ ${Number(data.OrderTotalAmount || 0).toLocaleString("en-IN")}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:8px 0 16px;">
          <tr>
            <td style="padding:8px;border:1px solid #e4d5b8;background-color:#faf1e2;font-weight:600;color:#2b2118;">Item</td>
            <td style="padding:8px;border:1px solid #e4d5b8;background-color:#faf1e2;font-weight:600;text-align:center;color:#2b2118;">Qty</td>
            <td style="padding:8px;border:1px solid #e4d5b8;background-color:#faf1e2;font-weight:600;text-align:right;color:#2b2118;">Amount</td>
          </tr>
          ${itemRows}
        </table>
        <p style="margin:0;line-height:22px;">We will update you as your order is processed and shipped.</p>
      `,
    );
  }

  return wrapEmail("Legacy of Marwar", "Hi,", "<p style=\"margin:0;line-height:22px;\">No content</p>");
}

async function sendEmail(emailType, recipientEmail, data) {
  if (!recipientEmail) {
    return { success: false, error: "Missing recipient email" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
    const emailContent = generateEmailTemplate(emailType, data);
    await transporter.sendMail({
      from: `"Legacy of Marwar" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });
    return { success: true };
  } catch (error) {
    console.error("Send email error:", error);
    return { success: false, error };
  }
}

module.exports = { sendEmail };
