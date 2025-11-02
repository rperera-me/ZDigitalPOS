import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { login } from "../app/authSlice";
import clsx from "clsx";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    const response = await api.post("/auth/login", { username, password });
    if (response.data?.token) {
      // Decode JWT token to get role
      const decoded = jwtDecode(response.data.token);
      const userRole = decoded.role || decoded.Role || "";

      dispatch(
        login({
          username,
          token: response.data.token,
          role: userRole.toLowerCase(),
        })
      );

      navigate("/dashboard");
      
    } else {
      setError("Invalid credentials");
    }
  } catch {
    setError("Login failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-80"
      >
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Log In</h2>

        {error && (
          <p className="text-red-600 mb-4 text-center font-semibold" role="alert">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={clsx(
            "w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
            error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
            "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          )}
          required
          autoFocus
          aria-label="Username"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={clsx(
            "w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
            error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
            "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          )}
          required
          aria-label="Password"
        />

        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300",
            loading ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
