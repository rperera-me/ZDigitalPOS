import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const allNavItems = [
  { label: "Dashboard", icon: "/icons/dashboard.png", path: "/dashboard" },
  { label: "Sale", icon: "/icons/sale.png", path: "/cashier" },
  { label: "Suppliers", icon: "/icons/supplier.png", path: "/suppliers" }, // New
  { label: "GRN", icon: "/icons/grn.png", path: "/grn" }, // New
  { label: "Customers", icon: "/icons/stock.png", path: "/customers" },
  { label: "Categories", icon: "/icons/stock.png", path: "/categories" },
  { label: "Products", icon: "/icons/stock.png", path: "/products" },
  { label: "Setting", icon: "/icons/setting.png", path: "/setting" },
  { label: "Logout", icon: "/icons/logout.png", path: "/logout" }
];

export default function NavigationBar() {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const role = user?.role || "";

  // Filter nav items based on role
  const navItems = role === "cashier"
    ? allNavItems.filter(i => ["Dashboard", "Sale", "Logout"].includes(i.label))
    : allNavItems;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="flex flex-wrap items-center p-2 bg-white border-b shadow-sm">
      {navItems.map(({ label, icon, path }) =>
        label === "Logout" ? (
          <button key={label} onClick={handleLogout} className="flex flex-col items-center cursor-pointer mx-1 p-1 rounded hover:bg-gray-200 transition" title={label}>
            <img src={icon} alt={label} className="w-8 h-8 mb-1" />
            <span className="text-xs text-center">{label}</span>
          </button>
        ) : (
          <button key={label} onClick={() => navigate(path)} className="flex flex-col items-center cursor-pointer mx-1 p-1 rounded hover:bg-gray-200 transition" title={label}>
            <img src={icon} alt={label} className="w-8 h-8 mb-1" />
            <span className="text-xs text-center">{label}</span>
          </button>
        )
      )}
    </nav>
  );
}
