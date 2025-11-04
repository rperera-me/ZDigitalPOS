import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import { setSuppliers, setProducts } from "../app/posSlice";

export default function GRNPage() {
    const dispatch = useDispatch();
    const suppliers = useSelector((state) => state.pos.suppliers);
    const products = useSelector((state) => state.pos.products);
    const user = useSelector((state) => state.auth.user);

    const [supplierId, setSupplierId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([]);
    const [grns, setGrns] = useState([]);

    // Item form
    const [selectedProductId, setSelectedProductId] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [quantity, setQuantity] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [wholesalePrice, setWholesalePrice] = useState("");
    const [manufactureDate, setManufactureDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    useEffect(() => {
        api.get("/supplier").then((res) => dispatch(setSuppliers(res.data)));
        api.get("/product").then((res) => dispatch(setProducts(res.data)));
        fetchGRNs();
    }, [dispatch]);

    const fetchGRNs = () => {
        api.get("/grn").then((res) => setGrns(res.data));
    };

    const addItem = () => {
        if (!selectedProductId || !batchNumber || !quantity || !costPrice || !sellingPrice) {
            alert("Please fill all required fields");
            return;
        }

        const product = products.find((p) => p.id === parseInt(selectedProductId));

        const newItem = {
            productId: parseInt(selectedProductId),
            productName: product?.name || "",
            batchNumber,
            quantity: parseInt(quantity),
            costPrice: parseFloat(costPrice),
            sellingPrice: parseFloat(sellingPrice),
            wholesalePrice: parseFloat(wholesalePrice) || parseFloat(sellingPrice),
            manufactureDate: manufactureDate || null,
            expiryDate: expiryDate || null,
        };

        setItems([...items, newItem]);

        // Reset form
        setSelectedProductId("");
        setBatchNumber("");
        setQuantity("");
        setCostPrice("");
        setSellingPrice("");
        setWholesalePrice("");
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

    const totalAmount = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Goods Received Note (GRN)</h2>

            <div className="grid grid-cols-3 gap-6">
                {/* GRN Form */}
                <div className="col-span-2">
                    <div className="bg-white rounded shadow p-6 mb-6">
                        <h3 className="text-xl font-semibold mb-4">Create New GRN</h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Supplier *</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full border rounded p-2"
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
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full border rounded p-2"
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>

                        <hr className="my-4" />

                        <h4 className="font-semibold mb-2">Add Items</h4>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="border rounded p-2 col-span-2"
                            >
                                <option value="">-- Select Product --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Batch Number *"
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                                className="border rounded p-2"
                            />

                            <input
                                type="number"
                                placeholder="Quantity *"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="border rounded p-2"
                                min="1"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-2">
                            <input
                                type="number"
                                placeholder="Cost Price *"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                className="border rounded p-2"
                                step="0.01"
                                min="0"
                            />

                            <input
                                type="number"
                                placeholder="Selling Price *"
                                value={sellingPrice}
                                onChange={(e) => setSellingPrice(e.target.value)}
                                className="border rounded p-2"
                                step="0.01"
                                min="0"
                            />

                            <input
                                type="number"
                                placeholder="Wholesale Price"
                                value={wholesalePrice}
                                onChange={(e) => setWholesalePrice(e.target.value)}
                                className="border rounded p-2"
                                step="0.01"
                                min="0"
                            />

                            <button
                                onClick={addItem}
                                className="bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Add Item
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <input
                                type="date"
                                placeholder="Manufacture Date"
                                value={manufactureDate}
                                onChange={(e) => setManufactureDate(e.target.value)}
                                className="border rounded p-2"
                            />

                            <input
                                type="date"
                                placeholder="Expiry Date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="border rounded p-2"
                            />
                        </div>

                        {/* Items Table */}
                        {items.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Items Added ({items.length})</h4>
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border p-2 text-left">Product</th>
                                            <th className="border p-2 text-left">Batch</th>
                                            <th className="border p-2 text-center">Qty</th>
                                            <th className="border p-2 text-right">Cost</th>
                                            <th className="border p-2 text-right">Selling</th>
                                            <th className="border p-2 text-right">Total</th>
                                            <th className="border p-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="border p-2">{item.productName}</td>
                                                <td className="border p-2">{item.batchNumber}</td>
                                                <td className="border p-2 text-center">{item.quantity}</td>
                                                <td className="border p-2 text-right">Rs {item.costPrice.toFixed(2)}</td>
                                                <td className="border p-2 text-right">Rs {item.sellingPrice.toFixed(2)}</td>
                                                <td className="border p-2 text-right font-semibold">
                                                    Rs {(item.costPrice * item.quantity).toFixed(2)}
                                                </td>
                                                <td className="border p-2 text-center">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-50 font-bold">
                                            <td colSpan="5" className="border p-2 text-right">Total Amount:</td>
                                            <td className="border p-2 text-right">Rs {totalAmount.toFixed(2)}</td>
                                            <td className="border p-2"></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={submitGRN}
                                        disabled={items.length === 0}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Submit GRN
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent GRNs */}
                <div className="col-span-1">
                    <div className="bg-white rounded shadow p-6">
                        <h3 className="text-xl font-semibold mb-4">Recent GRNs</h3>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {grns.map((grn) => (
                                <div key={grn.id} className="border rounded p-3 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-blue-600">{grn.grnNumber}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(grn.receivedDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        Supplier: {grn.supplierName}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">
                                        Items: {grn.items?.length || 0}
                                    </div>
                                    <div className="font-semibold text-green-600">
                                        Total: Rs {grn.totalAmount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}