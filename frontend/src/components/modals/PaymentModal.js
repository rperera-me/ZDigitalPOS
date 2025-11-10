import React from "react";

export default function PaymentModal({
  isOpen,
  onClose,
  onPay,
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  balance,
  getTotalAmount,
  customers,
  currentCustomer,
  setCustomer,
}) {
  if (!isOpen) return null;

  const handlePay = () => {
    if (paymentMethod === "Cash" && balance < 0) {
      alert("Insufficient cash.");
      return;
    }
    onPay();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Total Amount Display */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-blue-600">
                Rs {getTotalAmount().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Cash Payment Fields */}
          {paymentMethod === "Cash" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Given <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Enter amount given"
                  autoFocus
                />
              </div>

              {/* Balance Display */}
              <div className={`p-4 rounded-lg border-2 ${
                balance >= 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Balance (Change):</span>
                  <span className={`text-2xl font-bold ${
                    balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Rs {balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Customer Selection for Credit/Card */}
          {(paymentMethod === "Credit" || paymentMethod === "Card") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer {paymentMethod === "Credit" && <span className="text-red-500">*</span>}
              </label>
              <select
                value={currentCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find((c) => c.id === parseInt(e.target.value));
                  setCustomer(customer || null);
                }}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                  </option>
                ))}
              </select>

              {/* Selected Customer Info */}
              {currentCustomer && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-semibold">{currentCustomer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold">{currentCustomer.phone || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Balance:</span>
                      <span className="font-semibold text-blue-600">
                        Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={
                (paymentMethod === "Cash" && balance < 0) ||
                (paymentMethod === "Credit" && !currentCustomer)
              }
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete Payment
            </button>
          </div>

          {/* Payment Instructions */}
          {paymentMethod === "Cash" && cashGiven && balance < 0 && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">
                  Insufficient cash. Please enter at least Rs {getTotalAmount().toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "Credit" && !currentCustomer && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-800">
                  Please select a customer for credit payment
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}