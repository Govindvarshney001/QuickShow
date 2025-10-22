const timeFormat = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const minutesRemainder = minutes % 60;
  return `${hours}h ${minutesRemainder}m`;
};

// src/lib/dateFormat.js
export const dateFormat = (isoDateString) => {
  if (!isoDateString) return "Invalid Date";

  const date = new Date(isoDateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

