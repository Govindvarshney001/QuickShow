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

  // 🧠 Dummy getShow (no axios)
  const getShow = async () => {
    try {
      const showData =
        dummyShowsData.find(
          (item) => item._id === id || item.id?.toString() === id
        ) || dummyShowsData[0]; // fallback

      if (showData) {
        setShow({
          movie: showData,
          dateTime: dummyDateTimeData,
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

  const bookTickets = () => {
    if (!selectedTime || !selectedSeats.length)
      return toast.error("Please select time and seats");

    toast.success(
      `Booking confirmed for ${selectedSeats.length} seat(s) at ${formatTime(
        selectedTime.time
      )}`
    );

    navigate("/success"); // redirect mock
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
                <ClockIcon className="w-4 h-4" />
                <p className="text-sm">{isoTimeFormat(item.time)}</p>
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
          onClick={() => navigate("/my-bookings")}
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
