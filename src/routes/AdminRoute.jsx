import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists but role is not ADMIN, redirect to user dashboard
  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is ADMIN, render the admin component
  return children;
}