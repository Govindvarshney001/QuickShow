import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { kConverter } from "../../lib/kConverter";
import toast from "react-hot-toast";
import { dummyShowsData } from "../../assets/assets";

const AddShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  // New movie form state
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [trailerLink, setTrailerLink] = useState("");
  const [voteAverage, setVoteAverage] = useState(0);
  const [runtimeInput, setRuntimeInput] = useState("");
  const [genresInput, setGenresInput] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [language, setLanguage] = useState("");
  const [posterPreview, setPosterPreview] = useState("");
  const [backdropPreview, setBackdropPreview] = useState("");

  const fetchNowPlayingMovies = async () => {
    setNowPlayingMovies(dummyShowsData);
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };

  // Remove time from selection
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  useEffect(() => {
    fetchNowPlayingMovies();
  }, []);

  const navigate = useNavigate();

  // helpers
  const toMinutes = (input) => {
    if (!input) return 0;
    // accept formats like '1h 43m' or plain minutes '103'
    const hMatch = input.match(/(\d+)\s*h/);
    const mMatch = input.match(/(\d+)\s*m/);
    if (hMatch) {
      const hrs = parseInt(hMatch[1], 10);
      const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
      return hrs * 60 + mins;
    }
    const asNum = parseInt(input, 10);
    return Number.isNaN(asNum) ? 0 : asNum;
  };

  const extractYouTubeId = (url) => {
    if (!url) return "";
    // common patterns
    const vMatch = url.match(/[?&]v=([\w-]{11})/);
    if (vMatch) return vMatch[1];
    const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
    if (shortMatch) return shortMatch[1];
    const embedMatch = url.match(/embed\/([\w-]{11})/);
    if (embedMatch) return embedMatch[1];
    // fallback: try to extract last 11-char token
    const maybe = url.split(/\W/).find((p) => p && p.length === 11);
    return maybe || "";
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePosterChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const uploadUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/upload`;
    const t = toast.loading("Uploading poster...");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.error || "Upload failed");
      }
      const json = await res.json();
      setPosterPreview(json.url);
      toast.dismiss(t);
      toast.success("Poster uploaded");
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error("Failed to upload poster");
    }
  };

  const handleBackdropChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const uploadUrl = `${window.location.protocol}//${window.location.hostname}:3000/api/upload`;
    const t = toast.loading("Uploading backdrop...");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(uploadUrl, { method: "POST", body: fd });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        throw new Error(info.error || "Upload failed");
      }
      const json = await res.json();
      setBackdropPreview(json.url);
      toast.dismiss(t);
      toast.success("Backdrop uploaded");
    } catch (err) {
      console.error(err);
      toast.dismiss(t);
      toast.error("Failed to upload backdrop");
    }
  };

  const handleAddMovie = () => {
    // validation
    if (
      !posterPreview ||
      !title ||
      !overview ||
      !trailerLink ||
      !voteAverage ||
      !runtimeInput ||
      !genresInput ||
      !releaseYear ||
      !language
    ) {
      return toast.error(
        "Please fill all required fields (poster, title, description, trailer, rating, duration, genre, year, language)"
      );
    }

    const trailerId = extractYouTubeId(trailerLink);
    const runtime = toMinutes(runtimeInput);

    const genres = genresInput
      .split(",")
      .map((g, idx) => ({ id: Date.now() + idx, name: g.trim() }))
      .filter((g) => g.name);

    const newMovie = {
      _id: `${Date.now()}`,
      id: Date.now(),
      title: title,
      overview: overview,
      poster_path: posterPreview,
      backdrop_path: backdropPreview || posterPreview,
      genres,
      casts: [],
      release_date: `${releaseYear}-01-01`,
      original_language: language,
      tagline: "",
      vote_average: Number(voteAverage),
      vote_count: 0,
      runtime: runtime,
      trailer_id: trailerId,
    };

    try {
      const existing = JSON.parse(localStorage.getItem("adminShows") || "[]");
      existing.unshift(newMovie);
      localStorage.setItem("adminShows", JSON.stringify(existing));
      // update UI
      setNowPlayingMovies((prev) => [newMovie, ...prev]);
      toast.success("Movie added successfully");
      // clear form
      setTitle("");
      setOverview("");
      setTrailerLink("");
      setVoteAverage(0);
      setRuntimeInput("");
      setGenresInput("");
      setReleaseYear("");
      setLanguage("");
      setPosterPreview("");
      setBackdropPreview("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save movie");
    }
  };

  // Render UI
  //   if (loading) return <Loading />;

  return (
    <>
      <Title text1="Add" text2="Shows" />
      <div className="flex justify-end mt-3">
        <button
          onClick={() => navigate("/")}
          className="px-3 py-1 rounded bg-red-800 text-white hover:bg-gray-700"
        >
          Home
        </button>
      </div>

      {/* Movies Section */}
      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>

      {nowPlayingMovies.length === 0 ? (
        <p className="text-gray-400 mt-6">No movies currently playing.</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="group flex flex-wrap gap-4 mt-4 w-max">
            {nowPlayingMovies.map((movie) => (
              <div
                key={movie.id}
                className={`relative max-w-40 cursor-pointer transition duration-300 ${
                  selectedMovie === movie.id
                    ? "ring-2 ring-primary scale-105"
                    : "opacity-80 hover:opacity-100"
                }`}
                onClick={() => setSelectedMovie(movie.id)}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="w-full object-cover brightness-90"
                  />
                  <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                    <p className="flex items-center gap-1 text-gray-400">
                      <StarIcon className="w-4 h-4 text-primary fill-primary" />
                      {movie.vote_average.toFixed(1)}
                    </p>
                    <p className="text-gray-300">
                      {kConverter(movie.vote_count)} Votes
                    </p>
                  </div>
                </div>

                {selectedMovie === movie.id && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                    <CheckIcon
                      className="w-4 h-4 text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                )}

                <p className="font-medium truncate">{movie.title}</p>
                <p className="text-gray-400 text-sm">{movie.release_date}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">Show Price</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            min={0}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter show price"
            className="outline-none bg-transparent text-white"
          />
        </div>
      </div>

      {/* Date & Time Selection */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Date and Time
        </label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md bg-transparent text-white"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* Display Selected Times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-medium">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* New Movie Form */}
      <div className="mt-8 p-6 border border-gray-700 rounded-lg bg-black/20">
        <h2 className="text-lg font-medium mb-4">Add New Movie</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Movie Poster (required)
            </label>
            <input type="file" accept="image/*" onChange={handlePosterChange} />
            {posterPreview && (
              <img
                src={posterPreview}
                alt="poster"
                className="mt-2 rounded max-h-40"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Backdrop Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBackdropChange}
            />
            {backdropPreview && (
              <img
                src={backdropPreview}
                alt="backdrop"
                className="mt-2 rounded max-h-40"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Movie Name (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Short Description / Plot (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              YouTube Trailer Link (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={trailerLink}
              onChange={(e) => setTrailerLink(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              User Rating (required)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={voteAverage}
              onChange={(e) => setVoteAverage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Movie Duration (e.g., 1h 43m) (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={runtimeInput}
              onChange={(e) => setRuntimeInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Genre/Category (comma separated) (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={genresInput}
              onChange={(e) => setGenresInput(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Release Year (required)
            </label>
            <input
              type="number"
              min={1900}
              max={2100}
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Language (e.g., EN) (required)
            </label>
            <input
              className="w-full p-2 rounded bg-transparent border border-gray-700"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleAddMovie}
            className="bg-primary px-4 py-2 rounded"
          >
            Add Movie
          </button>
          <button
            onClick={() => {
              setTitle("");
              setOverview("");
              setTrailerLink("");
              setVoteAverage(0);
              setRuntimeInput("");
              setGenresInput("");
              setReleaseYear("");
              setLanguage("");
              setPosterPreview("");
              setBackdropPreview("");
            }}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
};

export default AddShows;
