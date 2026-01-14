import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Simple Admin Auth Modal for secret code 2083
export default function AdminAuthModal({ open, onClose }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setCode("");
      setError(false);
    }
  }, [open]);

  function submit(e) {
    e.preventDefault();
    const secret = "2083";
    if (String(code).trim() === secret) {
      onClose();
      navigate("/admin");
    } else {
      setError(true);
      // clear input after short delay for UX
      setTimeout(() => setError(false), 800);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/40"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className={`relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 transform transition-all ${
          error ? "animate-shake" : ""
        }`}
      >
        <h2 className="text-xl font-semibold mb-3">Admin Access</h2>
        <p className="text-xl text-black mb-4">
          Enter the secret code to continue.
        </p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border rounded px-3 py-3 text-lg font-medium mb-0 focus:outline-none focus:ring-2 focus:ring-red-400 text-black"
          placeholder="Enter secret code"
          type="password"
        />
        <div className="relative mb-3">
          <button
            type="button"
            aria-label={showCode ? "Hide code" : "Show code"}
            onClick={() => setShowCode((s) => !s)}
            className="absolute right-4 top-4/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
          >
            {showCode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4.03 3.97a.75.75 0 10-1.06 1.06l1.07 1.07A9.47 9.47 0 001 10c2.55 4 6.5 6 9 6 1.06 0 1.98-.2 2.7-.52l1.6 1.6a.75.75 0 101.06-1.06l-14-14z" />
                <path d="M13.9 11.9a3 3 0 11-4.8-4.8" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-red-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Enter
          </button>
        </div>
        {error && (
          <div className="mt-4 text-red-600 text-sm">
            You cannot access the Admin section!
          </div>
        )}
      </form>

      {/* Add minimal CSS for shake animation (add to global CSS if preferred) */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake { animation: shake 0.5s; }
      `}</style>
    </div>
  );
}
