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
  const [supplierId, setSupplierId] = useState("");

  // Batch fields
  const [batchNumber, setBatchNumber] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [barcodeScanned, setBarcodeScanned] = useState("");
  const [viewingStockByPrice, setViewingStockByPrice] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState([]);

  useEffect(() => {
    api.get("/category").then((res) => dispatch(setCategories(res.data)));
    api.get("/product").then((res) => dispatch(setProducts(res.data)));
    api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
  }, [dispatch]);

  // Auto-generate barcode if empty
  const generateBarcode = () => {
    const randomBarcode = "PRD" + Date.now().toString().slice(-10);
    setBarcode(randomBarcode);
  };

  // Barcode scanner
  const handleBarcodeInput = (e) => {
    if (e.key === "Enter") {
      setBarcode(barcodeScanned);
      setBarcodeScanned("");
    }
  };

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

  const viewStockByPrice = (product) => {
    api.get(`/product/${product.id}/price-variants`)
      .then((res) => {
        setPriceBreakdown(res.data);
        setViewingStockByPrice(product);
      })
      .catch(() => alert("Failed to load price breakdown"));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Product Management</h2>
        <p className="text-gray-600">Manage your inventory and product catalog</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </h3>

        {/* Barcode Scanner Section */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <label className="block text-sm font-medium mb-2 text-blue-900 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Barcode Scanner
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border-2 border-blue-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Scan or enter barcode..."
              value={barcodeScanned}
              onChange={(e) => setBarcodeScanned(e.target.value)}
              onKeyDown={handleBarcodeInput}
            />
            <button
              onClick={() => {
                setBarcode(barcodeScanned);
                setBarcodeScanned("");
              }}
              className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Use Barcode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Product Name *</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Barcode *</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <button
                onClick={generateBarcode}
                className="bg-gray-500 text-white px-3 rounded-lg hover:bg-gray-600 transition text-sm"
                title="Auto-generate barcode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Category *</label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
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
            <label className="block text-sm font-medium mb-1 text-gray-700">Default Supplier</label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
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
            <label className="block text-sm font-medium mb-1 text-gray-700">Retail Price *</label>
            <input
              type="number"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Retail Price"
              value={priceRetail}
              onChange={(e) => setPriceRetail(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Wholesale Price</label>
            <input
              type="number"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Wholesale Price"
              value={priceWholesale}
              onChange={(e) => setPriceWholesale(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Stock Quantity</label>
            <input
              type="number"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Stock Qty"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div className="border-t-2 border-gray-200 pt-4 mt-4">
          <h4 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Optional: Initial Batch Details
          </h4>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Batch Number</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Batch Number"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Cost Price</label>
              <input
                type="number"
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                placeholder="Cost Price"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Manufacture Date</label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Expiry Date</label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={addProduct}
            className="flex-1 bg-green-600 text-white rounded-lg px-6 py-3 hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
          <button
            onClick={resetForm}
            className="bg-gray-300 text-gray-700 rounded-lg px-6 py-3 hover:bg-gray-400 transition font-semibold"
          >
            Clear Form
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Products List
          <span className="ml-auto text-sm font-normal text-gray-500">
            {products.length} products
          </span>
        </h3>
        <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">ID</th>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Barcode</th>
                <th className="p-3 text-left text-sm font-semibold">Category</th>
                <th className="p-3 text-left text-sm font-semibold">Supplier</th>
                <th className="p-3 text-right text-sm font-semibold">Retail Price</th>
                <th className="p-3 text-right text-sm font-semibold">Wholesale Price</th>
                <th className="p-3 text-center text-sm font-semibold">Stock Qty</th>
                <th className="p-3 text-center text-sm font-semibold">Multi-Price</th>
                <th className="p-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm">{p.id}</td>
                  <td className="p-3 text-sm font-medium">{p.name}</td>
                  <td className="p-3 text-sm font-mono text-blue-600">{p.barcode}</td>
                  <td className="p-3 text-sm">{p.categoryName || ""}</td>
                  <td className="p-3 text-sm">{p.defaultSupplierName || "-"}</td>
                  <td className="p-3 text-right font-semibold">Rs {p.priceRetail.toFixed(2)}</td>
                  <td className="p-3 text-right">Rs {p.priceWholesale.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${p.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {p.hasMultipleBatches ? (
                      <span className="text-green-600 font-semibold">✓ Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <button
                    onClick={() => viewStockByPrice(p)}
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm font-semibold"
                  >
                    View Stock by Price
                  </button>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      // Stock by Price Modal
      {viewingStockByPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{viewingStockByPrice.name}</h3>
                <p className="text-sm text-gray-600">Stock breakdown by product price</p>
              </div>
              <button
                onClick={() => {
                  setViewingStockByPrice(null);
                  setPriceBreakdown([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Stock</div>
                <div className="text-2xl font-bold text-blue-800">
                  {priceBreakdown.reduce((sum, v) => sum + v.totalStock, 0)} units
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-green-600 mb-1">Price Variants</div>
                <div className="text-2xl font-bold text-green-800">
                  {priceBreakdown.length}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Price Range</div>
                <div className="text-2xl font-bold text-purple-800">
                  {priceBreakdown.length > 0 && (
                    <>
                      Rs {Math.min(...priceBreakdown.map(v => v.productPrice)).toFixed(2)} -
                      Rs {Math.max(...priceBreakdown.map(v => v.productPrice)).toFixed(2)}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Price Breakdown Table */}
            {priceBreakdown.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No price variants found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {priceBreakdown.map((variant, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    {/* Price Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs opacity-80">Product Price</div>
                          <div className="text-2xl font-bold">Rs {variant.productPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Selling Price (Retail)</div>
                          <div className="text-xl font-semibold">Rs {variant.sellingPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Wholesale Price</div>
                          <div className="text-xl font-semibold">Rs {variant.wholesalePrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Total Stock</div>
                          <div className="text-2xl font-bold">{variant.totalStock} units</div>
                        </div>
                      </div>
                    </div>

                    {/* GRN Sources */}
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Stock Sources (GRNs):</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-white">
                            <th className="text-left p-2">GRN Number</th>
                            <th className="text-left p-2">Batch Number</th>
                            <th className="text-center p-2">Stock</th>
                            <th className="text-left p-2">Received Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variant.sources.map((source, idx) => (
                            <tr key={idx} className="border-b hover:bg-white">
                              <td className="p-2 font-mono text-blue-600">{source.grnNumber}</td>
                              <td className="p-2">{source.batchNumber}</td>
                              <td className="text-center p-2">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                                  {source.stock}
                                </span>
                              </td>
                              <td className="p-2 text-gray-600">
                                {new Date(source.receivedDate).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}