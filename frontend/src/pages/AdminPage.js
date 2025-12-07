import React, { useState } from "react";
import AdminProductsPage from "./AdminProductsPage";
import AdminCategoriesPage from "./AdminCategoriesPage";
import AdminCustomersPage from "./AdminCustomersPage";

export default function AdminPage() {
  const [tab, setTab] = useState("products");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <nav className="mb-6 flex gap-6 border-b pb-3 text-lg">
        <button
          className={`hover:text-blue-600 pb-1 ${tab === "products" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          className={`hover:text-blue-600 pb-1 ${tab === "categories" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          onClick={() => setTab("categories")}
        >
          Categories
        </button>
        <button
          className={`hover:text-blue-600 pb-1 ${tab === "customers" ? "border-b-2 border-blue-600 font-semibold" : ""}`}
          onClick={() => setTab("customers")}
        >
          Customers
        </button>
      </nav>

      {tab === "products" && <AdminProductsPage />}
      {tab === "categories" && <AdminCategoriesPage />}
      {tab === "customers" && <AdminCustomersPage />}
    </div>
  );
}
