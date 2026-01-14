import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dummyBookingData } from "../assets/assets";
import Loading from "../components/Loading";
import toast from "react-hot-toast";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // find booking in localStorage/sessionStorage or fallback to dummy
    try {
      const persistedLocal = JSON.parse(
        localStorage.getItem("bookings") || "[]"
      );
      const persistedSession = JSON.parse(
        sessionStorage.getItem("bookings") || "[]"
      );
      const all = [...persistedLocal, ...persistedSession, ...dummyBookingData];
      const found = all.find((b) => b._id === bookingId);
      setBooking(found || null);
    } catch (err) {
      console.error("Failed to load booking for payment", err);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const handlePay = async () => {
    if (!booking) return;

    const payload = {
      movieId: booking.show?.movie?._id || booking.movieId || null,
      movieTitle: booking.show?.movie?.title || booking.movieTitle || "",
      seats: booking.bookedSeats || booking.seats || [],
      amount: booking.amount || 0,
      showDateTime: booking.show?.showDateTime || booking.showDateTime || "",
      showId: booking.show?._id || booking.showId || null,
    };

    try {
      const resp = await fetch(
        "http://localhost:3000/api/payment/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) throw new Error("Failed to create order on server");
      const data = await resp.json();
      const { order, provisionalId } = data;

      const loadScript = (src) =>
        new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const ok = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );
      if (!ok) return toast.error("Could not load payment gateway");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: order.amount,
        currency: order.currency || "INR",
        name: payload.movieTitle || "Movie Booking",
        description: `Booking for ${payload.seats.length} seat(s)`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResp = await fetch(
              "http://localhost:3000/api/payment/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  provisionalId,
                }),
              }
            );
            const verifyData = await verifyResp.json();
            if (!verifyResp.ok)
              throw new Error(verifyData.message || "Verification failed");

            toast.success("Payment verified — booking confirmed");

            // Update local persisted booking to mark paid if present
            try {
              const raw = localStorage.getItem("bookings") || "[]";
              const arr = JSON.parse(raw);
              const idx = arr.findIndex((b) => b._id === bookingId);
              if (idx !== -1) {
                arr[idx].isPaid = true;
                arr[idx].payment = verifyData.booking?.payment || {
                  paymentId: response.razorpay_payment_id,
                };
                localStorage.setItem("bookings", JSON.stringify(arr));
              }
            } catch (err) {
              console.warn(
                "Could not update local bookings after payment",
                err
              );
            }

            navigate("/my-bookings");
          } catch (err) {
            console.error("Verification failed", err);
            toast.error("Payment verification failed");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        console.error("Payment failed", resp.error);
        toast.error("Payment failed or cancelled");
      });
      rzp.open();
    } catch (err) {
      console.error("Payment start failed", err);
      toast.error("Could not start payment");
    }
  };

  if (loading) return <Loading />;
  if (!booking)
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Booking not found</h2>
        <p className="text-gray-400">
          The booking you are trying to pay for was not found.
        </p>
      </div>
    );

  return (
    <div className="p-15 mt-10">
      <h1 className="text-xl font-semibold mb-4">Complete Payment</h1>
      <div className="bg-primary/8 border border-primary/20 rounded-lg p-4 max-w-2xl">
        <p className="text-lg font-medium">
          {booking.show?.movie?.title || booking.movieTitle}
        </p>
        <p className="text-sm text-gray-400">
          Seats: {booking.bookedSeats?.join(", ") || booking.seats?.join(", ")}
        </p>
        <p className="text-sm text-gray-400">Amount: {booking.amount}</p>
        <div className="mt-4">
          <button
            onClick={handlePay}
            className="bg-primary px-4 py-2 rounded text-white"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
