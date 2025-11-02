import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCategories, setProducts } from "../app/posSlice";

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.pos.products);
  const categories = useSelector((state) => state.pos.categories);

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    api.get("/category").then((res) => dispatch(setCategories(res.data)));
    api.get("/product").then((res) => dispatch(setProducts(res.data)));
  }, [dispatch]);

  const resetForm = () => {
    setName("");
    setBarcode("");
    setPriceRetail("");
    setPriceWholesale("");
    setStockQuantity("");
    setCategoryId("");
  };

  const addProduct = () => {
    if (!name || !barcode || !priceRetail || !categoryId) {
      alert("Please fill all required fields.");
      return;
    }
    api
      .post("/product", {
        name,
        barcode,
        priceRetail: parseFloat(priceRetail),
        priceWholesale: parseFloat(priceWholesale) || 0,
        stockQuantity: parseInt(stockQuantity) || 0,
        categoryId: parseInt(categoryId),
      })
      .then(() => {
        resetForm();
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
      })
      .catch(() => alert("Failed to add product."));
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Product Management</h2>

      <div className="mb-6 grid grid-cols-6 gap-2">
        <input
          type="text"
          className="border p-2 rounded col-span-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="border p-2 rounded col-span-1"
          placeholder="Barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />
        <input
          type="number"
          className="border p-2 rounded col-span-1"
          placeholder="Retail Price"
          value={priceRetail}
          onChange={(e) => setPriceRetail(e.target.value)}
          min="0"
        />
        <input
          type="number"
          className="border p-2 rounded col-span-1"
          placeholder="Wholesale Price"
          value={priceWholesale}
          onChange={(e) => setPriceWholesale(e.target.value)}
          min="0"
        />
        <input
          type="number"
          className="border p-2 rounded col-span-1"
          placeholder="Stock Qty"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          min="0"
        />
        <select
          className="border p-2 rounded col-span-1"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={addProduct}
          className="bg-green-600 text-white rounded px-4 py-2 col-span-1"
        >
          Add Product
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">Products List</h3>
      <table className="w-full border border-collapse table-auto text-left">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Barcode</th>
            <th className="border px-2 py-1">Retail Price</th>
            <th className="border px-2 py-1">Wholesale Price</th>
            <th className="border px-2 py-1">Stock Qty</th>
            <th className="border px-2 py-1">Category</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.id}</td>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">{p.barcode}</td>
              <td className="border px-2 py-1">Rs {p.priceRetail.toFixed(2)}</td>
              <td className="border px-2 py-1">Rs {p.priceWholesale.toFixed(2)}</td>
              <td className="border px-2 py-1">{p.stockQuantity}</td>
              <td className="border px-2 py-1">{p.categoryName || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
