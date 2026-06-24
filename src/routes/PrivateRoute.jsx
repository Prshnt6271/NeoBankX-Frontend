import { Navigate } from "react-router-dom";

export const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If no token, redirect to landing page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If token exists, render the protected component
  return children;
};