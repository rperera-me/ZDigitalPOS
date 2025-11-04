import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCategories, setProducts, setSuppliers } from "../app/posSlice";

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.pos.products);
  const categories = useSelector((state) => state.pos.categories);
  const suppliers = useSelector((state) => state.pos.suppliers);

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [priceRetail, setPriceRetail] = useState("");
  const [priceWholesale, setPriceWholesale] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState(""); // New

  // Batch fields (optional for initial product creation)
  const [batchNumber, setBatchNumber] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [viewBatchesProductId, setViewBatchesProductId] = useState(null);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api.get("/category").then((res) => dispatch(setCategories(res.data)));
    api.get("/product").then((res) => dispatch(setProducts(res.data)));
    api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
  }, [dispatch]);

  const resetForm = () => {
    setName("");
    setBarcode("");
    setPriceRetail("");
    setPriceWholesale("");
    setStockQuantity("");
    setCategoryId("");
    setSupplierId("");
    setBatchNumber("");
    setCostPrice("");
    setManufactureDate("");
    setExpiryDate("");
  };

  const addProduct = () => {
    if (!name || !barcode || !priceRetail || !categoryId) {
      alert("Please fill all required fields.");
      return;
    }

    const productData = {
      name,
      barcode,
      priceRetail: parseFloat(priceRetail),
      priceWholesale: parseFloat(priceWholesale) || 0,
      stockQuantity: parseInt(stockQuantity) || 0,
      categoryId: parseInt(categoryId),
      defaultSupplierId: supplierId ? parseInt(supplierId) : null,
      batchNumber: batchNumber || null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      productPrice: priceRetail ? parseFloat(priceRetail) : null,
      sellingPrice: priceRetail ? parseFloat(priceRetail) : null,
      manufactureDate: manufactureDate || null,
      expiryDate: expiryDate || null,
    };

    api
      .post("/product", productData)
      .then(() => {
        resetForm();
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
        alert("Product added successfully!");
      })
      .catch(() => alert("Failed to add product."));
  };

  const viewBatches = (productId) => {
    api.get(`/product/${productId}/batches`)
      .then((res) => {
        setBatches(res.data);
        setViewBatchesProductId(productId);
      })
      .catch(() => alert("Failed to load batches"));
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Product Management</h2>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Add New Product</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Barcode *</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              className="w-full border p-2 rounded"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Default Supplier</label>
            <select
              className="w-full border p-2 rounded"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Retail Price *</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Retail Price"
              value={priceRetail}
              onChange={(e) => setPriceRetail(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Wholesale Price</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Wholesale Price"
              value={priceWholesale}
              onChange={(e) => setPriceWholesale(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock Quantity</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              placeholder="Stock Qty"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold mb-2 text-gray-700">Optional: Initial Batch Details</h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batch Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Batch Number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost Price</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                placeholder="Cost Price"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manufacture Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={addProduct}
            className="bg-green-600 text-white rounded px-6 py-2 hover:bg-green-700"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Products List</h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse table-auto text-left text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Barcode</th>
                <th className="border px-2 py-1">Category</th>
                <th className="border px-2 py-1">Supplier</th>
                <th className="border px-2 py-1">Retail Price</th>
                <th className="border px-2 py-1">Wholesale Price</th>
                <th className="border px-2 py-1">Stock Qty</th>
                <th className="border px-2 py-1">Multi-Batch</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{p.id}</td>
                  <td className="border px-2 py-1">{p.name}</td>
                  <td className="border px-2 py-1">{p.barcode}</td>
                  <td className="border px-2 py-1">{p.categoryName || ""}</td>
                  <td className="border px-2 py-1">{p.defaultSupplierName || "-"}</td>
                  <td className="border px-2 py-1">Rs {p.priceRetail.toFixed(2)}</td>
                  <td className="border px-2 py-1">Rs {p.priceWholesale.toFixed(2)}</td>
                  <td className="border px-2 py-1 text-center">{p.stockQuantity}</td>
                  <td className="border px-2 py-1 text-center">
                    {p.hasMultipleBatches ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    {p.hasMultipleBatches && (
                      <button
                        onClick={() => viewBatches(p.id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                      >
                        View Batches
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch View Modal */}
      {viewBatchesProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Product Batches</h3>
              <button
                onClick={() => {
                  setViewBatchesProductId(null);
                  setBatches([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {batches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No batches found for this product</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2 text-left">Batch #</th>
                    <th className="border p-2 text-left">Supplier</th>
                    <th className="border p-2 text-right">Cost</th>
                    <th className="border p-2 text-right">Selling</th>
                    <th className="border p-2 text-right">Wholesale</th>
                    <th className="border p-2 text-center">Remaining</th>
                    <th className="border p-2 text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="border p-2">{batch.batchNumber}</td>
                      <td className="border p-2">{batch.supplierName}</td>
                      <td className="border p-2 text-right">Rs {batch.costPrice.toFixed(2)}</td>
                      <td className="border p-2 text-right">Rs {batch.sellingPrice.toFixed(2)}</td>
                      <td className="border p-2 text-right">Rs {batch.wholesalePrice.toFixed(2)}</td>
                      <td className="border p-2 text-center font-semibold">{batch.remainingQuantity}</td>
                      <td className="border p-2">
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}