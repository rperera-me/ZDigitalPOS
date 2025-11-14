import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setCategories, setProducts } from "../app/posSlice";
import { ProductUpdateModal } from "../components/modals";

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.pos.products);
  const categories = useSelector((state) => state.pos.categories);
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  // Price fields - shown only when quantity > 0
  const [costPrice, setCostPrice] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const [barcodeScanned, setBarcodeScanned] = useState("");
  const [viewingStockByPrice, setViewingStockByPrice] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState([]);

  const [editingProduct, setEditingProduct] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const generateBarcode = () => {
    const randomBarcode = "CODE" + Date.now().toString().slice(-10);
    setBarcode(randomBarcode);
  };

  const handleBarcodeInput = (e) => {
    if (e.key === "Enter") {
      setBarcode(barcodeScanned);
      setBarcodeScanned("");
    }
  };

  const resetForm = () => {
    setName("");
    setBarcode("");
    setCategoryId("");
    setStockQuantity("");
    setCostPrice("");
    setProductPrice("");
    setSellingPrice("");
    setWholesalePrice("");
    setManufactureDate("");
    setExpiryDate("");
  };

  const hasQuantity = parseInt(stockQuantity) > 0;

  const addProduct = () => {
    if (!name || !barcode || !categoryId) {
      alert("Please fill all required fields (Name, Barcode, Category).");
      return;
    }

    // If quantity > 0, validate pricing fields
    if (hasQuantity) {
      if (!costPrice || !productPrice || !sellingPrice) {
        alert("Cost Price, Product Price (MRP), and Selling Price are required when stock quantity > 0");
        return;
      }
    }

    const productData = {
      name,
      barcode,
      categoryId: parseInt(categoryId),
      stockQuantity: parseInt(stockQuantity) || 0,
      ...(hasQuantity && {
        costPrice: parseFloat(costPrice),
        productPrice: parseFloat(productPrice),
        sellingPrice: parseFloat(sellingPrice),
        wholesalePrice: parseFloat(wholesalePrice) || parseFloat(sellingPrice),
        manufactureDate: manufactureDate || null,
        expiryDate: expiryDate || null,
      })
    };

    api
      .post("/product", productData)
      .then(() => {
        resetForm();
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
        alert("Product added successfully!");
      })
      .catch((err) => {
        console.error("Failed to add product:", err);
        alert("Failed to add product: " + (err.response?.data?.message || err.message));
      });
  };

  const viewStockByPrice = (product) => {
    api.get(`/product/${product.id}/price-variants`)
      .then((res) => {
        setPriceBreakdown(res.data);
        setViewingStockByPrice(product);
      })
      .catch(() => alert("Failed to load price breakdown"));
  };

  // Helper to format price range
  const formatPriceRange = (min, max) => {
    if (!min && !max) return '-';
    if (!max || min === max) return `Rs ${min?.toFixed(2) || '0.00'}`;
    return `Rs ${min?.toFixed(2)} - ${max?.toFixed(2)}`;
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowUpdateModal(true);
  };

  const handleProductUpdated = () => {
    api.get("/product").then((res) => dispatch(setProducts(res.data)));
  };

  useEffect(() => {
    api.get("/category").then((res) => dispatch(setCategories(res.data)));
    api.get("/product").then((res) => dispatch(setProducts(res.data)));
  }, [dispatch]);

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

        {/* Required Fields */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Barcode <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Stock Quantity (Optional)
            </label>
            <input
              type="number"
              className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
              placeholder="Stock Quantity"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Conditional Price Fields - Show only when quantity > 0 */}
        {hasQuantity && (
          <div className="border-t-2 border-gray-200 pt-4 mt-4">
            <h4 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
              Pricing Details
            </h4>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Cost Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Cost Price"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Product Price (MRP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-yellow-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500 bg-yellow-50"
                  placeholder="Product Price"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Selling Price"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Wholesale Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  placeholder="Wholesale Price"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
        )}

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

      {/* Products List Table */}
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
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Barcode</th>
                <th className="p-3 text-left text-sm font-semibold">Category</th>
                <th className="p-3 text-right text-sm font-semibold">Cost Price</th>
                <th className="p-3 text-right text-sm font-semibold">Selling Price</th>
                <th className="p-3 text-center text-sm font-semibold">Stock</th>
                <th className="p-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const showPriceRange = p.hasMultipleProductPrices;
                const category = categories.find(c => c.id === p.categoryId);

                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm font-medium">{p.name}</td>
                    <td className="p-3 text-sm font-mono text-blue-600">{p.barcode}</td>
                    <td className="p-3 text-sm">{category?.name || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="text-sm">
                        {showPriceRange ? (
                          <div className="space-y-0.5">
                            <div className="text-orange-600 font-semibold">
                              {formatPriceRange(p.minCostPrice, p.maxCostPrice)}
                            </div>
                            <div className="text-xs text-gray-500">Multiple costs</div>
                          </div>
                        ) : (
                          <div className="text-orange-600 font-semibold">
                            {p.minCostPrice ? `Rs ${p.minCostPrice.toFixed(2)}` : '-'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {showPriceRange ? (
                        <div className="text-sm space-y-0.5">
                          <div className="text-blue-600 font-semibold">Multiple Prices</div>
                          <div className="text-xs text-gray-600">
                            MRP: {formatPriceRange(p.minProductPrice, p.maxProductPrice)}
                          </div>
                          <div className="text-xs text-green-600">
                            Retail: {formatPriceRange(p.minSellingPrice, p.maxSellingPrice)}
                          </div>
                          <div className="text-xs text-purple-600">
                            W/S: {formatPriceRange(p.minWholesalePrice, p.maxWholesalePrice)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm space-y-0.5">
                          {p.minProductPrice && (
                            <div className="text-xs text-gray-600">
                              MRP: Rs {p.minProductPrice.toFixed(2)}
                            </div>
                          )}
                          <div className="text-green-600 font-semibold">
                            {p.minSellingPrice ? `Rs ${p.minSellingPrice.toFixed(2)}` : '-'}
                          </div>
                          {p.minWholesalePrice && (
                            <div className="text-purple-600 text-xs">
                              W/S: Rs {p.minWholesalePrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-semibold ${p.stockQuantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        }`}>
                        {p.stockQuantity}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm font-semibold flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => viewStockByPrice(p)}
                          className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm font-semibold flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View
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

      {/* Price Breakdown Modal */}
      {viewingStockByPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{viewingStockByPrice.name}</h3>
                <p className="text-sm text-gray-600">
                  Stock breakdown by product price
                </p>
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

            {priceBreakdown.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No price variants found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {priceBreakdown.map((variant, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs opacity-80">Product Price (MRP)</div>
                          <div className="text-2xl font-bold">Rs {variant.productPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-80">Selling Price</div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Product Update Modal */}
      <ProductUpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
}