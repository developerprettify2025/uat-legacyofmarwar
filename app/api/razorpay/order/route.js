import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function POST(req) {
  try {
    const { amount, currency = "INR", receipt } = await req.json();
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, message: "Razorpay keys are missing" },
        { status: 500, headers: noStore }
      );
    }
    const amountInPaise = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      return NextResponse.json(
        { success: false, message: "Invalid amount (minimum ₹1)" },
        { status: 400, headers: noStore }
      );
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

    return NextResponse.json({ success: true, order }, { headers: noStore });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const message =
      error?.error?.description || error?.message || "Failed to create order";
    const status =
      Number.isInteger(error?.statusCode) && error.statusCode >= 400
        ? error.statusCode
        : 500;

    return NextResponse.json(
      { success: false, message },
      { status, headers: noStore }
    );
  }
}