import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setSuppliers } from "../app/posSlice";

export default function AdminSuppliersPage() {
  const dispatch = useDispatch();
  const suppliers = useSelector((state) => state.pos.suppliers);

  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = () => {
    api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
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

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Supplier Management</h2>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Supplier" : "Add New Supplier"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded p-2"
              rows="3"
            />
          </div>

          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {editingId ? "Update" : "Add"} Supplier
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Suppliers List</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Contact Person</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="border p-2">{supplier.name}</td>
                <td className="border p-2">{supplier.contactPerson || "-"}</td>
                <td className="border p-2">{supplier.phone || "-"}</td>
                <td className="border p-2">{supplier.email || "-"}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}