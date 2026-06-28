import React, { useState, useEffect, useRef } from "react";

export default function WeightInputModal({ isOpen, onClose, product, onConfirm }) {
  const [weight, setWeight] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setWeight("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      alert("Please enter a valid weight.");
      return;
    }
    onConfirm(w);
    setWeight("");
  };

  const handleClose = () => {
    setWeight("");
    onClose();
  };

  const append = (val) => setWeight((prev) => {
    if (val === "." && prev.includes(".")) return prev;
    if (val === "C") return "";
    return prev + val;
  });

  const backspace = () => setWeight((prev) => prev.slice(0, -1));

  const pad = ["1","2","3","4","5","6","7","8","9",".","0","C"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-orange-500 text-white rounded-t-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wide">Scale Product</p>
              <h3 className="text-lg font-bold mt-0.5 leading-tight">{product.name}</h3>
            </div>
            <span className="text-2xl">⚖️</span>
          </div>
          <div className="mt-3 bg-white/20 rounded-lg px-3 py-2 text-right">
            <span className="text-3xl font-mono font-bold">
              {weight || "0"}
            </span>
            <span className="text-lg ml-1 opacity-90">kg</span>
          </div>
        </div>

        {/* Keyboard-friendly text input */}
        <div className="px-4 pt-3">
          <input
            ref={inputRef}
            type="number"
            min="0.001"
            step="0.001"
            className="w-full border-2 border-orange-300 rounded-lg p-2 text-center text-lg font-mono focus:outline-none focus:border-orange-500"
            placeholder="Enter weight in kg"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onWheel={(e) => e.target.blur()}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") handleClose();
            }}
          />
        </div>

        {/* Numpad */}
        <div className="p-4 grid grid-cols-3 gap-2">
          {pad.map((k) => (
            <button
              key={k}
              onClick={() => k === "C" ? setWeight("") : append(k)}
              className={`py-3 rounded-lg text-lg font-bold transition active:scale-95 ${
                k === "C"
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {k}
            </button>
          ))}
          <button
            onClick={backspace}
            className="col-span-1 py-3 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-lg font-bold transition active:scale-95"
          >
            ⌫
          </button>
          <button
            onClick={handleClose}
            className="py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-semibold transition active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-bold transition active:scale-95"
          >
            Add ✓
          </button>
        </div>
      </div>
    </div>
  );
}
