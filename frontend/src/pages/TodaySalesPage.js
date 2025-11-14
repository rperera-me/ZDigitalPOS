import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/axios";
import { LastSaleModal } from "../components/modals";
import { useTranslation } from "react-i18next";
import storeSetting from "../config/storeSettings";

export default function TodaySalesPage({ isOpen, onClose }) {
    const { i18n } = useTranslation();
    const user = useSelector((state) => state.auth.user);

    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showSaleModal, setShowSaleModal] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        totalCount: 0,
        totalValue: 0,
        cashSales: 0,
        cardSales: 0,
        creditSales: 0,
        voidedSales: 0
    });

    const fetchTodaySales = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const response = await api.get("/sale/daterange", {
                params: {
                    start: today.toISOString(),
                    end: tomorrow.toISOString()
                }
            });

            console.log(response);

            // Filter by current user (cashier)
            const userSales = response.data.filter(
                sale => !sale.isHeld
            );
            console.log(userSales, user);
            setSales(userSales);
            calculateStats(userSales);
        } catch (error) {
            console.error("Failed to fetch sales:", error);
            alert("Failed to load today's sales");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (salesData) => {
        const validSales = salesData.filter(s => !s.isVoided);

        const newStats = {
            totalCount: validSales.length,
            totalValue: validSales.reduce((sum, s) => sum + (s.finalAmount || s.totalAmount), 0),
            cashSales: 0,
            cardSales: 0,
            creditSales: 0,
            voidedSales: salesData.filter(s => s.isVoided).length
        };

        validSales.forEach(sale => {
            if (sale.payments && sale.payments.length > 0) {
                sale.payments.forEach(payment => {
                    if (payment.type === "Cash") newStats.cashSales += payment.amount;
                    if (payment.type === "Card") newStats.cardSales += payment.amount;
                    if (payment.type === "Credit") newStats.creditSales += payment.amount;
                });
            } else {
                // Fallback for old data structure
                if (sale.paymentType === "Cash") newStats.cashSales += sale.amountPaid;
                if (sale.paymentType === "Card") newStats.cardSales += sale.amountPaid;
                if (sale.paymentType === "Credit") newStats.creditSales += sale.amountPaid;
            }
        });

        setStats(newStats);
    };

    const handleViewSale = (sale) => {
        setSelectedSale(sale);
        setShowSaleModal(true);
    };

    const handleVoidSale = async (saleId) => {
        const confirmed = window.confirm(
            "Are you sure you want to VOID this sale? This will restore stock quantities and cannot be undone."
        );

        if (!confirmed) return;

        try {
            await api.post(`/sale/${saleId}/void`);
            alert("Sale voided successfully. Stock has been restored.");
            fetchTodaySales(); // Refresh list
        } catch (error) {
            console.error("Failed to void sale:", error);
            alert("Failed to void sale: " + (error.response?.data?.message || error.message));
        }
    };

    const handlePrintReceipt = (sale) => {
        i18n.changeLanguage(storeSetting.receiptLanguage || "en");
        setSelectedSale(sale);
        setShowSaleModal(true);
    };

    useEffect(() => {
        if (isOpen) {
            fetchTodaySales();
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-700">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Today's Sales
                    </h3>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="p-6 bg-gray-50 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <StatCard
                            title="Total Sales"
                            value={stats.totalCount}
                            icon="📊"
                            color="bg-gradient-to-br from-blue-500 to-blue-600"
                        />
                        <StatCard
                            title="Total Value"
                            value={`Rs ${stats.totalValue.toFixed(2)}`}
                            icon="💰"
                            color="bg-gradient-to-br from-green-500 to-green-600"
                        />
                        <StatCard
                            title="Cash Sales"
                            value={`Rs ${stats.cashSales.toFixed(2)}`}
                            icon="💵"
                            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        />
                        <StatCard
                            title="Card Sales"
                            value={`Rs ${stats.cardSales.toFixed(2)}`}
                            icon="💳"
                            color="bg-gradient-to-br from-purple-500 to-purple-600"
                        />
                        <StatCard
                            title="Credit Sales"
                            value={`Rs ${stats.creditSales.toFixed(2)}`}
                            icon="📋"
                            color="bg-gradient-to-br from-orange-500 to-orange-600"
                        />
                        <StatCard
                            title="Voided"
                            value={stats.voidedSales}
                            icon="❌"
                            color="bg-gradient-to-br from-red-500 to-red-600"
                        />
                    </div>
                </div>

                {/* Sales List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading sales...</p>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-gray-500 text-lg">No sales recorded today</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-3 text-left text-sm font-semibold text-gray-700">Time</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Sale #</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Items</th>
                                        <th className="p-3 text-right text-sm font-semibold text-gray-700">Total</th>
                                        <th className="p-3 text-right text-sm font-semibold text-gray-700">Paid</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Payment</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Customer</th>
                                        <th className="p-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => {
                                        const itemCount = sale.saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                                        const paymentTypes = sale.payments?.map(p => p.type).join(", ") || sale.paymentType;
                                        const customerType = sale.customer?.type || "walk-in";
                                        const isVoided = sale.isVoided;

                                        return (
                                            <tr
                                                key={sale.id}
                                                className={`border-b hover:bg-gray-50 transition ${isVoided ? 'bg-red-50 opacity-60' : ''}`}
                                            >
                                                <td className="p-3 text-sm text-gray-700">
                                                    {new Date(sale.saleDate).toLocaleTimeString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-mono text-sm font-bold text-blue-600">
                                                        #{sale.id}
                                                    </span>
                                                    {isVoided && (
                                                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                                                            VOIDED
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                        {itemCount}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-semibold text-gray-800">
                                                    Rs {(sale.finalAmount || sale.totalAmount).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right font-semibold text-green-600">
                                                    Rs {sale.amountPaid.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                                                        {paymentTypes}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${customerType === "loyalty" ? "bg-purple-100 text-purple-700" :
                                                        customerType === "wholesale" ? "bg-blue-100 text-blue-700" :
                                                            "bg-gray-100 text-gray-700"
                                                        }`}>
                                                        {customerType}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button
                                                            onClick={() => handleViewSale(sale)}
                                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs font-semibold flex items-center gap-1"
                                                            title="View Sale"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View
                                                        </button>
                                                        {!isVoided && (
                                                            <button
                                                                onClick={() => handleVoidSale(sale.id)}
                                                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs font-semibold flex items-center gap-1"
                                                                title="Void Sale"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Void
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Sale View Modal */}
            <LastSaleModal
                isOpen={showSaleModal}
                onClose={() => {
                    setShowSaleModal(false);
                    setSelectedSale(null);
                }}
                lastSale={selectedSale}
                onLoadSale={() => { }} // Not needed for view-only
                onPrintReceipt={handlePrintReceipt}
                i18n={i18n}
                storeSetting={storeSetting}
            />
        </div>
    );
}

// Stats Card Component
function StatCard({ title, value, icon, color }) {
    return (
        <div className={`${color} rounded-xl shadow-lg p-4 text-white hover:shadow-xl transition-all`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <div className="text-xs opacity-80 mb-1">{title}</div>
            <div className="text-lg font-bold">{value}</div>
        </div>
    );
}