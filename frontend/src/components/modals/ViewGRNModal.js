import React from "react";

export default function ViewGRNModal({ isOpen, onClose, grn }) {
  if (!isOpen || !grn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              GRN Details
            </h3>
            <p className="text-sm text-gray-600 mt-1">Read-only view • GRNs cannot be modified after creation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* GRN Information Card */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">GRN Number</div>
              <div className="text-xl font-bold text-blue-900">{grn.grnNumber}</div>
            </div>
            
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">Received Date</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date(grn.receivedDate).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-600">
                {new Date(grn.receivedDate).toLocaleTimeString()}
              </div>
            </div>
            
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">Supplier</div>
              <div className="text-lg font-semibold text-gray-800">{grn.supplierName}</div>
            </div>
            
            <div>
              <div className="text-xs text-blue-700 font-medium mb-1">Received By</div>
              <div className="text-lg font-semibold text-gray-800">{grn.receivedByName}</div>
            </div>
          </div>

          {grn.notes && (
            <div className="mt-4 pt-4 border-t border-blue-300">
              <div className="text-xs text-blue-700 font-medium mb-1">Notes</div>
              <div className="text-sm text-gray-700 bg-white rounded p-2">{grn.notes}</div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-200">
            <h4 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Items Received ({grn.items?.length || 0})
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">Product</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">Batch Number</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">Quantity</th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">Cost Price</th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">Product Price (MRP)</th>
                  <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">Total Cost</th>
                  <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">Dates</th>
                </tr>
              </thead>
              <tbody>
                {grn.items?.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{item.productName}</div>
                    </td>
                    <td className="p-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {item.batchNumber}
                      </code>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-sm">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-semibold text-orange-600">
                        Rs {item.costPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-semibold text-yellow-600">
                        Rs {item.productPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-bold text-green-600 text-lg">
                        Rs {(item.costPrice * item.quantity).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-gray-600">
                        {item.manufactureDate && (
                          <div className="mb-1">
                            <span className="font-medium">Mfg:</span> {new Date(item.manufactureDate).toLocaleDateString()}
                          </div>
                        )}
                        {item.expiryDate && (
                          <div>
                            <span className="font-medium">Exp:</span> {new Date(item.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                        {!item.manufactureDate && !item.expiryDate && (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {/* Total Row */}
              <tfoot className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-300">
                <tr>
                  <td colSpan="5" className="p-4 text-right">
                    <span className="text-lg font-bold text-gray-800">Total GRN Amount:</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-2xl font-bold text-blue-600">
                      Rs {grn.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 text-center">
            <div className="text-purple-600 text-sm font-medium mb-1">Total Items</div>
            <div className="text-3xl font-bold text-purple-700">{grn.items?.length || 0}</div>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-600 text-sm font-medium mb-1">Total Units</div>
            <div className="text-3xl font-bold text-green-700">
              {grn.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
            </div>
          </div>
          
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
            <div className="text-orange-600 text-sm font-medium mb-1">Average Cost/Unit</div>
            <div className="text-3xl font-bold text-orange-700">
              Rs {grn.items?.length > 0 
                ? (grn.totalAmount / grn.items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)
                : '0.00'
              }
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Information:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>GRN records are <strong>immutable</strong> and cannot be edited after creation</li>
                <li>All items in this GRN have been added to inventory</li>
                <li>Product batches have been created with the specified pricing</li>
                <li>Stock quantities have been updated accordingly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold flex items-center gap-2"
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