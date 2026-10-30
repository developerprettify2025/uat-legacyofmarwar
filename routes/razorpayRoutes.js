require("dotenv").config();
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay").default ?? require("razorpay");

// POST /api/razorpay/order
router.post("/order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ success: false, message: "Razorpay keys are missing" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount (minimum ₹1)" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
    });

    return res
      .status(200)
      .json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const message =
      error?.error?.description || error?.message || "Failed to create order";
    const status =
      Number.isInteger(error?.statusCode) && error.statusCode >= 400
        ? error.statusCode
        : 500;
    return res.status(status).json({ success: false, message });
  }
});

// POST /api/razorpay/verify
router.post("/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ success: false, message: "Razorpay secret is missing." });
    }

    if (
      !razorpay_payment_id ||
      !razorpay_signature ||
      (!razorpay_order_id && !razorpay_subscription_id)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Razorpay signature fields." });
    }

    const body = razorpay_subscription_id
      ? `${razorpay_payment_id}|${razorpay_subscription_id}`
      : `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    const isValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
});

module.exports = router;

