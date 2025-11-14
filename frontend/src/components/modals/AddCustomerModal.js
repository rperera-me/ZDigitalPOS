import React, { useState } from "react";

export default function AddCustomerModal({ 
  isOpen, 
  onClose, 
  onCustomerAdded, 
  customerType = "loyalty",
  allowTypeSelection = false // ✅ NEW PROP - true for admin, false for cashier
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [creditBalance, setCreditBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  
  // ✅ NEW STATE for type selection (only used in admin)
  const [selectedType, setSelectedType] = useState(customerType);

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setNicNumber("");
    setCreditBalance("0");
    setSelectedType(customerType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }

    setLoading(true);

    // ✅ Use selectedType if type selection allowed, otherwise use prop
    const finalType = allowTypeSelection ? selectedType : customerType;

    const customerData = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      nicNumber: nicNumber.trim() || null,
      type: finalType,
      creditBalance: parseFloat(creditBalance) || 0,
      loyaltyPoints: 0,
    };

    try {
      const api = require("../../api/axios").default;
      const response = await api.post("/customer", customerData);
      
      alert(`${finalType === 'loyalty' ? 'Loyalty' : 'Wholesale'} customer added successfully!`);
      resetForm();
      
      if (onCustomerAdded) {
        onCustomerAdded(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to add customer:", error);
      alert("Failed to add customer: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            {/* ✅ Dynamic header based on whether type selection is allowed */}
            {allowTypeSelection 
              ? "Add New Customer"
              : `Add New ${selectedType === 'loyalty' ? 'Loyalty' : 'Wholesale'} Customer`
            }
          </h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700 transition"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ CONDITIONAL TYPE SELECTOR - Only show in admin */}
          {allowTypeSelection && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                disabled={loading}
              >
                <option value="loyalty">Loyalty Customer</option>
                <option value="wholesale">Wholesale Customer</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter customer name"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter phone number"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">NIC Number</label>
              <input
                type="text"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter NIC number"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Initial Credit Balance
              </label>
              <input
                type="number"
                value={creditBalance}
                onChange={(e) => setCreditBalance(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter address"
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Info Box - Updated to show selected type */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  Customer Type: {selectedType === 'loyalty' ? 'Loyalty' : 'Wholesale'}
                </p>
                {selectedType === 'loyalty' && (
                  <p>Loyalty customers earn 1 point per Rs.100 spent and can accumulate credit.</p>
                )}
                {selectedType === 'wholesale' && (
                  <p>Wholesale customers get special pricing and can purchase on credit.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Customer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

