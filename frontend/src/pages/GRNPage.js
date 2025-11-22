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

    // GRN Form States
    const [supplierId, setSupplierId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]);

    // Payment States
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [paidAmount, setPaidAmount] = useState("");
    const [paymentType, setPaymentType] = useState("cash");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");

    // Item Form States
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

    // Right Panel States
    const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("");
    const [filteredGRNs, setFilteredGRNs] = useState([]);
    const [loadingGRNs, setLoadingGRNs] = useState(false);

    const [isGRNHistoryExpanded, setIsGRNHistoryExpanded] = useState(false);
    const [showViewGRNModal, setShowViewGRNModal] = useState(false);
    const [selectedGRNToView, setSelectedGRNToView] = useState(null);

    const totalAmount = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const creditAmount = paymentStatus === "unpaid"
        ? totalAmount
        : Math.max(0, totalAmount - parseFloat(paidAmount || 0));

    const handleBarcodeSearch = () => {
        if (!barcodeInput.trim()) return;

        api.get(`/product/barcode/${barcodeInput.trim()}`)
            .then((res) => {
                if (res.data) {
                    setSelectedProductId(res.data.id.toString());
                    setCostPrice(res.data.costPrice || "");
                    setProductPrice(res.data.price || "");
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
            barcode: product?.barcode || "",
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
        setBarcodeInput("");
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setSupplierId("");
        setNotes("");
        setItems([]);
        setPaymentStatus("unpaid");
        setPaidAmount("");
        setPaymentType("cash");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setChequeNumber("");
        setChequeDate("");
        setPaymentNotes("");
    };

    const submitGRN = async () => {
        if (!supplierId) {
            alert("Please select a supplier");
            return;
        }

        if (items.length === 0) {
            alert("Please add at least one item");
            return;
        }

        // Validate payment information if payment is being made
        if (paymentStatus !== "unpaid") {
            if (!paidAmount || parseFloat(paidAmount) <= 0) {
                alert("Please enter paid amount");
                return;
            }
            if (!paymentType) {
                alert("Please select payment type");
                return;
            }
            if (paymentType === "cheque" && !chequeNumber) {
                alert("Please enter cheque number");
                return;
            }
        }

        const finalPaymentStatus = paymentStatus === "unpaid"
            ? "unpaid"
            : (creditAmount > 0 ? "partial" : "paid");

        const grnData = {
            supplierId: parseInt(supplierId),
            receivedBy: parseInt(user?.id || 1),
            notes,
            items,
            paymentStatus: finalPaymentStatus,
            paidAmount: parseFloat(paidAmount || 0),
            paymentType: paymentStatus !== "unpaid" ? paymentType : null,
            paymentDate: paymentStatus !== "unpaid" ? paymentDate : null,
            chequeNumber: paymentType === "cheque" ? chequeNumber : null,
            chequeDate: paymentType === "cheque" ? chequeDate : null,
            paymentNotes: paymentNotes || null
        };

        try {
            await api.post("/grn", grnData);
            alert("GRN created successfully!");
            resetForm();

            // ✅ CHANGE THIS: Refresh the list if supplier was selected
            if (selectedSupplierFilter) {
                await fetchGRNsBySupplier(selectedSupplierFilter);
            }
        } catch (err) {
            alert("Failed to create GRN: " + (err.response?.data?.message || err.message));
            console.error(err);
        }
    };

    const fetchGRNsBySupplier = async (supplierId) => {
        if (!supplierId) {
            setFilteredGRNs([]);
            return;
        }

        setLoadingGRNs(true);
        try {
            const response = await api.get(`/grn/supplier/${supplierId}`);
            setFilteredGRNs(response.data);
        } catch (error) {
            console.error("Failed to fetch GRNs:", error);
            alert("Failed to load GRNs");
        } finally {
            setLoadingGRNs(false);
        }
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

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800 border-green-300';
            case 'partial': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-red-100 text-red-800 border-red-300';
        }
    };

    const getPaymentStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Paid';
            case 'partial': return 'Partial';
            default: return 'Unpaid';
        }
    };

    useEffect(() => {
        api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
        api.get("/category").then((res) => dispatch(setCategories(res.data)));
    }, [dispatch]);

    useEffect(() => {
        if (selectedSupplierFilter) {
            fetchGRNsBySupplier(selectedSupplierFilter);
        } else {
            setFilteredGRNs([]);
        }
    }, [selectedSupplierFilter]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Goods Received Note (GRN)</h2>
                <p className="text-gray-600">Record incoming inventory from suppliers with payment tracking</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                        {/* Create GRN Section */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Create New GRN
                            </h3>

                            {/* Supplier and Notes */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                        Supplier <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Notes</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        placeholder="Optional notes"
                                    />
                                </div>
                            </div>

                            {/* Add Items Section */}
                            <div className="border-t-2 border-gray-200 pt-6 mb-6">

                                {/* Barcode Scanner */}
                                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                                    <label className="block text-sm font-semibold mb-2 text-blue-900">
                                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
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
                                            className="flex-1 border-2 border-blue-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                                            placeholder="Scan or type barcode and press Enter..."
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleBarcodeSearch}
                                            className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>

                                {/* Product Selection */}
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="col-span-3">
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Product <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedProductId}
                                                onChange={(e) => {
                                                    setSelectedProductId(e.target.value);
                                                    const product = products.find(p => p.id === parseInt(e.target.value));
                                                    if (product) {
                                                        setCostPrice(product.costPrice || "");
                                                        setProductPrice(product.price || "");
                                                    }
                                                }}
                                                className="flex-1 border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
                                                className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center gap-1 shadow-md hover:shadow-lg"
                                                title="Add New Product"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                New
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Cost Price <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={costPrice}
                                            onChange={(e) => setCostPrice(e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Selling Price (MRP) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={productPrice}
                                            onChange={(e) => setProductPrice(e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Manufacture Date</label>
                                        <input
                                            type="date"
                                            value={manufactureDate}
                                            onChange={(e) => setManufactureDate(e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={addItem}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Item to GRN
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL - 40% (2 columns) */}
                    <div className="space-y-6">
                        {/* Items List */}
                        {items.length > 0 && (
                            <div className="border-t-2 border-gray-200 pt-6 mb-6">
                                <h4 className="font-semibold mb-4 text-lg text-gray-700">Items Added ({items.length})</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-800">{item.productName}</div>
                                                <div className="text-sm text-gray-600">
                                                    Qty: {item.quantity} | Cost: Rs. {item.costPrice.toFixed(2)} |
                                                    MRP: Rs. {item.productPrice.toFixed(2)} |
                                                    Subtotal: Rs. {(item.costPrice * item.quantity).toFixed(2)}
                                                </div>
                                                {(item.manufactureDate || item.expiryDate) && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {item.manufactureDate && `Mfg: ${item.manufactureDate}`}
                                                        {item.manufactureDate && item.expiryDate && " | "}
                                                        {item.expiryDate && `Exp: ${item.expiryDate}`}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="ml-4 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition"
                                                title="Remove Item"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Details Section */}
                        {items.length > 0 && (
                            <div className="border-t-2 border-gray-200 pt-6 mb-6">
                                <h4 className="font-semibold mb-4 text-lg flex items-center gap-2 text-purple-700">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Payment Details
                                </h4>

                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200 mb-4">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-sm text-gray-600 font-semibold">Total Amount</div>
                                            <div className="text-2xl font-bold text-blue-700">Rs. {totalAmount.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-semibold">Paid Amount</div>
                                            <div className="text-2xl font-bold text-green-700">
                                                Rs. {paymentStatus === "unpaid" ? "0.00" : (parseFloat(paidAmount) || 0).toFixed(2)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600 font-semibold">Credit Amount</div>
                                            <div className="text-2xl font-bold text-red-700">Rs. {creditAmount.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                            Payment Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={paymentStatus}
                                            onChange={(e) => {
                                                setPaymentStatus(e.target.value);
                                                if (e.target.value === "unpaid") {
                                                    setPaidAmount("");
                                                    setPaymentType("cash");
                                                } else if (e.target.value === "paid") {
                                                    setPaidAmount(totalAmount.toString());
                                                }
                                            }}
                                            className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                        >
                                            <option value="unpaid">Unpaid (Full Credit)</option>
                                            <option value="partial">Partial Payment</option>
                                            <option value="paid">Fully Paid</option>
                                        </select>
                                    </div>

                                    {paymentStatus !== "unpaid" && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                                        Paid Amount <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={paidAmount}
                                                        onChange={(e) => setPaidAmount(e.target.value)}
                                                        className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                        step="0.01"
                                                        min="0"
                                                        max={totalAmount}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                                                        Payment Type <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={paymentType}
                                                        onChange={(e) => setPaymentType(e.target.value)}
                                                        className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="cheque">Cheque</option>
                                                        <option value="bank_transfer">Bank Transfer</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Date</label>
                                                <input
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={(e) => setPaymentDate(e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                />
                                            </div>

                                            {paymentType === "cheque" && (
                                                <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                                                            Cheque Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Cheque Number"
                                                            value={chequeNumber}
                                                            onChange={(e) => setChequeNumber(e.target.value)}
                                                            className="w-full border-2 border-yellow-400 rounded-lg p-2.5 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2 text-gray-700">Cheque Date</label>
                                                        <input
                                                            type="date"
                                                            value={chequeDate}
                                                            onChange={(e) => setChequeDate(e.target.value)}
                                                            className="w-full border-2 border-yellow-400 rounded-lg p-2.5 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Notes</label>
                                                <textarea
                                                    value={paymentNotes}
                                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                                                    rows="2"
                                                    placeholder="Additional payment notes..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {items.length > 0 && (
                            <div className="flex gap-4">
                                <button
                                    onClick={submitGRN}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl"
                                >
                                    Create GRN
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-8 bg-gray-500 text-white py-4 rounded-lg hover:bg-gray-600 transition-all font-semibold shadow-md"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 2: VIEW GRN HISTORY - Collapsible */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Collapsible Header - Always Visible */}
                <button
                    onClick={() => setIsGRNHistoryExpanded(!isGRNHistoryExpanded)}
                    className="w-full p-6 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-gray-800">View GRN History</h3>
                            <p className="text-sm text-gray-600">Click to expand and view past GRNs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedSupplierFilter && filteredGRNs.length > 0 && (
                            <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                {filteredGRNs.length} GRNs
                            </span>
                        )}
                        <svg
                            className={`w-6 h-6 text-gray-600 transform transition-transform duration-300 ${isGRNHistoryExpanded ? 'rotate-180' : 'rotate-0'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {/* Collapsible Content */}
                {isGRNHistoryExpanded && (
                    <div className="border-t-2 border-gray-200">
                        {/* Filter Section */}
                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                Filter by Supplier
                            </label>
                            <select
                                value={selectedSupplierFilter}
                                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                            >
                                <option value="">-- Select Supplier to View GRNs --</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* GRN List Section */}
                        <div className="p-6">
                            {loadingGRNs ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                                    <p className="mt-4 text-gray-600">Loading GRNs...</p>
                                </div>
                            ) : !selectedSupplierFilter ? (
                                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                                    <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p className="text-gray-600 font-medium text-lg">Please select a supplier to view GRNs</p>
                                    <p className="text-gray-500 text-sm mt-2">Use the dropdown above to filter GRNs by supplier</p>
                                </div>
                            ) : filteredGRNs.length === 0 ? (
                                <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
                                    <svg className="w-20 h-20 mx-auto text-blue-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-gray-700 font-medium text-lg">No GRNs found for this supplier</p>
                                    <p className="text-gray-600 text-sm mt-2">Create a new GRN above to get started</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            GRN Records
                                        </h4>
                                        <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-bold">
                                            {filteredGRNs.length} {filteredGRNs.length === 1 ? 'record' : 'records'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                                        {filteredGRNs.map((grn) => (
                                            <div
                                                key={grn.id}
                                                onClick={() => {
                                                    setSelectedGRNToView(grn);
                                                    setShowViewGRNModal(true);
                                                }}
                                                className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-indigo-400 hover:shadow-lg transition cursor-pointer group bg-white"
                                            >
                                                {/* Card Header */}
                                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="text-xs opacity-80 mb-1">GRN Number</div>
                                                            <div className="text-lg font-bold">{grn.grnNumber}</div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPaymentStatusColor(grn.paymentStatus)}`}>
                                                            {getPaymentStatusText(grn.paymentStatus)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs opacity-80">
                                                        {new Date(grn.receivedDate).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-4">
                                                    <div className="space-y-3">
                                                        {/* Total Amount */}
                                                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                                            <span className="text-sm text-gray-600">Total Amount</span>
                                                            <span className="text-xl font-bold text-blue-700">
                                                                Rs {grn.totalAmount.toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* Paid Amount */}
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600">Amount Paid</span>
                                                            <span className="text-md font-semibold text-green-600">
                                                                Rs {grn.paidAmount.toFixed(2)}
                                                            </span>
                                                        </div>

                                                        {/* Balance Due */}
                                                        {grn.paymentStatus !== 'paid' && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-600">Balance Due</span>
                                                                <span className="text-md font-semibold text-red-600">
                                                                    Rs {(grn.totalAmount - grn.paidAmount).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Items Count */}
                                                        <div className="pt-3 border-t border-gray-200">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-gray-600 flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                                    </svg>
                                                                    Items
                                                                </span>
                                                                <span className="font-semibold text-gray-800">{grn.items?.length || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Click to View Indicator */}
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <div className="flex items-center justify-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                                                            <span>Click to View Details</span>
                                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Add New Product</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    placeholder="Enter product name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">
                                    Barcode <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newProductBarcode}
                                    onChange={(e) => setNewProductBarcode(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    placeholder="Enter barcode"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newProductCategory}
                                    onChange={(e) => setNewProductCategory(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddNewProduct}
                                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md"
                            >
                                Add Product
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddProductModal(false);
                                    setNewProductName("");
                                    setNewProductBarcode("");
                                    setNewProductCategory("");
                                }}
                                className="px-6 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-all font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View GRN Modal */}
            <ViewGRNModal
                isOpen={showViewGRNModal}
                onClose={() => {
                    setShowViewGRNModal(false);
                    setSelectedGRNToView(null);
                }}
                grn={selectedGRNToView}
                onPaymentAdded={async () => {
                    // Refresh the GRN list after payment
                    if (selectedSupplierFilter) {
                        await fetchGRNsBySupplier(selectedSupplierFilter);
                    }
                }}
            />
        </div>
    );
}