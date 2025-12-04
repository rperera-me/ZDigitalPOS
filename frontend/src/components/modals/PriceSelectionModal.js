import React, { useState } from "react";

export default function PriceSelectionModal({ isOpen, onClose, product, priceVariants, onSelectPrice, customerType = "retail" }) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);

    if (!isOpen || !product || !priceVariants || priceVariants.length === 0) return null;

    // ✅ Determine which price to display based on customer type
    const getPriceForCustomer = (variant) => {
        switch (customerType) {
            case "wholesale":
                return variant.wholesalePrice;
            default:
                return variant.sellingPrice;
        }
    };

    const handleConfirm = () => {
        if (!selectedVariant) {
            alert("Please select a price");
            return;
        }

        if (quantity > selectedVariant.totalStock) {
            alert(`Only ${selectedVariant.totalStock} items available at this price`);
            return;
        }

        const price = getPriceForCustomer(selectedVariant);
        onSelectPrice(selectedVariant, price, quantity);
        setSelectedVariant(null);
        setQuantity(1);
    };

    const handleClose = () => {
        setSelectedVariant(null);
        setQuantity(1);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 max-w-xl w-full max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="text-xs text-gray-600">
                            Total Stock: <span className="font-semibold">
                                {priceVariants.reduce((sum, v) => sum + v.totalStock, 0)} units
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Price Variants */}
                <div className="space-y-2 mb-3">
                    {priceVariants.map((variant, index) => {
                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedVariant(variant)}
                                className={`border rounded-lg p-3 cursor-pointer transition ${selectedVariant === variant
                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                    : "border-gray-300 hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        {/* Price */}
                                        <div className="text-lg font-bold text-blue-600">
                                            Rs {variant.productPrice.toFixed(2)}
                                        </div>

                                        {/* Stock Available */}
                                        <div className="flex items-center gap-1 text-xs text-green-600">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <span className="font-semibold">{variant.totalStock} available</span>
                                        </div>

                                        {/* Batch Number */}
                                        {variant.sources && variant.sources.length > 0 && (
                                            <div className="text-xs text-gray-500">
                                                Batch: <span className="font-mono font-semibold">{variant.sources[0].sourceReference || 'N/A'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selection Indicator */}
                                    {selectedVariant === variant && (
                                        <div className="bg-blue-500 text-white p-1 rounded-full">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action Controls Wrapper */}
                <div className="w-full p-4 flex flex-row gap-4">
                    {/* Left side: Cancel button */}
                    <div className="w-1/2 flex items-end">
                        <button
                            onClick={handleClose}
                            className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-semibold text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                    {/* Right side: Quantity row above Add to Cart in a vertical column */}
                    <div className="w-1/2 flex flex-col items-end gap-2">
                        {selectedVariant && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Quantity</span>
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded font-bold text-sm"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedVariant.totalStock}
                                        value={quantity}
                                        onChange={(e) =>
                                            setQuantity(Math.min(selectedVariant.totalStock, parseInt(e.target.value) || 1))
                                        }
                                        className="w-12 border border-gray-300 rounded p-1 text-center font-bold text-sm"
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(selectedVariant.totalStock, quantity + 1))}
                                        className="bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded font-bold text-sm"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedVariant}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm mt-2"
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}