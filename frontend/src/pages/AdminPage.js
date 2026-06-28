import React, { useState } from "react";
import AdminProductsPage from "./AdminProductsPage";
import AdminCategoriesPage from "./AdminCategoriesPage";
import AdminCustomersPage from "./AdminCustomersPage";
import AdminSettingsPage from "./AdminSettingsPage";

export default function AdminPage() {
  const [tab, setTab] = useState("products");

  const tabs = [
    { id: "products", label: "Products" },
    { id: "categories", label: "Categories" },
    { id: "customers", label: "Customers" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <nav className="mb-6 flex gap-6 border-b pb-3 text-lg">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`hover:text-blue-600 pb-1 ${tab === t.id ? "border-b-2 border-blue-600 font-semibold" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "products" && <AdminProductsPage />}
      {tab === "categories" && <AdminCategoriesPage />}
      {tab === "customers" && <AdminCustomersPage />}
      {tab === "settings" && <AdminSettingsPage />}
    </div>
  );
}
