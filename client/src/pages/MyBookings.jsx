import React, { useEffect, useState } from "react";
import { dummyBookingData } from "../assets/assets";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormat";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Dummy Bookings
  useEffect(() => {
    setTimeout(() => {
      setBookings(dummyBookingData);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Cancel Booking Handler
  const handleCancelBooking = (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (!confirmCancel) return;

    toast.loading("Cancelling booking...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Booking cancelled successfully!");
      setBookings((prev) =>
        prev.filter((booking) => booking._id !== bookingId)
      );
    }, 800);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-24 md:pt-40 min-h-[80vh]">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0px" left="600px" />

      <h1 className="text-lg font-semibold mb-4">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-gray-400 mt-10">You have no bookings yet.</p>
      ) : (
        bookings.map((item) => (
          <div
            key={item._id}
            className="flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl"
          >
            <div className="flex flex-col md:flex-row">
              <img
                src={
                  item.show?.movie?.poster_path ||
                  "https://via.placeholder.com/150"
                }
                alt={item.show?.movie?.title || "Movie Poster"}
                className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold">
                  {item.show?.movie?.title || "-"}
                </p>
                <p className="text-gray-400 text-sm">
                  {timeFormat(item.show?.movie?.runtime) || "-"}
                </p>
                <p className="text-gray-400 text-sm mt-auto">
                  {dateFormat(item.show?.showDateTime) || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end md:text-right justify-between p-4">
              <div className="flex items-center gap-4 mb-2">
                <p className="text-2xl font-semibold">
                  {currency}
                  {item.amount?.toLocaleString() || 0}
                </p>

                {!item.isPaid ? (
                  <Link
                    to={item.paymentLink || "#"}
                    className="bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer"
                  >
                    Pay Now
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCancelBooking(item._id)}
                    className="bg-red-500/80 hover:bg-red-500 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer transition active:scale-95"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="text-sm">
                <p>
                  <span className="text-gray-400">Total Tickets:</span>{" "}
                  {item.bookedSeats?.length || 0}
                </p>
                <p>
                  <span className="text-gray-400">Seat Number:</span>{" "}
                  {item.bookedSeats?.join(", ") || "-"}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyBookings;
