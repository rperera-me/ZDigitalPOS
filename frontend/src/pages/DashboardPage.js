import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, fetchLowStock, fetchBestSellers } from "../app/dashboardSlice";
import { fetchCurrentUser } from "../app/userSlice";
import storeSettings from "../config/storeSettings";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { stats, loading, error, lowStock, bestSellers } = useSelector((state) => state.dashboard);
  const { data: userData } = useSelector((state) => state.user);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStock());
    dispatch(fetchBestSellers());
    dispatch(fetchCurrentUser());
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-white text-opacity-80 text-sm font-medium uppercase tracking-wide">{title}</div>
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-white text-3xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData?.username || "User"}!</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{date.toLocaleDateString()}</div>
            <div className="text-3xl font-extrabold text-blue-600 tabular-nums">
              {date.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Sales"
          value={`Rs ${(stats.todaySale || 0).toFixed(2)}`}
          color="from-blue-500 to-blue-600"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Last Invoice"
          value={stats.lastInvoice || "000"}
          color="from-green-500 to-green-600"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatCard
          title="Low Stock Items"
          value={lowStock?.length || 0}
          color="from-red-500 to-red-600"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <StatCard
          title="Products"
          value="View All"
          color="from-purple-500 to-purple-600"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Low Stock Alert
            </h3>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
              {lowStock?.length || 0} items
            </span>
          </div>

          {!lowStock || lowStock.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-medium">All items have adequate stock!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Barcode</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">Item</th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 text-sm font-mono text-blue-600">{item.barcode}</td>
                      <td className="p-3 text-sm font-medium">{item.item}</td>
                      <td className="text-center p-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.available === 0 ? 'bg-red-100 text-red-600' : 
                          item.available <= 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {item.available}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Best Sellers
            </h3>
          </div>

          {!bestSellers || bestSellers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSellers.slice(0, 10).map((product, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">Sold: {product.qty} units</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Store Info Footer */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-gray-600 text-sm mb-1">Store Name</div>
            <div className="text-gray-800 font-bold text-lg">{storeSettings.storeName}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Address</div>
            <div className="text-gray-800 font-semibold">{storeSettings.storeAddress}</div>
          </div>
          <div>
            <div className="text-gray-600 text-sm mb-1">Contact</div>
            <div className="text-gray-800 font-semibold">{storeSettings.storePhone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}