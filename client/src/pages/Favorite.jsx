import React, { useEffect, useState } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";

const Favorite = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(persisted);
    } catch (err) {
      console.error("Failed to load favorites:", err);
      setFavorites([]);
    }
  }, []);

  const handleRemove = (movieId) => {
    const updated = favorites.filter((m) => m._id !== movieId);
    setFavorites(updated);
    try {
      localStorage.setItem("favorites", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist favorites:", err);
    }
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold text-center">No favorites yet</h1>
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      <h1 className="text-lg font-medium my-4">My Favorites</h1>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {favorites.map((movie) => (
          <div key={movie._id} className="flex flex-col gap-2">
            <MovieCard movie={movie} />
            <div className="flex justify-center">
              <button
                onClick={() => handleRemove(movie._id)}
                className="bg-red-500/80 hover:bg-red-500 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer transition active:scale-95"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorite;
