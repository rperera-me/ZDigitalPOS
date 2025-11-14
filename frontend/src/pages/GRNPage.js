import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setSuppliers, setProducts, setCategories } from "../app/posSlice";
import { ViewGRNModal } from "../components/modals";

export default function GRNPage() {
    const dispatch = useDispatch();
    const suppliers = useSelector((state) => state.pos.suppliers);
    const products = useSelector((state) => state.pos.products);
    const categories = useSelector((state) => state.pos.categories);
    const user = useSelector((state) => state.auth.user);

    const [supplierId, setSupplierId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]);
    const [grns, setGrns] = useState([]);

    // Item form
    const [selectedProductId, setSelectedProductId] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [quantity, setQuantity] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [manufactureDate, setManufactureDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    // Add Product Modal
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductBarcode, setNewProductBarcode] = useState("");
    const [newProductCategory, setNewProductCategory] = useState("");

    const [viewingGRN, setViewingGRN] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const handleViewGRN = (grn) => {
        setViewingGRN(grn);
        setShowViewModal(true);
    };

    const fetchGRNs = () => {
        api.get("/grn").then((res) => setGrns(res.data));
    };

    const handleBarcodeSearch = () => {
        if (!barcodeInput.trim()) return;

        api.get(`/product/barcode/${barcodeInput.trim()}`)
            .then((res) => {
                if (res.data) {
                    setSelectedProductId(res.data.id.toString());
                    setBarcodeInput("");
                } else {
                    alert("Product not found with this barcode");
                }
            })
            .catch(() => alert("Error searching for product"));
    };

    const addItem = () => {
        if (!selectedProductId || !quantity || !costPrice || !productPrice) {
            alert("Please fill all required fields (Product, Qty, Cost Price, Product Price)");
            return;
        }

        const product = products.find((p) => p.id === parseInt(selectedProductId));

        const newItem = {
            productId: parseInt(selectedProductId),
            productName: product?.name || "",
            quantity: parseInt(quantity),
            costPrice: parseFloat(costPrice),
            productPrice: parseFloat(productPrice),
            manufactureDate: manufactureDate || null,
            expiryDate: expiryDate || null,
        };

        setItems([...items, newItem]);

        // Reset form
        setSelectedProductId("");
        setQuantity("");
        setCostPrice("");
        setProductPrice("");
        setManufactureDate("");
        setExpiryDate("");
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const submitGRN = () => {
        if (!supplierId) {
            alert("Please select a supplier");
            return;
        }

        if (items.length === 0) {
            alert("Please add at least one item");
            return;
        }

        const grnData = {
            supplierId: parseInt(supplierId),
            receivedBy: parseInt(user?.id || 1),
            notes,
            items,
        };

        api.post("/grn", grnData)
            .then(() => {
                alert("GRN created successfully!");
                setSupplierId("");
                setNotes("");
                setItems([]);
                fetchGRNs();
            })
            .catch((err) => {
                alert("Failed to create GRN");
                console.error(err);
            });
    };

    const handleAddNewProduct = () => {
        if (!newProductName || !newProductBarcode || !newProductCategory) {
            alert("Please fill all required fields for new product");
            return;
        }

        const productData = {
            name: newProductName,
            barcode: newProductBarcode,
            categoryId: parseInt(newProductCategory),
            stockQuantity: 0
        };

        api.post("/product", productData)
            .then((res) => {
                alert("Product added successfully!");
                api.get("/product").then((res) => dispatch(setProducts(res.data)));
                setSelectedProductId(res.data.id.toString());
                setShowAddProductModal(false);
                setNewProductName("");
                setNewProductBarcode("");
                setNewProductCategory("");
            })
            .catch(() => alert("Failed to add product"));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    useEffect(() => {
        api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
        api.get("/category").then((res) => dispatch(setCategories(res.data)));
        fetchGRNs();
    }, [dispatch]);

    return (
        <div className="p-8">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Goods Received Note (GRN)</h2>
                <p className="text-gray-600">Record incoming inventory from suppliers</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* GRN Form */}
                <div className="col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Create New GRN
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Supplier *</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    required
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>

                        <hr className="my-6 border-gray-200" />

                        <h4 className="font-semibold mb-4 text-lg flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Items
                        </h4>

                        {/* Barcode Scanner */}
                        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium mb-2 text-blue-900">
                                Scan or Enter Barcode
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleBarcodeSearch();
                                    }}
                                    className="flex-1 border-2 border-blue-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Scan or type barcode..."
                                    autoFocus
                                />
                                <button
                                    onClick={handleBarcodeSearch}
                                    className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="col-span-3">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Product *</label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className="flex-1 border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Select Product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.barcode})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowAddProductModal(true)}
                                        className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-1"
                                        title="Add New Product"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Quantity *</label>
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Cost Price *
                                </label>
                                <input
                                    type="number"
                                    placeholder="Cost Price"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Product Price (MRP) *
                                </label>
                                <input
                                    type="number"
                                    placeholder="Product Price"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    className="w-full border-2 border-yellow-300 rounded-lg p-2 focus:outline-none focus:border-yellow-500 bg-yellow-50"
                                    step="0.01"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Manufacture Date</label>
                                <input
                                    type="date"
                                    value={manufactureDate}
                                    onChange={(e) => setManufactureDate(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Expiry Date</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={addItem}
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Item to GRN
                        </button>

                        {/* Items Table */}
                        {items.length > 0 && (
                            <div className="mt-6">
                                <h4 className="font-semibold mb-3 text-lg">Items Added ({items.length})</h4>
                                <div className="overflow-x-auto border-2 border-gray-200 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-left font-semibold">Product</th>
                                                <th className="p-2 text-center font-semibold">Qty</th>
                                                <th className="p-2 text-right font-semibold">Cost</th>
                                                <th className="p-2 text-right font-semibold">MRP</th>
                                                <th className="p-2 text-right font-semibold">Total Cost</th>
                                                <th className="p-2 text-center font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="border-t hover:bg-gray-50">
                                                    <td className="p-2">{item.productName}</td>
                                                    <td className="p-2 text-center font-semibold">{item.quantity}</td>
                                                    <td className="p-2 text-right">Rs {item.costPrice.toFixed(2)}</td>
                                                    <td className="p-2 text-right text-yellow-600 font-semibold">
                                                        Rs {item.productPrice.toFixed(2)}
                                                    </td>
                                                    <td className="p-2 text-right font-semibold text-orange-600">
                                                        Rs {(item.costPrice * item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-blue-50 font-bold border-t-2">
                                                <td colSpan="7" className="p-3 text-right text-lg">Total Amount:</td>
                                                <td className="p-3 text-right text-lg text-blue-600">
                                                    Rs {totalAmount.toFixed(2)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={submitGRN}
                                        disabled={items.length === 0}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Submit GRN
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent GRNs */}
                <div className="col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            Recent GRNs
                        </h3>
                        <div className="space-y-3 max-h-[700px] overflow-y-auto">
                            {grns.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No GRNs yet</p>
                            ) : (
                                grns.map((grn) => (
                                    <div key={grn.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-blue-600 text-lg">{grn.grnNumber}</span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {new Date(grn.receivedDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Supplier:</span>
                                                <span className="font-semibold">{grn.supplierName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Items:</span>
                                                <span className="font-semibold">{grn.items?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t">
                                                <span className="text-gray-600 font-medium">Total:</span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    Rs {grn.totalAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleViewGRN(grn)}
                                            className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View Details
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add New Product</h3>
                            <button
                                onClick={() => setShowAddProductModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Barcode *</label>
                                <input
                                    type="text"
                                    value={newProductBarcode}
                                    onChange={(e) => setNewProductBarcode(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Enter barcode"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category *</label>
                                <select
                                    value={newProductCategory}
                                    onChange={(e) => setNewProductCategory(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    onClick={() => setShowAddProductModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddNewProduct}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Add Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GRN View Modal */}
            <ViewGRNModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setViewingGRN(null);
                }}
                grn={viewingGRN}
            />
        </div>
    );
}