import React, { useEffect, useState } from "react";
import { dummyBookingData, dummyShowsData } from "../assets/assets";
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

  // Load bookings from localStorage first, then merge with dummy data.
  // Ensure the default/dummy bookings are always present (no duplicates),
  // so a server restart or app reload still shows the default movie plus any
  // previously added bookings saved to localStorage.
  useEffect(() => {
    setTimeout(() => {
      try {
        const persistedLocal = JSON.parse(
          localStorage.getItem("bookings") || "[]"
        );
        const persistedSession = JSON.parse(
          sessionStorage.getItem("bookings") || "[]"
        );
        // prefer local then session (session may contain fallbacks)
        const persisted = [...persistedLocal, ...persistedSession];

        // Build a map to dedupe bookings. Use a composite key because some
        // dummy entries may share ids in the sample data.
        const keyFor = (b) => {
          const showId = b?.show?._id || "";
          const seats = Array.isArray(b.bookedSeats)
            ? b.bookedSeats.join(",")
            : "";
          const amount = b.amount || 0;
          return `${showId}::${seats}::${amount}`;
        };

        const seen = new Set();
        const merged = [];

        // Add persisted bookings first (so user-added bookings remain top)
        for (const b of persisted) {
          const k = keyFor(b);
          if (!seen.has(k)) {
            seen.add(k);
            merged.push(b);
          }
        }

        // Ensure each dummy booking appears at least once
        for (const b of dummyBookingData) {
          const k = keyFor(b);
          if (!seen.has(k)) {
            seen.add(k);
            merged.push(b);
          }
        }

        setBookings(merged);
      } catch (err) {
        console.error("Failed to load bookings from localStorage:", err);
        setBookings(dummyBookingData);
      } finally {
        setIsLoading(false);
      }
    }, 500);
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
      setBookings((prev) => {
        const updated = prev.filter((booking) => booking._id !== bookingId);
        try {
          // remove from localStorage bookings
          const persistedLocal = JSON.parse(
            localStorage.getItem("bookings") || "[]"
          );
          const newPersistedLocal = persistedLocal.filter(
            (b) => b._id !== bookingId
          );
          localStorage.setItem("bookings", JSON.stringify(newPersistedLocal));
        } catch (err) {
          console.error(
            "Failed to update persisted bookings in localStorage",
            err
          );
        }
        try {
          // remove from sessionStorage bookings
          const persistedSession = JSON.parse(
            sessionStorage.getItem("bookings") || "[]"
          );
          const newPersistedSession = persistedSession.filter(
            (b) => b._id !== bookingId
          );
          sessionStorage.setItem(
            "bookings",
            JSON.stringify(newPersistedSession)
          );
        } catch (err) {
          console.error(
            "Failed to update persisted bookings in sessionStorage",
            err
          );
        }
        return updated;
      });
    }, 800);
  };

  // Resolve poster/title/runtime for bookings that may only contain minimal movie data
  const resolveShowMovieField = (item, field) => {
    const bookingMovie = item?.show?.movie || null;
    if (bookingMovie && bookingMovie[field]) return bookingMovie[field];

    // try admin saved shows
    try {
      const admin = JSON.parse(localStorage.getItem("adminShows") || "[]");
      // first try matching by id
      let found = admin.find((s) => s._id === item?.show?._id);
      if (!found && bookingMovie && bookingMovie.title) {
        // fallback: try matching by title (some bookings may reference minimal data)
        found = admin.find(
          (s) =>
            s.title === bookingMovie.title ||
            s.title === item?.show?.movie?.title
        );
      }
      if (found && found[field]) return found[field];
    } catch (err) {
      // ignore
    }

    // fallback to dummyShowsData
    const dummyFoundById = dummyShowsData.find(
      (s) => s._id === item?.show?._id
    );
    if (dummyFoundById && dummyFoundById[field]) return dummyFoundById[field];
    if (bookingMovie && bookingMovie.title) {
      const dummyFoundByTitle = dummyShowsData.find(
        (s) => s.title === bookingMovie.title
      );
      if (dummyFoundByTitle && dummyFoundByTitle[field])
        return dummyFoundByTitle[field];
    }

    return null;
  };

  // Normalize image source: accept data urls, absolute urls, or fallback to TMDB base path if needed
  const computeImageSrc = (path) => {
    if (!path) return null;
    if (typeof path !== "string") return null;
    // data URL or absolute URL
    if (
      path.startsWith("data:") ||
      path.startsWith("http") ||
      path.startsWith("//")
    )
      return path;
    // support paths from TMDB (starting with /)
    if (path.startsWith("/"))
      return `https://image.tmdb.org/t/p/original${path}`;
    // otherwise return as-is
    return path;
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
                  resolveShowMovieField(item, "poster_path") ||
                  "https://via.placeholder.com/150"
                }
                alt={resolveShowMovieField(item, "title") || "Movie Poster"}
                className="md:max-w-45 aspect-video h-auto object-cover object-bottom rounded"
              />
              <div className="flex flex-col p-4">
                <p className="text-lg font-semibold">
                  {resolveShowMovieField(item, "title") || "-"}
                </p>
                <p className="text-gray-400 text-sm">
                  {timeFormat(resolveShowMovieField(item, "runtime")) || "-"}
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

                {/* Show Pay Now when unpaid */}
                {!item.isPaid && (
                  <Link
                    to={`/payment/${item._id}`}
                    className="bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer"
                  >
                    Pay Now
                  </Link>
                )}

                {/* Always show Cancel so user can remove any booking */}
                <button
                  onClick={() => handleCancelBooking(item._id)}
                  className="bg-red-500/80 hover:bg-red-500 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer transition active:scale-95"
                >
                  Cancel
                </button>
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
