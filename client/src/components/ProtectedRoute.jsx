import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return setAuthorized(false);
    fetch("/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok }) => setAuthorized(ok))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) return null;
  if (!authorized) return <Navigate to="/" replace />;
  return children;
}
