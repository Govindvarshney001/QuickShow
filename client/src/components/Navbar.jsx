import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
// import { useAppContext } from "../context/AppContext";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const { favoriteMovies } = useAppContext();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const {openSignIn} = useClerk();

  // Get search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);
    // Don't auto-open search when coming from URL - let user control it
    // Only sync the query value
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Close search popup immediately
      setIsSearchOpen(false);
      // Navigate to movies page with search query
      navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
      scrollTo(0, 0);
    } else {
      // If search is empty, just close the popup
      setIsSearchOpen(false);
    }
  };

  const handleSearchIconClick = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus input after opening
      setTimeout(() => {
        const input = document.getElementById("search-input");
        if (input) input.focus();
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery("");
      if (location.pathname === "/movies") {
        navigate("/movies");
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 1g:px-36 py-5">
      <Link>
        <img src={assets.logo} className="w-36 h-auto" alt="" />
      </Link>
      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${
          isOpen ? "max-md:w-full" : "max-md:w-0"
        }`}
      >
        <XIcon
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/my-bookings"
        >
          Bookings
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Releases
        </Link>
        {(
          <Link
            onClick={() => {
              scrollTo(0, 0);
              setIsOpen(false);
            }}
            to="/favorite"
          >
            Favorites
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Search Input - Desktop */}
        <div className="max-md:hidden relative">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="px-4 py-2 bg-white/10 backdrop-blur border border-gray-300/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-64 transition-all duration-300"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-sm"
              >
                Search
              </button>
              <XIcon
                className="w-5 h-5 cursor-pointer hover:text-gray-400 transition"
                onClick={handleSearchIconClick}
              />
            </form>
          ) : (
            <SearchIcon
              className="w-6 h-6 cursor-pointer hover:text-primary transition"
              onClick={handleSearchIconClick}
            />
          )}
        </div>

        {/* Search Input - Mobile */}
        <div className="md:hidden relative">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="px-4 py-2 bg-white/10 backdrop-blur border border-gray-300/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-48 text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer text-xs"
              >
                Search
              </button>
              <XIcon
                className="w-5 h-5 cursor-pointer hover:text-gray-400 transition"
                onClick={handleSearchIconClick}
              />
            </form>
          ) : (
            <SearchIcon
              className="w-6 h-6 cursor-pointer hover:text-primary transition"
              onClick={handleSearchIconClick}
            />
          )}
        </div>

        {!user ? (
          <button
            onClick={openSignIn}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/my-bookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
}

export default Navbar;
