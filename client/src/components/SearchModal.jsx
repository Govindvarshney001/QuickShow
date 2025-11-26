import React, { useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import { dummyShowsData } from "../assets/assets";

const SearchModal = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const getAllShows = () => {
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
      return merged;
    } catch (err) {
      return dummyShowsData;
    }
  };

  // live search on typing
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }
    const all = getAllShows();
    const matches = all.filter((m) =>
      (m.title || "").toLowerCase().includes(q)
    );
    setResults(matches);
  }, [query]);

  const clear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl bg-black rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Search Movies</h3>
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <div className="relative">
            <input
              ref={inputRef}
              className="w-full border rounded px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type movie name and press Enter or click Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search movies"
            />

            {query && (
              <button
                aria-label="clear"
                onClick={clear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex justify-end mt-3">
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => inputRef.current?.focus()}
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-6">
          {query && results.length === 0 && (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded">
              Movie Not Found
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-96 overflow-auto">
              {results.map((movie) => (
                <MovieCard movie={movie} key={movie._id} onSelect={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
