import React, { useState } from "react";

export default function PriceSelectionModal({ isOpen, onClose, product, priceVariants, onSelectPrice, customerType = "retail" }) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1);

    if (!isOpen || !product || !priceVariants || priceVariants.length === 0) return null;

    // ✅ Determine which price to display based on customer type
    const getPriceForCustomer = (variant) => {
        switch (customerType) {
            case "wholesale":
                return variant.wholesalePrice || variant.sellingPrice;
            case "retail":
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                            Select price - Total Stock: <span className="font-semibold">
                                {priceVariants.reduce((sum, v) => sum + v.totalStock, 0)} units
                            </span>
                        </p>
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

                {/* Customer Type Badge */}
                <div className="mb-4 inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {customerType === "wholesale" ? "Wholesale Customer" : "Retail Customer"}
                </div>

                {/* Price Variants */}
                <div className="space-y-3 mb-4">
                    {priceVariants.map((variant, index) => {
                        const displayPrice = getPriceForCustomer(variant);
                        const discount = variant.productPrice > displayPrice 
                            ? ((variant.productPrice - displayPrice) / variant.productPrice * 100).toFixed(1)
                            : 0;

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedVariant(variant)}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                                    selectedVariant === variant
                                        ? "border-blue-500 bg-blue-50 shadow-lg"
                                        : "border-gray-300 hover:border-blue-300 hover:shadow"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            {/* Product Price (MRP/Original) */}
                                            <div>
                                                <div className="text-xs text-gray-500">Product Price (MRP)</div>
                                                <div className={`text-lg font-bold ${
                                                    discount > 0 ? 'line-through text-gray-400' : 'text-gray-800'
                                                }`}>
                                                    Rs {variant.productPrice.toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Display Price (Selling/Wholesale) */}
                                            <div>
                                                <div className="text-xs text-gray-500">
                                                    {customerType === "wholesale" ? "Wholesale Price" : "Selling Price (Retail)"}
                                                </div>
                                                <div className="text-2xl font-bold text-green-600">
                                                    Rs {displayPrice.toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Discount Badge */}
                                            {discount > 0 && (
                                                <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                    {discount}% OFF
                                                </div>
                                            )}
                                        </div>

                                        {/* Stock Info */}
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                </svg>
                                                <span className="text-sm font-semibold text-green-600">
                                                    {variant.totalStock} available
                                                </span>
                                            </div>

                                            {/* Source Count */}
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-xs text-gray-500">
                                                    {variant.sources.length} source(s)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection Indicator */}
                                    {selectedVariant === variant && (
                                        <div className="bg-blue-500 text-white p-2 rounded-full">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Source Details (Expandable) */}
                                {selectedVariant === variant && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="text-xs text-gray-600 font-semibold mb-2">Stock Sources:</div>
                                        <div className="space-y-1">
                                            {variant.sources.map((source, idx) => (
                                                <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded border">
                                                    <span className="font-mono text-blue-600">{source.grnNumber}</span>
                                                    {source.sourceReference && (
                                                        <span className="text-gray-600">Ref: {source.sourceReference}</span>
                                                    )}
                                                    <span className="font-semibold">{source.stock} units</span>
                                                    <span className="text-gray-500">{new Date(source.receivedDate).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Quantity Selection */}
                {selectedVariant && (
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <label className="block text-sm font-medium mb-2">Quantity</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-bold text-lg"
                            >
                                −
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={selectedVariant.totalStock}
                                value={quantity}
                                onChange={(e) => setQuantity(Math.min(selectedVariant.totalStock, parseInt(e.target.value) || 1))}
                                className="w-24 border-2 border-gray-300 rounded p-2 text-center font-bold text-xl"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(selectedVariant.totalStock, quantity + 1))}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded font-bold text-lg"
                            >
                                +
                            </button>
                            <div className="flex-1 text-right">
                                <div className="text-sm text-gray-600">Line Total:</div>
                                <div className="text-3xl font-bold text-blue-600">
                                    Rs {(getPriceForCustomer(selectedVariant) * quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedVariant}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
                    >
                        Add to Cart 
                        {selectedVariant && ` - Rs ${(getPriceForCustomer(selectedVariant) * quantity).toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}