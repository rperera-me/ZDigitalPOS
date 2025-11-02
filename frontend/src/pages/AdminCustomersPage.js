import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCustomers } from "../app/posSlice";

export default function AdminCustomersPage() {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.pos.customers);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
  }, [dispatch]);

  const addCustomer = () => {
    if (!name) {
      alert("Name is required");
      return;
    }
    api.post("/customer", { name, phone, creditBalance: 0 }).then(() => {
      setName("");
      setPhone("");
      api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
    });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Customer Management</h2>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Add Customer</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="border p-2 rounded flex-grow"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            className="border p-2 rounded flex-grow"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            onClick={addCustomer}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Add
          </button>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">Customers List</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Phone</th>
            <th className="border px-2 py-1">Credit Balance</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="border px-2 py-1">{c.id}</td>
              <td className="border px-2 py-1">{c.name}</td>
              <td className="border px-2 py-1">{c.phone || "-"}</td>
              <td className="border px-2 py-1">Rs {c.creditBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
