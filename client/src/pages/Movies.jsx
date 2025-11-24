import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { dummyShowsData } from "../assets/assets";

const Movies = () => {
  const [shows, setShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("adminShows") || "[]");
      // merged: persisted first (recent admin adds), then dummy data; dedupe by _id
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
      console.error("Failed to load admin shows:", err);
      setShows(dummyShowsData);
    }
  }, []);

  // Filter shows based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredShows(shows);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = shows.filter((movie) => {
      const title = (movie.title || "").toLowerCase();
      const overview = (movie.overview || "").toLowerCase();
      const genres = (movie.genres || [])
        .map((g) => g.name.toLowerCase())
        .join(" ");
      
      return (
        title.includes(query) ||
        overview.includes(query) ||
        genres.includes(query)
      );
    });
    setFilteredShows(filtered);
  }, [searchQuery, shows]);

  // Use filtered shows if search query exists, otherwise use all shows
  const displayShows = searchQuery.trim() ? filteredShows : shows;

  if (!shows || shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold text-center">No movies available</h1>
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium">
          {searchQuery.trim()
            ? `Search Results for "${searchQuery}" (${displayShows.length})`
            : "Now Showing"}
        </h1>
      </div>

      {displayShows.length === 0 && searchQuery.trim() ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-xl text-gray-400 mb-2">No movies found</p>
          <p className="text-sm text-gray-500">
            Try searching with a different keyword
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {displayShows.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;
