import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children, roles }) {
  const user = useSelector(state => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
