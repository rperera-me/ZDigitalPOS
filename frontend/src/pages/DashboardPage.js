import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, fetchLowStock, fetchBestSellers } from "../app/dashboardSlice";
import { fetchCurrentUser } from "../app/userSlice";
import QuickStatsPanel from "../components/dashboard/QuickStatsPanel";
import ProfileSummary from "../components/dashboard/ProfileSummary";
import LowStockTable from "../components/dashboard/LowStockTable";
import BestSellerTable from "../components/dashboard/BestSellerTable";
import storeSettings from "../config/storeSettings";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading: statsLoading, error: statsError, lowStock, bestSellers } = useSelector((state) => state.dashboard);
  const { data: userData, loading: userLoading, error: userError } = useSelector((state) => state.user);
  const [date, setDate] = useState(new Date());

  // Update time clock every second
  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStock());
    dispatch(fetchBestSellers());
    dispatch(fetchCurrentUser());
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

const profileInfo = {
  date: date.toLocaleDateString(),
  time: date.toLocaleTimeString(),
  store: storeSettings.storeName,
  user: userData ? `Cashier-${userData.username}` : "Loading...",
  address: storeSettings.storeAddress,
  phone: storeSettings.storePhone,
};

  // Compose quick stats with live API data or fallback placeholders
  const quickStats = [
    { label: "Today Sale", value: stats.todaySale?.toFixed(2) || "0.00", icon: "/icons/sale.png" },
    { label: "Last Invoice", value: stats.lastInvoice || "000", icon: "/icons/invoice.png" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatsPanel stats={quickStats} />
        <ProfileSummary {...profileInfo} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <LowStockTable items={lowStock} />
        <BestSellerTable products={bestSellers} />
      </div>
    </div>
  );
}
