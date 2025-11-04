import React, { useState } from "react";

export default function BatchSelectionModal({ isOpen, onClose, product, batches, onSelectBatch }) {
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [quantity, setQuantity] = useState(1);

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
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Select Batch for {product.name}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    This product has multiple batches with different prices. Please select one:
                </p>

                <div className="space-y-2 mb-4">
                    {batches.map((batch) => (
                        <div
                            key={batch.id}
                            onClick={() => setSelectedBatchId(batch.id)}
                            className={`border rounded-lg p-4 cursor-pointer transition ${selectedBatchId === batch.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-300 hover:border-blue-300"
                                }`}
                        >
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <div className="text-xs text-gray-600">Batch Number</div>
                                    <div className="font-semibold">{batch.batchNumber}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600">Selling Price</div>
                                    <div className="font-semibold text-green-600">
                                        Rs {batch.sellingPrice.toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600">Available</div>
                                    <div className="font-semibold">{batch.remainingQuantity}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600">Expiry</div>
                                    <div className="font-semibold text-sm">
                                        {batch.expiryDate
                                            ? new Date(batch.expiryDate).toLocaleDateString()
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedBatchId && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={batches.find((b) => b.id === selectedBatchId)?.remainingQuantity || 1}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-full border rounded p-2"
                        />
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedBatchId}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}