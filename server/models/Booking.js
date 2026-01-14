import mongoose from "mongoose";

const paymentSubSchema = new mongoose.Schema({
  orderId: { type: String },
  paymentId: { type: String },
  signature: { type: String },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },
  amount: { type: Number },
});

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false },
    movieId: { type: String, required: true },
    movieTitle: { type: String },
    seats: [{ type: String }],
    amount: { type: Number, required: true },
    showDateTime: { type: String },
    showId: { type: String },
    isPaid: { type: Boolean, default: false },
    payment: paymentSubSchema,
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
