import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";

const router = express.Router();

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.warn(
    "Razorpay keys not set. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env"
  );
}

const instance = new Razorpay({
  key_id: key_id || "",
  key_secret: key_secret || "",
});

// Create Order
router.post("/create-order", async (req, res) => {
  try {
    const { movieId, movieTitle, seats, amount, showDateTime, showId, userId } =
      req.body;

    // Basic server-side validation: ensure required fields are present
    if (!movieId || !seats || !amount) {
      return res
        .status(400)
        .json({ message: "Missing required booking fields" });
    }

    // TODO: More robust amount validation can be added here by fetching the
    // show/movie price from a trusted server-side source (DB) instead of trusting client.

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: { movieId, seats: JSON.stringify(seats) },
    };

    const order = await instance.orders.create(options);

    // Persist a provisional booking/payment record with status created
    const provisional = new Booking({
      userId: userId || null,
      movieId,
      movieTitle,
      seats,
      amount,
      showDateTime,
      showId,
      isPaid: false,
      payment: { orderId: order.id, status: "created", amount },
    });

    await provisional.save();

    res.json({ success: true, order, provisionalId: provisional._id });
  } catch (err) {
    console.error("create-order error", err);
    res
      .status(500)
      .json({ message: "Could not create order", error: err.message });
  }
});

// Verify payment after Razorpay checkout
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      provisionalId,
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !provisionalId
    ) {
      return res
        .status(400)
        .json({ message: "Missing payment verification fields" });
    }

    // Recreate signature on server
    const generated_signature = crypto
      .createHmac("sha256", key_secret || "")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // Signature mismatch — possible tampering
      // Update provisional record to failed
      await Booking.findByIdAndUpdate(provisionalId, {
        payment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: "failed",
        },
      });
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Mark booking as paid and attach payment details
    const booking = await Booking.findById(provisionalId);
    if (!booking)
      return res.status(404).json({ message: "Provisional booking not found" });

    booking.isPaid = true;
    booking.payment = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      status: "paid",
      amount: booking.amount,
    };

    await booking.save();

    // TODO: Mark seats as filled in a Show collection if you maintain availability in DB.

    res.json({ success: true, booking });
  } catch (err) {
    console.error("verify-payment error", err);
    res
      .status(500)
      .json({ message: "Could not verify payment", error: err.message });
  }
});

export default router;
