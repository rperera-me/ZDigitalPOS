import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setSuppliers } from "../app/posSlice";
import { SupplierGRNsModal } from "../components/modals";

export default function AdminSuppliersPage() {
  const dispatch = useDispatch();
  const suppliers = useSelector((state) => state.pos.suppliers);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [suppliersDetails, setSuppliersDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showGRNsModal, setShowGRNsModal] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (suppliers.length > 0) {
      fetchAllSuppliersDetails();
    }
  }, [suppliers]);

  const fetchSuppliers = () => {
    api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
  };

  const fetchAllSuppliersDetails = async () => {
    setLoadingDetails(true);
    const details = {};

    try {
      await Promise.all(
        suppliers.map(async (supplier) => {
          try {
            const response = await api.get(`/supplier/${supplier.id}/details`);
            details[supplier.id] = response.data;
            console.log(`Supplier ${supplier.id} details:`, response.data);
          } catch (error) {
            console.error(`Failed to fetch details for supplier ${supplier.id}:`, error);
            details[supplier.id] = {
              totalCreditAmount: 0,
              lastVisitedDate: null,
              totalGRNs: 0,
              unpaidGRNs: 0,
              partiallyPaidGRNs: 0
            };
          }
        })
      );
      setSuppliersDetails(details);
      console.log("All supplier details loaded:", details);
    } finally {
      setLoadingDetails(false);
    }
  };

  const resetForm = () => {
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const supplierData = {
      name,
      contactPerson,
      phone,
      email,
      address,
    };

    if (editingId) {
      api.put(`/supplier/${editingId}`, { ...supplierData, id: editingId, isActive: true })
        .then(() => {
          resetForm();
          fetchSuppliers();
        });
    } else {
      api.post("/supplier", supplierData)
        .then(() => {
          resetForm();
          fetchSuppliers();
        });
    }
  };

  const handleEdit = (supplier) => {
    setName(supplier.name);
    setContactPerson(supplier.contactPerson || "");
    setPhone(supplier.phone || "");
    setEmail(supplier.email || "");
    setAddress(supplier.address || "");
    setEditingId(supplier.id);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      api.delete(`/supplier/${id}`).then(() => fetchSuppliers());
    }
  };

  const handleViewGRNs = (supplier) => {
    setSelectedSupplier(supplier);
    setShowGRNsModal(true);
  };

  useEffect(() => {
    const handleRefresh = () => {
      console.log("Refreshing suppliers after GRN payment update");
      fetchSuppliers();
      if (suppliers.length > 0) {
        fetchAllSuppliersDetails();
      }
    };

    window.addEventListener('refreshSuppliers', handleRefresh);

    return () => {
      window.removeEventListener('refreshSuppliers', handleRefresh);
    };
  }, [suppliers.length]);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Supplier Management</h2>
        <p className="text-gray-600">Manage your suppliers and track credit details</p>
      </div>

      {/* Add/Edit Supplier Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-gray-200">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {editingId ? "Edit Supplier" : "Add New Supplier"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              required
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Contact person name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Email address"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              rows="3"
              placeholder="Full address"
            />
          </div>

          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-md"
            >
              {editingId ? "Update" : "Add"} Supplier
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Suppliers List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Suppliers List ({suppliers.length})
        </h3>

        {loadingDetails && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Loading credit details...</span>
          </div>
        )}

        <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Supplier Details</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Contact Info</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">GRN Stats</th>
                <th className="p-3 text-right text-sm font-semibold text-gray-700">Credit Details</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Last Visit</th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => {
                const details = suppliersDetails[supplier.id] || {};
                const hasCredit = details.totalCreditAmount > 0;

                return (
                  <tr key={supplier.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 text-lg">{supplier.name}</div>
                      {supplier.contactPerson && (
                        <div className="text-sm text-gray-600 mt-1">
                          Contact: {supplier.contactPerson}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="text-sm text-gray-700 flex items-center justify-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="text-sm text-gray-700 flex items-center justify-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {supplier.email}
                          </div>
                        )}
                        {!supplier.phone && !supplier.email && (
                          <span className="text-xs text-gray-400">No contact info</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-semibold text-indigo-600">{details.totalGRNs || 0}</span>
                          <span className="text-gray-600 text-xs ml-1">Total GRNs</span>
                        </div>
                        {details.unpaidGRNs > 0 && (
                          <div className="text-xs text-red-600 font-semibold">
                            {details.unpaidGRNs} Unpaid
                          </div>
                        )}
                        {details.partiallyPaidGRNs > 0 && (
                          <div className="text-xs text-orange-600 font-semibold">
                            {details.partiallyPaidGRNs} Partial
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      {hasCredit ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 inline-block">
                          <div className="text-xs text-red-700 font-medium">Credit Outstanding</div>
                          <div className="text-xl font-bold text-red-600">
                            Rs {details.totalCreditAmount.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No credit</div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {details.lastVisitedDate ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            {new Date(details.lastVisitedDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(details.lastVisitedDate).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Never</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          onClick={() => handleViewGRNs(supplier)}
                          className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 text-sm font-semibold flex items-center gap-1 shadow-md"
                          title="View GRNs"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View GRNs
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-sm font-semibold flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm font-semibold flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier GRNs Modal */}
      <SupplierGRNsModal
        isOpen={showGRNsModal}
        onClose={() => {
          setShowGRNsModal(false);
          setSelectedSupplier(null);
          fetchAllSuppliersDetails(); // Refresh details when modal closes
        }}
        supplier={selectedSupplier}
      />
    </div>
  );
}