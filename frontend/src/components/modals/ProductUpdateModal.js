import React, { useState, useEffect } from "react";

export default function ProductUpdateModal({ 
  isOpen, 
  onClose, 
  product, 
  categories, 
  onProductUpdated 
}) {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  
  // ✅ NEW: State for batch price editing
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editWholesalePrice, setEditWholesalePrice] = useState("");

  useEffect(() => {
    if (isOpen && product) {
      setName(product.name);
      setBarcode(product.barcode);
      setCategoryId(product.categoryId.toString());
      setStockQuantity(product.stockQuantity.toString());
      
      // Fetch batches to show and edit selling/wholesale prices
      fetchBatches();
    }
  }, [isOpen, product]);

  const fetchBatches = async () => {
    if (!product) return;
    
    setLoadingBatches(true);
    try {
      const api = require("../../api/axios").default;
      const response = await api.get(`/product/${product.id}/batches`);
      setBatches(response.data || []);
    } catch (error) {
      console.error("Failed to load batches:", error);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !barcode.trim() || !categoryId) {
      alert("Please fill all required fields (Name, Barcode, Category)");
      return;
    }

    setLoading(true);

    const productData = {
      id: product.id,
      name: name.trim(),
      barcode: barcode.trim(),
      categoryId: parseInt(categoryId),
      stockQuantity: parseInt(stockQuantity) || 0,
    };

    try {
      const api = require("../../api/axios").default;
      await api.put(`/product/${product.id}`, productData);
      
      alert("Product updated successfully!");
      onProductUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Handle batch price update
  const handleEditBatch = (batch) => {
    setEditingBatchId(batch.id);
    setEditSellingPrice(batch.sellingPrice.toString());
    setEditWholesalePrice(batch.wholesalePrice.toString());
  };

  const handleCancelBatchEdit = () => {
    setEditingBatchId(null);
    setEditSellingPrice("");
    setEditWholesalePrice("");
  };

  const handleSaveBatchPrices = async (batchId) => {
    if (!editSellingPrice || !editWholesalePrice) {
      alert("Please enter both selling and wholesale prices");
      return;
    }

    if (parseFloat(editSellingPrice) <= 0 || parseFloat(editWholesalePrice) <= 0) {
      alert("Prices must be greater than 0");
      return;
    }

    try {
      const api = require("../../api/axios").default;
      
      // We need to update the batch through a batch update endpoint
      // You'll need to add this endpoint to your backend
      const batch = batches.find(b => b.id === batchId);
      const updateData = {
        ...batch,
        sellingPrice: parseFloat(editSellingPrice),
        wholesalePrice: parseFloat(editWholesalePrice)
      };

      await api.put(`/product-batch/${batchId}`, updateData);
      
      alert("Batch prices updated successfully!");
      handleCancelBatchEdit();
      fetchBatches(); // Refresh batches
      onProductUpdated(); // Refresh product list
    } catch (error) {
      console.error("Failed to update batch:", error);
      alert("Failed to update batch prices: " + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setName("");
    setBarcode("");
    setCategoryId("");
    setStockQuantity("");
    setBatches([]);
    setEditingBatchId(null);
    setEditSellingPrice("");
    setEditWholesalePrice("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Update Product
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold mb-4 text-lg text-blue-900">Basic Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Product Name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Barcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Barcode"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  required
                  disabled={loading}
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
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Total Stock Quantity
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 bg-gray-100"
                  placeholder="Stock Quantity"
                  readOnly
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stock is managed through GRN entries
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Basic Info */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
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
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Basic Info
                </>
              )}
            </button>
          </div>
        </form>

        {/* ✅ NEW: Batch Prices Section - EDITABLE */}
        <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-lg text-green-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Product Batches & Pricing (Editable)
            </h4>
            <span className="text-sm text-green-700 font-medium">
              {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
            </span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can update <strong>Selling Price</strong> and <strong>Wholesale Price</strong> for each batch. 
              Product Price (MRP) and Cost Price are managed through GRN entries.
            </p>
          </div>

          {loadingBatches ? (
            <div className="text-center py-8 text-gray-500">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">No batches found. Add stock through GRN to create batches.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div key={batch.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-xs opacity-80">Batch Number</div>
                          <div className="font-bold font-mono">{batch.batchNumber}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Stock</div>
                          <div className="font-bold">{batch.remainingQuantity} units</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Supplier</div>
                          <div className="font-semibold text-sm">{batch.supplierName}</div>
                        </div>
                      </div>
                      
                      {editingBatchId !== batch.id && (
                        <button
                          onClick={() => handleEditBatch(batch)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded transition flex items-center gap-1 text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit Prices
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {editingBatchId === batch.id ? (
                      // ✅ EDIT MODE
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cost Price (Read-Only)
                            </label>
                            <input
                              type="text"
                              value={`Rs ${batch.costPrice.toFixed(2)}`}
                              className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-600 text-sm"
                              readOnly
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product Price / MRP (Read-Only)
                            </label>
                            <input
                              type="text"
                              value={`Rs ${batch.productPrice.toFixed(2)}`}
                              className="w-full border border-gray-300 rounded p-2 bg-gray-100 text-gray-600 text-sm"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Selling Price (Retail) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editSellingPrice}
                              onChange={(e) => setEditSellingPrice(e.target.value)}
                              className="w-full border-2 border-green-400 rounded-lg p-2 focus:outline-none focus:border-green-600"
                              placeholder="Enter selling price"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Wholesale Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editWholesalePrice}
                              onChange={(e) => setEditWholesalePrice(e.target.value)}
                              className="w-full border-2 border-purple-400 rounded-lg p-2 focus:outline-none focus:border-purple-600"
                              placeholder="Enter wholesale price"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelBatchEdit}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveBatchPrices(batch.id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Prices
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ✅ VIEW MODE
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <div className="text-xs text-gray-600 mb-1">Cost Price</div>
                          <div className="text-lg font-bold text-orange-600">
                            Rs {batch.costPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">From GRN</div>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="text-xs text-gray-600 mb-1">Product Price (MRP)</div>
                          <div className="text-lg font-bold text-yellow-600">
                            Rs {batch.productPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">From GRN</div>
                        </div>
                        
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-xs text-gray-600 mb-1">Selling Price</div>
                          <div className="text-lg font-bold text-green-600">
                            Rs {batch.sellingPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600 mt-1">✏️ Editable</div>
                        </div>
                        
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                          <div className="text-xs text-gray-600 mb-1">Wholesale Price</div>
                          <div className="text-lg font-bold text-purple-600">
                            Rs {batch.wholesalePrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">✏️ Editable</div>
                        </div>
                      </div>
                    )}

                    {/* Batch Details */}
                    {editingBatchId !== batch.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                          {batch.manufactureDate && (
                            <div>
                              <span className="font-medium">Mfg Date:</span> {new Date(batch.manufactureDate).toLocaleDateString()}
                            </div>
                          )}
                          {batch.expiryDate && (
                            <div>
                              <span className="font-medium">Exp Date:</span> {new Date(batch.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Received:</span> {new Date(batch.receivedDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}