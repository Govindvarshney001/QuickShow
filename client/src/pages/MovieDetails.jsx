import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyDateTimeData, dummyShowsData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import { StarIcon, PlayCircleIcon, Heart, XIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import Loading from "../components/Loading";

const image_base_url = "https://image.tmdb.org/t/p/w500";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    } catch (err) {
      return [];
    }
  });
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const [shows, setShows] = useState([]);

  // 🔹 Fetch merged shows (persisted admin shows + dummy)
  const loadShows = () => {
    try {
      const persisted = JSON.parse(localStorage.getItem("adminShows") || "[]");
      const map = new Map();
      const merged = [];
      for (const s of [...persisted, ...dummyShowsData]) {
        if (!map.has(s._id)) {
          map.set(s._id, true);
          merged.push(s);
        }
      }
      setShows(merged);
    } catch (err) {
      console.error("Failed to load shows:", err);
      setShows(dummyShowsData);
    }
  };

  // 🔹 Fetch show by id
  const getShow = async () => {
    const allShows = shows.length > 0 ? shows : dummyShowsData;
    const showData = allShows.find(
      (show) => show._id === id || show.id?.toString() === id
    );
    if (showData) {
      // generate dateTime for today + next 3 days
      const generateDateTime = (showId) => {
        const dateObj = {};
        const now = new Date();
        for (let i = 0; i < 4; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() + i);
          // key as YYYY-MM-DD
          const key = d.toISOString().slice(0, 10);
          // sample show times: 10:00, 14:00, 18:00 (local time)
          const times = [10, 14, 18].map((hour) => {
            const t = new Date(d);
            t.setHours(hour, 0, 0, 0);
            return { time: t.toISOString(), showId: `${showId}-${i}-${hour}` };
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
  };

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    getShow();
  }, [id, shows]);

  // 🔹 Favorite toggle (persisted to localStorage)
  const handleFavorite = () => {
    if (!show || !show.movie) return;
    const movie = show.movie;
    const exists = favoriteMovies.find((m) => m._id === movie._id);
    let updated;
    if (exists) {
      updated = favoriteMovies.filter((m) => m._id !== movie._id);
      setFavoriteMovies(updated);
      try {
        localStorage.setItem("favorites", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist favorites:", err);
      }
    } else {
      updated = [...favoriteMovies, movie];
      setFavoriteMovies(updated);
      try {
        localStorage.setItem("favorites", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist favorites:", err);
      }
    }
  };

  if (!show) return <Loading />;

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 relative">
      {/* Trailer Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl aspect-video">
            <iframe
              className="w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${
                show.movie.trailer_id || "WpW36ldAqnM"
              }?autoplay=1`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black p-2 rounded-full"
            >
              <XIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Main Movie Section */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Poster */}
        <img
          src={show.movie.poster_path}
          alt={show.movie.title}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        {/* Info */}
        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary uppercase">
            {show.movie.original_language}
          </p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>
          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>
          <p>
            {timeFormat(show.movie.runtime)} •{" "}
            {show.movie.genres.map((genre) => genre.name).join(", ")} •{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          {/* Buttons */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            {/* Watch Trailer */}
            <button
              onClick={() => setIsTrailerOpen(true)}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>

            {/* Buy Tickets */}
            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>

            {/* Favorite */}
            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies.find((movie) => movie._id === show.movie._id)
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Cast */}
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>
      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0, 12).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <img
                src={image_base_url + cast.profile_path}
                alt=""
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* DateSelect */}
      <DateSelect dateTime={show.dateTime} id={id} />

      {/* Recommendations */}
      <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>

      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
        >
          Show more
        </button>
      </div>
    </div>
  );
}

export default MovieDetails;
