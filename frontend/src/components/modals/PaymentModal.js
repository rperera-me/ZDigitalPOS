import React, { useState, useEffect } from "react";

export default function PaymentModal({
  isOpen,
  onClose,
  onPay,
  getTotalAmount,
  customers,
  currentCustomer,
}) {
  // Payment method states
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditCustomer, setCreditCustomer] = useState(null);

  // Discount states
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  // Collapsible states - simplified to single source of truth
  const [activeSection, setActiveSection] = useState('cash');

  // Calculate discount amount
  const calculateDiscount = () => {
    const total = getTotalAmount();
    if (!discountValue || isNaN(discountValue)) return 0;

    if (discountType === "percentage") {
      return (total * parseFloat(discountValue)) / 100;
    } else {
      return Math.min(parseFloat(discountValue), total);
    }
  };

  const discountAmount = calculateDiscount();
  const totalAfterDiscount = getTotalAmount() - discountAmount;

  // Calculate totals
  const cashPaid = parseFloat(cashAmount) || 0;
  const cardPaid = parseFloat(cardAmount) || 0;
  const creditPaid = parseFloat(creditAmount) || 0;
  const totalPaid = cashPaid + cardPaid + creditPaid;
  const balance = totalPaid - totalAfterDiscount;

  // Auto-calculate credit amount
  useEffect(() => {
    const remaining = totalAfterDiscount - cashPaid - cardPaid;
    if (remaining > 0 && activeSection === 'credit') {
      setCreditAmount(remaining.toFixed(2));
    }
  }, [totalAfterDiscount, cashPaid, cardPaid, activeSection]);

  // Sync credit customer with current customer
  useEffect(() => {
    if (currentCustomer) {
      setCreditCustomer(currentCustomer);
    }
  }, [currentCustomer]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashAmount("");
      setCardAmount("");
      setCardLastFour("");
      setCreditAmount("");
      setCreditCustomer(currentCustomer);
      setDiscountType("percentage");
      setDiscountValue("");
      setActiveSection('cash');
    }
  }, [isOpen]);

  // ✅ Add check to prevent rendering when closed
  if (!isOpen) return null;

  const handlePay = () => {
    // Validation
    if (totalPaid < totalAfterDiscount) {
      alert(`Insufficient payment. Need Rs ${(totalAfterDiscount - totalPaid).toFixed(2)} more.`);
      return;
    }

    if (cardPaid > 0 && cardLastFour.length !== 4) {
      alert("Please enter last 4 digits of card.");
      return;
    }

    if (creditPaid > 0 && !creditCustomer) {
      alert("Please select a customer for credit payment.");
      return;
    }

    // Prepare payment data
    const paymentData = {
      totalAmount: getTotalAmount(),
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      discountAmount,
      finalAmount: totalAfterDiscount,
      payments: [],
      customer: creditCustomer,
      balance: balance >= 0 ? balance : 0,
    };

    if (cashPaid > 0) {
      paymentData.payments.push({ type: "Cash", amount: cashPaid });
    }
    if (cardPaid > 0) {
      paymentData.payments.push({ type: "Card", amount: cardPaid, cardLastFour });
    }
    if (creditPaid > 0) {
      paymentData.payments.push({ type: "Credit", amount: creditPaid, customerId: creditCustomer?.id });
    }

    onPay(paymentData);
    onClose(); // ✅ Close modal after successful payment
  };

  const CollapsibleSection = ({ title, icon, children, badge, sectionId }) => {
    const isOpen = activeSection === sectionId;
    
    return (
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveSection(isOpen ? null : sectionId)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-gray-800">{title}</span>
            {badge > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Rs {badge.toFixed(2)}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && <div className="p-4 bg-white">{children}</div>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Processing
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount Summary */}
        <div className="mb-6 space-y-2">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Subtotal:</span>
              <span className="text-xl font-bold text-gray-800">Rs {getTotalAmount().toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-sm text-red-600 mb-2">
                <span>Discount ({discountType === "percentage" ? `${discountValue}%` : `Rs ${discountValue}`}):</span>
                <span className="font-semibold">- Rs {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="text-gray-700 font-semibold text-lg">Total Payable:</span>
              <span className="text-2xl font-bold text-blue-600">Rs {totalAfterDiscount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Discount:</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="percentage">%</option>
              <option value="amount">Rs</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
            />
            {discountAmount > 0 && (
              <span className="text-sm font-semibold text-purple-600 whitespace-nowrap">
                - Rs {discountAmount.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* Cash Payment */}
          <CollapsibleSection
            title="Cash Payment"
            icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>}
            badge={cashPaid}
            sectionId="cash"
          >
            <div className="space-y-3">
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
                placeholder="Enter cash amount"
              />
              {cashPaid > 0 && (
                <div className={`p-3 rounded-lg border-2 ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Change:</span>
                    <span className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs {Math.max(0, balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <div className="grid grid-cols-2 gap-3">
            {/* Card Payment */}
            <CollapsibleSection
              title="Card Payment"
              icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>}
              badge={cardPaid}
              sectionId="card"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength="4"
                  value={cardLastFour}
                  onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ''))}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Last 4 digits"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Enter card amount"
                />
              </div>
            </CollapsibleSection>

            {/* Credit Payment */}
            <CollapsibleSection
              title="Credit Payment"
              icon={<svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>}
              badge={creditPaid}
              sectionId="credit"
            >
              <div className="space-y-3">
                {!currentCustomer ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    Please select a customer from the cashier page first.
                  </div>
                ) : (
                  <>
                    <select
                      value={creditCustomer?.id || ""}
                      onChange={(e) => {
                        const customer = customers.find((c) => c.id === parseInt(e.target.value));
                        setCreditCustomer(customer || null);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                        </option>
                      ))}
                    </select>

                    {creditCustomer && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Customer:</span>
                            <span className="font-semibold">{creditCustomer.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Existing Credit:</span>
                            <span className="font-semibold text-orange-600">
                              Rs {creditCustomer.creditBalance?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-orange-500 bg-orange-50"
                      placeholder="Credit amount (auto-calculated)"
                      readOnly
                    />
                  </>
                )}
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mt-4 bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Payable:</span>
              <span className="font-semibold">Rs {totalAfterDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Paid:</span>
              <span className="font-semibold">Rs {totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="font-semibold text-gray-700">Balance:</span>
              <span className={`text-lg font-bold ${totalPaid >= totalAfterDiscount ? 'text-green-600' : 'text-red-600'}`}>
                Rs {Math.abs(totalPaid - totalAfterDiscount).toFixed(2)}
                {totalPaid < totalAfterDiscount && " (Short)"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={totalPaid < totalAfterDiscount || (cardPaid > 0 && cardLastFour.length !== 4) || (creditPaid > 0 && !creditCustomer)}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Complete Payment
          </button>
        </div>

        {/* Error Messages */}
        {totalPaid < totalAfterDiscount && totalPaid > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">
                Payment short by Rs {(totalAfterDiscount - totalPaid).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
