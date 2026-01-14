import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { dummyShowsData } from "../assets/assets";

const Movies = () => {
  const [shows, setShows] = useState([]);

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

      <h1 className="text-lg font-medium my-4">Now Showing</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.map((movie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  );
};

export default Movies;
