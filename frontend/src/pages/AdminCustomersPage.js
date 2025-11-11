import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCustomers } from "../app/posSlice";

export default function AdminCustomersPage() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.pos.customers);

  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [type, setType] = useState("walk-in");
  const [creditBalance, setCreditBalance] = useState("0");
  const [loyaltyPoints, setLoyaltyPoints] = useState("0");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setNicNumber("");
    setType("walk-in");
    setCreditBalance("0");
    setLoyaltyPoints("0");
    setEditingCustomer(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Customer name is required");
      return;
    }

    const customerData = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      nicNumber: nicNumber.trim() || null,
      type,
      creditBalance: parseFloat(creditBalance) || 0,
      loyaltyPoints: type === "loyalty" ? parseInt(loyaltyPoints) || 0 : 0,
    };

    if (editingCustomer) {
      api.put(`/customer/${editingCustomer.id}`, { ...customerData, id: editingCustomer.id })
        .then(() => {
          setShowModal(false);
          resetForm();
          fetchCustomers();
          alert("Customer updated successfully!");
        })
        .catch(() => alert("Failed to update customer"));
    } else {
      api.post("/customer", customerData)
        .then(() => {
          setShowModal(false);
          resetForm();
          fetchCustomers();
          alert("Customer added successfully!");
        })
        .catch(() => alert("Failed to add customer"));
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || "");
    setAddress(customer.address || "");
    setNicNumber(customer.nicNumber || "");
    setType(customer.type);
    setCreditBalance(customer.creditBalance.toString());
    setLoyaltyPoints(customer.loyaltyPoints.toString());
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      api.delete(`/customer/${id}`)
        .then(() => {
          fetchCustomers();
          alert("Customer deleted successfully!");
        })
        .catch(() => alert("Failed to delete customer"));
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const getTypeColor = (type) => {
    switch (type) {
      case "loyalty": return "bg-purple-100 text-purple-700";
      case "wholesale": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Customer Management</h2>
            <p className="text-gray-600">Manage your customer database</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Customer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "all"
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              All Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab("loyalty")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "loyalty"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Loyalty ({customers.filter(c => c.type === "loyalty").length})
            </button>
            <button
              onClick={() => setActiveTab("wholesale")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "wholesale"
                  ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Wholesale ({customers.filter(c => c.type === "wholesale").length})
            </button>
            <button
              onClick={() => setActiveTab("walk-in")}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === "walk-in"
                  ? "bg-gray-50 text-gray-700 border-b-2 border-gray-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Walk-in ({customers.filter(c => c.type === "walk-in").length})
            </button>
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="p-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 mb-2">No customers found</p>
              <p className="text-sm text-gray-400">Add your first customer to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-lg font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">{customer.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(customer.type)}`}>
                          {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{customer.address}</span>
                      </div>
                    )}
                    {customer.nicNumber && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        NIC: {customer.nicNumber}
                      </div>
                    )}
                  </div>

                  {/* Financial Info */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">Credit Balance</span>
                      <span className={`font-bold ${customer.creditBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Rs {customer.creditBalance.toFixed(2)}
                      </span>
                    </div>
                    {customer.type === "loyalty" && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Loyalty Points</span>
                        <span className="font-bold text-purple-600">{customer.loyaltyPoints || 0} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Customer Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="walk-in">Walk-in</option>
                    <option value="loyalty">Loyalty</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    placeholder="Enter phone number"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Credit Balance</label>
                  <input
                    type="number"
                    value={creditBalance}
                    onChange={(e) => setCreditBalance(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                {type === "loyalty" && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Loyalty Points</label>
                    <input
                      type="number"
                      value={loyaltyPoints}
                      onChange={(e) => setLoyaltyPoints(e.target.value)}
                      className="w-full border-2 border-purple-300 rounded-lg p-2 focus:outline-none focus:border-purple-500 bg-purple-50"
                      placeholder="0"
                      min="0"
                      disabled={!editingCustomer}
                    />
                    {!editingCustomer && (
                      <p className="text-xs text-gray-500 mt-1">Points are earned through purchases</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}