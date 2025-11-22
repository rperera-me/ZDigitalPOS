import React, { useState, useEffect } from "react";
import api from "../../api/axios";

export default function ViewCustomerPurchasesModal({ isOpen, onClose, customer }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  useEffect(() => {
    if (isOpen && customer) {
      fetchPurchases();
    }
  }, [isOpen, customer]);

  const fetchPurchases = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const response = await api.get(`/customer/${customer.id}/purchases`);
      setPurchases(response.data || []);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      alert("Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  };

  const toggleSaleExpansion = (saleId) => {
    setExpandedSaleId(expandedSaleId === saleId ? null : saleId);
  };

  const getPaymentMethodColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-700 border-green-300';
      case 'card': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'credit': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const calculateTotalsByPaymentType = () => {
    const totals = { Cash: 0, Card: 0, Credit: 0 };
    
    purchases.filter(p => !p.isVoided).forEach(purchase => {
      purchase.payments?.forEach(payment => {
        if (totals.hasOwnProperty(payment.type)) {
          totals[payment.type] += payment.amount;
        }
      });
    });
    
    return totals;
  };

  const calculateLoyaltyPointsEarned = () => {
    if (customer?.type !== "loyalty") return 0;
    
    return purchases
      .filter(p => !p.isVoided)
      .reduce((sum, p) => sum + Math.floor(p.finalAmount / 100), 0);
  };

  if (!isOpen || !customer) return null;

  const totalPurchases = purchases.filter(p => !p.isVoided).length;
  const totalSpent = purchases.filter(p => !p.isVoided).reduce((sum, p) => sum + p.finalAmount, 0);
  const voidedCount = purchases.filter(p => p.isVoided).length;
  const paymentTotals = calculateTotalsByPaymentType();
  const totalPointsEarned = calculateLoyaltyPointsEarned();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Purchase History - {customer.name}
            </h3>
            <div className="flex gap-4 mt-2 text-white text-sm">
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                Phone: {customer.phone || "N/A"}
              </span>
              <span className={`px-3 py-1 rounded-full font-semibold ${
                customer.type === "loyalty" ? "bg-purple-200 text-purple-900" : 
                customer.type === "wholesale" ? "bg-blue-200 text-blue-900" : 
                "bg-gray-200 text-gray-900"
              }`}>
                {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-md">
              <div className="text-xs text-blue-700 font-medium mb-1">Total Purchases</div>
              <div className="text-2xl font-bold text-blue-900">{totalPurchases}</div>
            </div>
            
            <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow-md">
              <div className="text-xs text-green-700 font-medium mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-green-900">Rs {totalSpent.toFixed(2)}</div>
            </div>
            
            <div className="bg-white border-2 border-emerald-200 rounded-lg p-4 shadow-md">
              <div className="text-xs text-emerald-700 font-medium mb-1">Cash Payments</div>
              <div className="text-xl font-bold text-emerald-900">Rs {paymentTotals.Cash.toFixed(2)}</div>
            </div>

            <div className="bg-white border-2 border-indigo-200 rounded-lg p-4 shadow-md">
              <div className="text-xs text-indigo-700 font-medium mb-1">Card Payments</div>
              <div className="text-xl font-bold text-indigo-900">Rs {paymentTotals.Card.toFixed(2)}</div>
            </div>

            {customer.type === "loyalty" ? (
              <div className="bg-white border-2 border-purple-200 rounded-lg p-4 shadow-md">
                <div className="text-xs text-purple-700 font-medium mb-1">Points Earned</div>
                <div className="text-2xl font-bold text-purple-900">{totalPointsEarned}</div>
              </div>
            ) : (
              <div className="bg-white border-2 border-orange-200 rounded-lg p-4 shadow-md">
                <div className="text-xs text-orange-700 font-medium mb-1">Credit Used</div>
                <div className="text-xl font-bold text-orange-900">Rs {paymentTotals.Credit.toFixed(2)}</div>
              </div>
            )}
          </div>

          {voidedCount > 0 && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ {voidedCount} voided {voidedCount === 1 ? 'sale' : 'sales'} (not included in totals)
              </p>
            </div>
          )}
        </div>

        {/* Purchases List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading purchase history...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-600 font-medium text-lg">No purchase history</p>
              <p className="text-sm text-gray-500 mt-2">This customer hasn't made any purchases yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const isExpanded = expandedSaleId === purchase.saleId;
                const pointsEarned = customer.type === "loyalty" && !purchase.isVoided 
                  ? Math.floor(purchase.finalAmount / 100) 
                  : 0;

                return (
                  <div
                    key={purchase.saleId}
                    className={`border-2 rounded-lg overflow-hidden transition ${
                      purchase.isVoided 
                        ? 'border-red-300 bg-red-50 opacity-60' 
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                    }`}
                  >
                    <div
                      onClick={() => toggleSaleExpansion(purchase.saleId)}
                      className="p-4 cursor-pointer bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-indigo-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-lg text-gray-800">
                              Sale #{purchase.saleId}
                            </span>
                            {purchase.isVoided && (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-300">
                                VOIDED
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(purchase.saleDate).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(purchase.saleDate).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span>{purchase.itemCount} items</span>
                            </div>

                            {customer.type === "loyalty" && pointsEarned > 0 && (
                              <div className="flex items-center gap-1 text-purple-600 font-semibold">
                                <span>✨</span>
                                <span>+{pointsEarned} points</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold text-blue-700">
                            Rs {purchase.finalAmount.toFixed(2)}
                          </div>
                          {purchase.totalAmount !== purchase.finalAmount && (
                            <div className="text-xs text-gray-500 line-through">
                              Rs {purchase.totalAmount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t-2 border-gray-200">
                        {/* Payment Details */}
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Payment Methods
                          </h5>
                          
                          {purchase.payments && purchase.payments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {purchase.payments.map((payment, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-3 rounded-lg border-2 ${getPaymentMethodColor(payment.type)}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-semibold text-sm">{payment.type}</div>
                                      {payment.cardLastFour && (
                                        <div className="text-xs mt-1">**** {payment.cardLastFour}</div>
                                      )}
                                    </div>
                                    <div className="text-lg font-bold">
                                      Rs {payment.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={`p-3 rounded-lg border-2 ${getPaymentMethodColor(purchase.paymentType)}`}>
                              <div className="flex justify-between items-center">
                                <div className="font-semibold">{purchase.paymentType}</div>
                                <div className="text-lg font-bold">
                                  Rs {purchase.finalAmount.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-gray-600 mb-1">Items Purchased</div>
                            <div className="font-bold text-gray-800">{purchase.itemCount} items</div>
                          </div>
                          
                          {customer.type === "loyalty" && pointsEarned > 0 && (
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <div className="text-purple-700 mb-1 font-medium">Loyalty Points Earned</div>
                              <div className="font-bold text-purple-900 text-lg">
                                +{pointsEarned} points
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {customer.type === "loyalty" && (
              <p className="font-semibold">
                Current Balance: 
                <span className={`ml-2 ${customer.creditBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {customer.creditBalance.toFixed(2)}
                </span>
                <span className="ml-4 text-purple-600">
                  • Loyalty Points: {customer.loyaltyPoints}
                </span>
              </p>
            )}
            {customer.type === "wholesale" && customer.creditBalance > 0 && (
              <p className="font-semibold text-red-600">
                Outstanding Credit: Rs {customer.creditBalance.toFixed(2)}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}