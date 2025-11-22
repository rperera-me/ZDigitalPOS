import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCustomers } from "../app/posSlice";
import { AddCustomerModal, ViewCustomerPurchasesModal } from "../components/modals";

export default function AdminCustomersPage() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.pos.customers);

  const [activeTab, setActiveTab] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);

  // Edit form fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNicNumber, setEditNicNumber] = useState("");
  const [editType, setEditType] = useState("loyalty");
  const [editCreditBalance, setEditCreditBalance] = useState("0");
  const [editLoyaltyPoints, setEditLoyaltyPoints] = useState("0");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone || "");
    setEditAddress(customer.address || "");
    setEditNicNumber(customer.nicNumber || "");
    setEditType(customer.type);
    setEditCreditBalance(customer.creditBalance.toString());
    setEditLoyaltyPoints(customer.loyaltyPoints.toString());
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!editName.trim()) {
      alert("Customer name is required");
      return;
    }

    const customerData = {
      id: editingCustomer.id,
      name: editName.trim(),
      phone: editPhone.trim() || null,
      address: editAddress.trim() || null,
      nicNumber: editNicNumber.trim() || null,
      type: editType,
      creditBalance: parseFloat(editCreditBalance) || 0,
      loyaltyPoints: editType === "loyalty" ? parseInt(editLoyaltyPoints) || 0 : 0,
    };

    try {
      await api.put(`/customer/${editingCustomer.id}`, customerData);
      alert("Customer updated successfully!");
      setShowEditModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Failed to update customer: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = (customer) => {
    if (customer.creditBalance > 0) {
      alert(`Cannot delete customer with outstanding credit balance of Rs ${customer.creditBalance.toFixed(2)}`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      api.delete(`/customer/${customer.id}`)
        .then(() => {
          fetchCustomers();
          alert("Customer deleted successfully!");
        })
        .catch((error) => {
          alert("Failed to delete customer: " + (error.response?.data?.message || error.message));
        });
    }
  };

  const handleViewPurchases = (customer) => {
    setViewingCustomer(customer);
    setShowPurchasesModal(true);
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
            onClick={() => setShowAddModal(true)}
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
            <TabButton
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              count={customers.length}
              label="All Customers"
              color="blue"
            />
            <TabButton
              active={activeTab === "loyalty"}
              onClick={() => setActiveTab("loyalty")}
              count={customers.filter(c => c.type === "loyalty").length}
              label="Loyalty"
              color="purple"
            />
            <TabButton
              active={activeTab === "wholesale"}
              onClick={() => setActiveTab("wholesale")}
              count={customers.filter(c => c.type === "wholesale").length}
              label="Wholesale"
              color="blue"
            />
          </div>
        </div>

        {/* Customer Content */}
        <div className="p-6">
          {activeTab === "all" ? (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewPurchases={handleViewPurchases}
              getTypeColor={getTypeColor}
            />
          ) : (
            <CustomerCards
              customers={filteredCustomers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewPurchases={handleViewPurchases}
              getTypeColor={getTypeColor}
            />
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerAdded={fetchCustomers}
        allowTypeSelection={true}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        editNicNumber={editNicNumber}
        setEditNicNumber={setEditNicNumber}
        editType={editType}
        setEditType={setEditType}
        editCreditBalance={editCreditBalance}
        setEditCreditBalance={setEditCreditBalance}
        editLoyaltyPoints={editLoyaltyPoints}
        setEditLoyaltyPoints={setEditLoyaltyPoints}
        onSubmit={handleUpdateSubmit}
      />

      {/* View Purchases Modal */}
      <ViewCustomerPurchasesModal
        isOpen={showPurchasesModal}
        onClose={() => {
          setShowPurchasesModal(false);
          setViewingCustomer(null);
        }}
        customer={viewingCustomer}
      />
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, count, label, color }) {
  const colorClass = color === "purple" ? "purple" : "blue";
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-4 font-semibold transition ${active
          ? `bg-${colorClass}-50 text-${colorClass}-700 border-b-2 border-${colorClass}-500`
          : "text-gray-600 hover:bg-gray-50"
        }`}
    >
      {label} ({count})
    </button>
  );
}

// Customer Table Component
function CustomerTable({ customers, onEdit, onDelete, onViewPurchases, getTypeColor }) {
  if (customers.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-700">Phone</th>
            <th className="p-3 text-center text-sm font-semibold text-gray-700">Type</th>
            <th className="p-3 text-right text-sm font-semibold text-gray-700">Credit</th>
            <th className="p-3 text-right text-sm font-semibold text-gray-700">Points</th>
            <th className="p-3 text-center text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b hover:bg-gray-50">
              <td className="p-3">
                <div className="font-semibold text-gray-800">{customer.name}</div>
                {customer.nicNumber && (
                  <div className="text-xs text-gray-500">NIC: {customer.nicNumber}</div>
                )}
              </td>
              <td className="p-3 text-gray-600">{customer.phone || "-"}</td>
              <td className="p-3 text-center">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(customer.type)}`}>
                  {customer.type}
                </span>
              </td>
              <td className="p-3 text-right">
                <span className={`font-bold ${customer.creditBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {customer.creditBalance.toFixed(2)}
                </span>
              </td>
              <td className="p-3 text-right">
                <span className="font-bold text-purple-600">
                  {customer.type === "loyalty" ? customer.loyaltyPoints || 0 : "-"}
                </span>
              </td>
              <td className="p-3 text-center">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onViewPurchases(customer)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs font-semibold"
                    title="View Purchases"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs font-semibold"
                    disabled={customer.creditBalance > 0}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Customer Cards Component (for Loyalty/Wholesale tabs)
function CustomerCards({ customers, onEdit, onDelete, onViewPurchases, getTypeColor }) {
  if (customers.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.map((customer) => (
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
          </div>

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

          <div className="flex gap-2">
            <button
              onClick={() => onViewPurchases(customer)}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
            >
              View
            </button>
            <button
              onClick={() => onEdit(customer)}
              className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition text-sm font-semibold"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(customer)}
              className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={customer.creditBalance > 0}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <p className="text-gray-500 mb-2">No customers found</p>
    </div>
  );
}

// Edit Modal Component
function EditCustomerModal({
  isOpen, onClose, customer, editName, setEditName, editPhone, setEditPhone,
  editAddress, setEditAddress, editNicNumber, setEditNicNumber, editType, setEditType,
  editCreditBalance, setEditCreditBalance, editLoyaltyPoints, setEditLoyaltyPoints, onSubmit
}) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Edit Customer</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NIC Number</label>
              <input
                type="text"
                value={editNicNumber}
                onChange={(e) => setEditNicNumber(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
              >
                <option value="loyalty">Loyalty</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credit Balance</label>
              <input
                type="number"
                value={editCreditBalance}
                onChange={(e) => setEditCreditBalance(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
                step="0.01"
              />
            </div>
            {editType === "loyalty" && (
              <div>
                <label className="block text-sm font-medium mb-1">Loyalty Points</label>
                <input
                  type="number"
                  value={editLoyaltyPoints}
                  onChange={(e) => setEditLoyaltyPoints(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2"
                />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-2"
                rows="3"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}