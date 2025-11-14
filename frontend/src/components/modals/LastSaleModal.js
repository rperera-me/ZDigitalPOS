import React from "react";

export default function LastSaleModal({
  isOpen,
  onClose,
  lastSale,
  onPrintReceipt,
  i18n,
  storeSetting,
}) {
  if (!isOpen || !lastSale) return null;

  const handlePrintReceipt = () => {
    i18n.changeLanguage(storeSetting.receiptLanguage || "en");
    onPrintReceipt(lastSale);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Last Sale Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sale Information */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Sale ID</p>
              <p className="font-bold text-lg text-blue-600">#{lastSale.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Date & Time</p>
              <p className="font-semibold text-gray-800">
                {new Date(lastSale.saleDate || lastSale.date).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Payment Type</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${lastSale.paymentType === "Cash" ? "bg-green-100 text-green-700" :
                  lastSale.paymentType === "Card" ? "bg-purple-100 text-purple-700" :
                    "bg-orange-100 text-orange-700"
                }`}>
                {lastSale.paymentType}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Customer</p>
              <p className="font-semibold text-gray-800">
                {lastSale.customer?.name || "Walk-in"}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="font-semibold mb-3 text-lg text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Items Purchased ({lastSale.saleItems?.length || 0})
            </h4>
            <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Product</th>
                    <th className="text-center p-3 font-semibold text-gray-700">Qty</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Price</th>
                    <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastSale.saleItems?.map((item, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-800">
                        {item.productName || item.name}
                      </td>
                      <td className="text-center p-3">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="text-right p-3 text-gray-700">
                        Rs {item.price.toFixed(2)}
                      </td>
                      <td className="text-right p-3 font-semibold text-gray-900">
                        Rs {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-green-300">
              <span className="font-semibold text-gray-700 text-lg">Total Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                Rs {lastSale.totalAmount.toFixed(2)}
              </span>
            </div>
            {lastSale.paymentType === "Cash" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Amount Paid:</span>
                  <span className="font-semibold text-gray-800">
                    Rs {lastSale.amountPaid?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Change Given:</span>
                  <span className="font-semibold text-gray-800">
                    Rs {lastSale.change?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrintReceipt}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}