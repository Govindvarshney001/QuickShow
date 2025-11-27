import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, dummyDateTimeData, dummyShowsData } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import isoTimeFormat from "../lib/isoTimeFormat";

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const navigate = useNavigate();

  // 🧠 Dummy getShow (no axios) — now merges admin shows from localStorage
  const getShow = async () => {
    try {
      const persisted = JSON.parse(localStorage.getItem("adminShows") || "[]");
      const all = [...persisted, ...dummyShowsData];
      const showData =
        all.find((item) => item._id === id || item.id?.toString() === id) ||
        all[0];

      if (showData) {
        // generate dateTime for today + next 3 days (same format MovieDetails uses)
        const generateDateTime = (showId) => {
          const dateObj = {};
          const now = new Date();
          for (let i = 0; i < 4; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const times = [10, 14, 18].map((hour) => {
              const t = new Date(d);
              t.setHours(hour, 0, 0, 0);
              return {
                time: t.toISOString(),
                showId: `${showId}-${i}-${hour}`,
              };
            });
            dateObj[key] = times;
          }
          return dateObj;
        };

        setShow({
          movie: showData,
          dateTime: generateDateTime(showData._id || showData.id),
        });
      }
    } catch (error) {
      console.error("Error loading show:", error);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select a time first");
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can only select 5 seats");
    }

    if (occupiedSeats.includes(seatId)) {
      return toast.error("This seat is already booked");
    }

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  // 🪑 Render seat buttons
  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`;
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer transition
              ${
                selectedSeats.includes(seatId)
                  ? "bg-primary text-white"
                  : "hover:bg-primary/20"
              } 
              ${
                occupiedSeats.includes(seatId)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
          >
            {seatId}
          </button>
        );
      })}
    </div>
  );

  // 🧠 Dummy function instead of axios backend
  const getOccupiedSeats = () => {
    // randomly mark 5-10 seats as occupied for demo
    const seats = [];
    const rows = ["A", "B", "C", "D", "E", "F", "G"];
    rows.forEach((r) => {
      for (let i = 1; i <= 9; i++) {
        if (Math.random() < 0.1) seats.push(`${r}${i}`);
      }
    });
    setOccupiedSeats(seats);
  };

  const proceedToCheckout = () => {
    if (!selectedTime || !selectedSeats.length)
      return toast.error("Please select time and seats");

    // Build a booking object that matches dummyBookingData shape
    const showPrice = 59; // demo default per-seat price
    const amount = showPrice * selectedSeats.length;

    // Build a minimal movie object to avoid storing large base64 images
    // IMPORTANT: do NOT include poster/backdrop binary data here to avoid
    // localStorage quota issues when admin-added movies have base64 images.
    const minimalMovie = {
      _id: show.movie._id,
      title: show.movie.title,
      runtime: show.movie.runtime,
      vote_average: show.movie.vote_average,
    };

    const booking = {
      _id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      user: { name: "Guest" },
      show: {
        _id: selectedTime.showId || `${id}-${date}-${selectedTime.time}`,
        movie: minimalMovie,
        showDateTime: selectedTime.time,
        showPrice,
      },
      amount,
      bookedSeats: selectedSeats,
      isPaid: false,
    };

    // Try to create an order on the backend and launch Razorpay checkout.
    (async () => {
      const payload = {
        movieId: show.movie._id,
        movieTitle: show.movie.title,
        seats: selectedSeats,
        amount,
        showDateTime: selectedTime.time,
        showId: selectedTime.showId || `${id}-${date}-${selectedTime.time}`,
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

        // Load Razorpay script
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
        if (!ok) {
          toast.error("Could not load Razorpay SDK");
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // set VITE_RAZORPAY_KEY_ID in client/.env
          amount: order.amount, // amount in paise from server
          currency: order.currency || "INR",
          name: show.movie.title,
          description: `Booking for ${selectedSeats.length} seat(s)`,
          order_id: order.id,
          handler: async function (response) {
            try {
              // Verify payment on backend
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

              toast.success("Payment verified and booking confirmed");
              // Redirect to my-bookings. Server has persisted booking now.
              navigate("/my-bookings");
            } catch (err) {
              console.error("Payment verification failed", err);
              toast.error("Payment verification failed. Contact support.");
            }
          },
          theme: { color: "#F43F5E" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          console.error("Payment failed", response.error);
          toast.error("Payment failed or was cancelled");
        });
        rzp.open();
      } catch (err) {
        console.warn(
          "Server order creation failed, falling back to local save",
          err
        );

        // If server integration isn't available, fall back to local persistence (existing behavior)
        try {
          let existing = [];
          const raw = localStorage.getItem("bookings");
          if (raw) {
            try {
              existing = JSON.parse(raw) || [];
            } catch (e) {
              console.warn("Corrupt bookings in localStorage, resetting.", e);
              existing = [];
            }
          }
          existing.unshift(booking);
          localStorage.setItem("bookings", JSON.stringify(existing));
          toast.success(`Saved booking for ${selectedSeats.length} seat(s)`);
          navigate("/my-bookings");
        } catch (err2) {
          console.error("Fallback save failed", err2);
          toast.error("Could not save booking locally");
        }
      }
    })();
  };

  useEffect(() => {
    getShow();
  }, []);

  useEffect(() => {
    if (selectedTime) getOccupiedSeats();
  }, [selectedTime]);

  if (!show) return <Loading />;

  const availableTimes = show.dateTime?.[date] || [];

  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      {/* Sidebar: Available Timings */}
      <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {availableTimes.length > 0 ? (
            availableTimes.map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                  selectedTime?.time === item.time
                    ? "bg-primary text-white"
                    : "hover:bg-primary/20"
                }`}
              >
                <ClockIcon className="w-4 h-4 text-primary" />
                <p
                  className={`text-sm ${
                    selectedTime?.time === item.time
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {isoTimeFormat(item.time)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-6">No timings found</p>
          )}
        </div>
      </div>

      {/* Main: Seat Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />

        <h1 className="text-2xl font-semibold mb-4">
          Select your seat ({show.movie.title})
        </h1>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>

        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
            {groupRows[0].map((row) => renderSeats(row))}
          </div>

          <div className="grid grid-cols-2 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>{group.map((row) => renderSeats(row))}</div>
            ))}
          </div>
        </div>

        <button
          onClick={proceedToCheckout}
          className="flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95"
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;
