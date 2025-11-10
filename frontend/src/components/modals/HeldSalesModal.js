import React from "react";

export default function HeldSalesModal({ isOpen, onClose, holdSales, onResumeSale }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Held Sales
            <span className="ml-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {holdSales.length} {holdSales.length === 1 ? 'sale' : 'sales'}
            </span>
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

        {holdSales.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 mb-2 text-lg font-medium">No held sales</p>
            <p className="text-sm text-gray-400">Sales that are put on hold will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holdSales.map((sale) => {
              const totalItems = sale.saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

              return (
                <div
                  key={sale.id}
                  onClick={() => onResumeSale(sale)}
                  className="border-2 border-yellow-400 rounded-lg p-4 hover:bg-yellow-50 transition cursor-pointer hover:shadow-lg transform hover:scale-[1.02] active:scale-100"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Sale ID</div>
                      <div className="text-lg font-bold text-gray-800">#{sale.id}</div>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      On Hold
                    </div>
                  </div>

                  {/* Sale Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Time:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {new Date(sale.saleDate).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Items:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {sale.saleItems?.length || 0} items
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Qty:
                      </span>
                      <span className="font-semibold text-gray-800">
                        {totalItems} units
                      </span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="pt-3 border-t border-yellow-200 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600">
                        Rs {sale.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="pt-3 border-t border-yellow-200">
                    <div className="text-xs text-gray-500 mb-2 font-medium">Items Preview:</div>
                    <div className="space-y-1">
                      {sale.saleItems?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs bg-gray-50 rounded p-1">
                          <span className="truncate flex-1 text-gray-700">
                            {item.productName}
                          </span>
                          <span className="font-semibold ml-2 text-blue-600">×{item.quantity}</span>
                        </div>
                      ))}
                      {sale.saleItems?.length > 3 && (
                        <div className="text-xs text-gray-500 italic text-center pt-1">
                          +{sale.saleItems.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resume Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeSale(sale);
                    }}
                    className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resume Sale
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        {holdSales.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                Click on any sale card to resume it. The items will be loaded into your current cart.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}