import React, { useState, useEffect } from "react";
import ViewGRNModal from "./ViewGRNModal";

export default function SupplierGRNsModal({ isOpen, onClose, supplier }) {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (isOpen && supplier) {
      fetchGRNs();
    }
  }, [isOpen, supplier]);

  const fetchGRNs = async () => {
    if (!supplier) return;

    setLoading(true);
    try {
      const api = require("../../api/axios").default;
      const response = await api.get(`/grn/supplier/${supplier.id}`);
      setGrns(response.data || []);
    } catch (error) {
      console.error("Failed to fetch GRNs:", error);
      alert("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  const handleViewGRN = (grn) => {
    setSelectedGRN(grn);
    setShowGRNModal(true);
  };

  const handlePaymentAdded = () => {
    // Refresh GRNs after payment is added
    fetchGRNs();
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partial': return 'Partial';
      default: return 'Unpaid';
    }
  };

  if (!isOpen || !supplier) return null;

  const filteredGRNs = filterStatus === "all"
    ? grns
    : grns.filter(g => g.paymentStatus === filterStatus);


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-2 border-b-2 border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {supplier.name} - GRN History
              </h3>
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

          {/* Filter Section */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filterStatus === "all"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-400"
                    }`}
                >
                  All ({grns.length})
                </button>
                <button
                  onClick={() => setFilterStatus("unpaid")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filterStatus === "unpaid"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-red-400"
                    }`}
                >
                  Unpaid ({grns.filter(g => g.paymentStatus === 'unpaid').length})
                </button>
                <button
                  onClick={() => setFilterStatus("partial")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filterStatus === "partial"
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400"
                    }`}
                >
                  Partial ({grns.filter(g => g.paymentStatus === 'partial').length})
                </button>
                <button
                  onClick={() => setFilterStatus("paid")}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${filterStatus === "paid"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400"
                    }`}
                >
                  Paid ({grns.filter(g => g.paymentStatus === 'paid').length})
                </button>
              </div>
            </div>
          </div>

          {/* GRNs List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading GRNs...</p>
              </div>
            ) : filteredGRNs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 font-medium text-lg">No GRNs found for this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGRNs.map((grn) => (
                  <div
                    key={grn.id}
                    className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-indigo-400 hover:shadow-lg transition cursor-pointer"
                    onClick={() => handleViewGRN(grn)}
                  >
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b-2 border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xs text-gray-600 font-medium">GRN Number</div>
                          <div className="text-lg font-bold text-indigo-900">{grn.grnNumber}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPaymentStatusColor(grn.paymentStatus)}`}>
                          {getPaymentStatusText(grn.paymentStatus)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="text-lg font-bold text-blue-700">
                            Rs {grn.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Paid:</span>
                          <span className="text-md font-semibold text-green-600">
                            Rs {grn.paidAmount.toFixed(2)}
                          </span>
                        </div>

                        {grn.paymentStatus !== 'paid' && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Credit:</span>
                            <span className="text-md font-semibold text-red-600">
                              Rs {(grn.totalAmount - grn.paidAmount).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Items:</span>
                            <span className="font-semibold text-gray-800">
                              {grn.items?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewGRN(grn);
                        }}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 bg-gray-50 p-2 flex justify-end">
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

      <ViewGRNModal
        isOpen={showGRNModal}
        onClose={() => {
          setShowGRNModal(false);
          setSelectedGRN(null);
          fetchGRNs(); // ✅ This already exists, good!
        }}
        grn={selectedGRN}
        onPaymentAdded={(updatedGRN) => {
          // ✅ ADD THIS: Update the selectedGRN with new data
          setSelectedGRN(updatedGRN);
          // ✅ Also refresh the list
          fetchGRNs();
        }}
      />
    </>
  );
}