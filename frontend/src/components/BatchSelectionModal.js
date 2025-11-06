import React, { useState, useMemo } from "react";

export default function BatchSelectionModal({ isOpen, onClose, product, batches, onSelectBatch }) {
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Group batches by price for better visualization
    const priceGroups = useMemo(() => {
        if (!batches || batches.length === 0) return [];
        
        const groups = {};
        batches.forEach(batch => {
            const price = batch.sellingPrice.toFixed(2);
            if (!groups[price]) {
                groups[price] = {
                    price: batch.sellingPrice,
                    totalStock: 0,
                    batches: []
                };
            }
            groups[price].totalStock += batch.remainingQuantity;
            groups[price].batches.push(batch);
        });
        
        return Object.values(groups).sort((a, b) => a.price - b.price);
    }, [batches]);

    if (!isOpen || !product) return null;

    const handleConfirm = () => {
        const batch = batches.find((b) => b.id === selectedBatchId);
        if (!batch) {
            alert("Please select a batch");
            return;
        }

        if (quantity > batch.remainingQuantity) {
            alert(`Only ${batch.remainingQuantity} items available in this batch`);
            return;
        }

        onSelectBatch(batch, quantity);
        setSelectedBatchId(null);
        setQuantity(1);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <p className="text-sm text-gray-600">Select batch and price</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Price Groups Overview */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">Available Prices & Stock</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {priceGroups.map((group, idx) => (
                            <div key={idx} className="bg-white p-3 rounded border border-blue-200">
                                <div className="text-lg font-bold text-green-600">
                                    Rs {group.price.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Stock: {group.totalStock} units
                                </div>
                                <div className="text-xs text-gray-500">
                                    {group.batches.length} batch(es)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Batch Selection by Price Group */}
                <div className="space-y-4 mb-4">
                    {priceGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="border rounded-lg p-4 bg-gray-50">
                            <h5 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                    Rs {group.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-600">
                                    ({group.totalStock} units available)
                                </span>
                            </h5>
                            
                            <div className="space-y-2">
                                {group.batches.map((batch) => (
                                    <div
                                        key={batch.id}
                                        onClick={() => setSelectedBatchId(batch.id)}
                                        className={`border rounded-lg p-3 cursor-pointer transition ${
                                            selectedBatchId === batch.id
                                                ? "border-blue-500 bg-blue-50 shadow-md"
                                                : "border-gray-300 bg-white hover:border-blue-300 hover:shadow"
                                        }`}
                                    >
                                        <div className="grid grid-cols-5 gap-3 items-center">
                                            <div>
                                                <div className="text-xs text-gray-600">Batch Number</div>
                                                <div className="font-semibold text-sm">{batch.batchNumber}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Supplier</div>
                                                <div className="font-medium text-sm">{batch.supplierName || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Available Stock</div>
                                                <div className="font-semibold text-green-600 text-sm">
                                                    {batch.remainingQuantity} units
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Cost Price</div>
                                                <div className="font-medium text-sm text-orange-600">
                                                    Rs {batch.costPrice.toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Expiry Date</div>
                                                <div className="font-medium text-sm">
                                                    {batch.expiryDate
                                                        ? new Date(batch.expiryDate).toLocaleDateString()
                                                        : "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Profit Margin Indicator */}
                                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                                            <div className="text-xs text-gray-600">
                                                Profit Margin: 
                                                <span className="font-semibold text-green-600 ml-1">
                                                    Rs {(batch.sellingPrice - batch.costPrice).toFixed(2)}
                                                    ({(((batch.sellingPrice - batch.costPrice) / batch.costPrice) * 100).toFixed(1)}%)
                                                </span>
                                            </div>
                                            {selectedBatchId === batch.id && (
                                                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                                                    ✓ SELECTED
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quantity Input */}
                {selectedBatchId && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <label className="block text-sm font-medium mb-2">Quantity to Add</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-bold"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={batches.find((b) => b.id === selectedBatchId)?.remainingQuantity || 1}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                className="w-24 border-2 border-gray-300 rounded p-2 text-center font-semibold text-lg"
                            />
                            <button
                                onClick={() => {
                                    const max = batches.find((b) => b.id === selectedBatchId)?.remainingQuantity || 1;
                                    setQuantity(Math.min(max, quantity + 1));
                                }}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-bold"
                            >
                                +
                            </button>
                            <div className="flex-1 text-right">
                                <div className="text-sm text-gray-600">Selected Batch Total:</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    Rs {((batches.find(b => b.id === selectedBatchId)?.sellingPrice || 0) * quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded hover:bg-gray-400 font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedBatchId}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                        Add to Cart (Rs {((batches.find(b => b.id === selectedBatchId)?.sellingPrice || 0) * quantity).toFixed(2)})
                    </button>
                </div>
            </div>
        </div>
    );
}