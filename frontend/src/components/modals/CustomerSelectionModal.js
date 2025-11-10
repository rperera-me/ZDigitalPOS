import React from "react";

export default function CustomerSelectionModal({
  isOpen,
  onClose,
  customerType,
  customers,
  currentCustomer,
  setCustomer,
  navigate,
}) {
  if (!isOpen) return null;

  const handleClearCustomer = () => {
    setCustomer(null);
    onClose();
  };

  const handleAddNewCustomer = () => {
    onClose();
    navigate(`/customers/add?type=${customerType}`);
  };

  // Filter customers by type
  const filteredCustomers = customers.filter((c) => c.type === customerType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Manage {customerType === "loyalty" ? "Loyalty" : customerType === "wholesale" ? "Wholesale" : ""} Customer
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

        {customerType === "walk-in" ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-gray-600 mb-4 font-medium">Walk-in customers don't require selection.</p>
            <p className="text-sm text-gray-500">
              Change customer type to Loyalty or Wholesale to select a customer.
            </p>
          </div>
        ) : (
          <>
            {/* Customer Selection Dropdown */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Select {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer:
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
                {filteredCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} - {cust.phone} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                  </option>
                ))}
              </select>

              {filteredCustomers.length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No {customerType} customers found. Add one below.
                  </p>
                </div>
              )}
            </div>

            {/* Selected Customer Info */}
            {currentCustomer && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Selected Customer
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Name:</span>
                    <span className="font-semibold text-gray-900">{currentCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Phone:</span>
                    <span className="font-semibold text-gray-900">{currentCustomer.phone}</span>
                  </div>
                  {currentCustomer.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Email:</span>
                      <span className="font-semibold text-gray-900">{currentCustomer.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-blue-300">
                    <span className="text-gray-700 font-medium">Credit Balance:</span>
                    <span className="font-bold text-blue-600">
                      Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {customerType === "loyalty" && currentCustomer.loyaltyPoints !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Loyalty Points:</span>
                      <span className="font-bold text-purple-600">
                        {currentCustomer.loyaltyPoints || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleClearCustomer}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </button>
            </div>

            {/* Add New Customer Section */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleAddNewCustomer}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}