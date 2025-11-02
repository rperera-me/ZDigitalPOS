import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="mb-4 text-lg">Page Not Found</p>
      <Link to="/" className="text-blue-600 underline">
        Go Home
      </Link>
    </div>
  );
}
