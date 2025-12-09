import React, { useState } from "react";

export default function BillReprintModal({ isOpen, onClose, onReprintSale }) {
  const [searchType, setSearchType] = useState("invoice"); // invoice or date
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-focus invoice input when modal opens
  React.useEffect(() => {
    if (isOpen && searchType === "invoice") {
      setTimeout(() => {
        const input = document.querySelector('input[type="text"]');
        if (input) input.focus();
      }, 100);
    }
  }, [isOpen, searchType]);

  const handleSearch = async () => {
    setError("");
    setSelectedSale(null);
    
    if (searchType === "invoice" && !invoiceNumber.trim()) {
      setError("Please enter an invoice number");
      return;
    }

    setLoading(true);
    try {
      const api = require("../../api/axios").default;
      
      if (searchType === "invoice") {
        // Search by invoice number (sale ID)
        const response = await api.get(`/sale/${invoiceNumber}`);
        if (response.data) {
          setSales([response.data]);
          setSelectedSale(response.data);
        } else {
          setError("Invoice not found");
          setSales([]);
        }
      } else {
        // Search by date
        const startDate = new Date(searchDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(searchDate);
        endDate.setHours(23, 59, 59, 999);
        
        const response = await api.get("/sale/daterange", {
          params: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        });
        
        const completedSales = response.data.filter(s => !s.isHeld && !s.isVoided);
        
        if (completedSales.length === 0) {
          setError("No sales found for this date");
          setSales([]);
        } else {
          setSales(completedSales);
          // Auto-select if only one sale
          if (completedSales.length === 1) {
            setSelectedSale(completedSales[0]);
          }
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.response?.status === 404 
        ? "Invoice not found" 
        : "Error searching for sale");
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = () => {
    if (!selectedSale) {
      setError("Please select a sale to reprint");
      return;
    }
    onReprintSale(selectedSale);
    handleClose();
  };

  const handleClose = () => {
    setInvoiceNumber("");
    setSearchDate(new Date().toISOString().split('T')[0]);
    setSales([]);
    setSelectedSale(null);
    setError("");
    setSearchType("invoice");
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Bill Reprint
            </h3>
            <p className="text-purple-100 text-sm mt-1">Search and reprint previous sales</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Section */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchType("invoice")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                searchType === "invoice"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Search by Invoice #
              </div>
            </button>
            <button
              onClick={() => setSearchType("date")}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                searchType === "date"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Search by Date
              </div>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-3">
            {searchType === "invoice" ? (
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                placeholder="Enter invoice number (e.g., 12345)"
                autoFocus
              />
            ) : (
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            )}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {sales.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 font-medium text-lg">Enter search criteria to find sales</p>
              <p className="text-gray-400 text-sm mt-2">Search by invoice number or select a date</p>
            </div>
          ) : selectedSale ? (
            // Detailed Sale View
            <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm opacity-80">Invoice Number</div>
                    <div className="text-2xl font-bold">#{selectedSale.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-80">Date & Time</div>
                    <div className="font-semibold">{new Date(selectedSale.saleDate).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Sale Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs text-blue-700 font-medium mb-1">Total Amount</div>
                    <div className="text-xl font-bold text-blue-900">Rs {selectedSale.totalAmount.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs text-green-700 font-medium mb-1">Payment Type</div>
                    <div className="text-lg font-bold text-green-900">{selectedSale.paymentType}</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs text-purple-700 font-medium mb-1">Items</div>
                    <div className="text-xl font-bold text-purple-900">{selectedSale.saleItems?.length || 0}</div>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedSale.customer && (
                  <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="font-semibold text-orange-900 mb-2">Customer Information</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSale.customer.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-semibold text-gray-900">{selectedSale.customer.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-semibold text-gray-900 capitalize">{selectedSale.customer.type}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b-2 border-gray-200">
                    <h4 className="font-semibold text-gray-800">Items Purchased</h4>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700">Product</th>
                        <th className="text-center p-3 font-semibold text-gray-700">Qty</th>
                        <th className="text-right p-3 font-semibold text-gray-700">Price</th>
                        <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.saleItems?.map((item, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{item.productName || item.name}</td>
                          <td className="text-center p-3">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="text-right p-3 text-gray-700">Rs {item.price.toFixed(2)}</td>
                          <td className="text-right p-3 font-semibold text-gray-900">
                            Rs {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // Sales List (for date search with multiple results)
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-800">Found {sales.length} sales</h4>
                <p className="text-sm text-gray-600">Click on a sale to view details</p>
              </div>
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg text-gray-800">Invoice #{sale.id}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(sale.saleDate).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        Rs {(sale.finalAmount || sale.totalAmount).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {sale.saleItems?.length || 0} items • {sale.paymentType}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 bg-gray-50 p-4 flex justify-between gap-3">
          {selectedSale && sales.length > 1 && (
            <button
              onClick={() => setSelectedSale(null)}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to List
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
            {selectedSale && (
              <button
                onClick={handleReprint}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold flex items-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Reprint Bill
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}