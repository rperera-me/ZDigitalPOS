import React, { useState, useEffect, useCallback, useMemo } from "react";

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

  const [activeTab, setActiveTab] = useState('cash');

  // ✅ Memoize calculations to prevent unnecessary re-renders
  const discountAmount = useMemo(() => {
    const total = getTotalAmount();
    if (!discountValue || isNaN(discountValue)) return 0;

    if (discountType === "percentage") {
      return (total * parseFloat(discountValue)) / 100;
    } else {
      return Math.min(parseFloat(discountValue), total);
    }
  }, [discountType, discountValue, getTotalAmount]);

  const totalAfterDiscount = useMemo(() => {
    return getTotalAmount() - discountAmount;
  }, [getTotalAmount, discountAmount]);

  // ✅ Memoize payment calculations
  const { cashPaid, cardPaid, creditPaid, totalPaid, balance } = useMemo(() => {
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    const credit = parseFloat(creditAmount) || 0;
    const total = cash + card + credit;
    const bal = total - totalAfterDiscount;

    return {
      cashPaid: cash,
      cardPaid: card,
      creditPaid: credit,
      totalPaid: total,
      balance: bal
    };
  }, [cashAmount, cardAmount, creditAmount, totalAfterDiscount]);

  // Auto-calculate credit amount - use useCallback to prevent re-creation
  useEffect(() => {
    const remaining = totalAfterDiscount - cashPaid - cardPaid;
    if (remaining > 0 && activeTab === 'credit') {
      setCreditAmount(remaining.toFixed(2));
    }
  }, [totalAfterDiscount, cashPaid, cardPaid, activeTab]);

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
      setActiveTab('cash');
    }
  }, [isOpen, currentCustomer]);

  // ✅ Use useCallback for event handlers to prevent re-creation
  const handleCashChange = useCallback((e) => {
    setCashAmount(e.target.value);
  }, []);

  const handleCardAmountChange = useCallback((e) => {
    setCardAmount(e.target.value);
  }, []);

  const handleCardLastFourChange = useCallback((e) => {
    setCardLastFour(e.target.value.replace(/\D/g, ''));
  }, []);

  const handleCreditAmountChange = useCallback((e) => {
    setCreditAmount(e.target.value);
  }, []);

  const handleDiscountValueChange = useCallback((e) => {
    setDiscountValue(e.target.value);
  }, []);

  const handleCreditCustomerChange = useCallback((e) => {
    const customer = customers.find((c) => c.id === parseInt(e.target.value));
    setCreditCustomer(customer || null);
  }, [customers]);

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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Processing
          </h3>
          <button onClick={onClose} type="button" className="text-gray-500 hover:text-gray-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount Summary */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b-2 border-gray-200">
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

        {/* ✅ Scrollable Content Area with Tabs */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="border-b-2 border-gray-200 px-6 pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('cash')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'cash'
                    ? 'bg-green-100 text-green-700 border-2 border-b-0 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Cash Payment
              </button>
              <button
                onClick={() => setActiveTab('card')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'card'
                    ? 'bg-blue-100 text-blue-700 border-2 border-b-0 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Card Payment
              </button>
              <button
                onClick={() => setActiveTab('credit')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'credit'
                    ? 'bg-orange-100 text-orange-700 border-2 border-b-0 border-orange-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Credit Payment
              </button>
              <button
                onClick={() => setActiveTab('discount')}
                className={`px-4 py-2 font-semibold rounded-t-lg transition ${activeTab === 'discount'
                    ? 'bg-purple-100 text-purple-700 border-2 border-b-0 border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Discount
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-4">
            {/* Cash Tab */}
            {activeTab === 'cash' && (
              <div className="space-y-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={handleCashChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
                  placeholder="Enter cash amount"
                  autoComplete="off"
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
            )}

            {/* Card Tab */}
            {activeTab === 'card' && (
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength="4"
                  value={cardLastFour}
                  onChange={handleCardLastFourChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Last 4 digits"
                  autoComplete="off"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={handleCardAmountChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="Enter card amount"
                  autoComplete="off"
                />
              </div>
            )}

            {/* Credit Tab */}
            {activeTab === 'credit' && (
              <div className="space-y-3">
                {!currentCustomer ? (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <p className="font-medium mb-2">No customer selected</p>
                      <p>To use credit payment, please add or select a customer.</p>
                    </div>
                    <select
                      value={creditCustomer?.id || ""}
                      onChange={handleCreditCustomerChange}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-orange-500"
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('openCustomerModal'));
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold flex items-center justify-center gap-2 shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Customer
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={creditCustomer?.id || ""}
                      onChange={handleCreditCustomerChange}
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
                      onChange={handleCreditAmountChange}
                      className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-orange-500 bg-orange-50"
                      placeholder="Credit amount (auto-calculated)"
                      readOnly
                    />
                  </>
                )}
              </div>
            )}

            {/* Discount Tab */}
            {activeTab === 'discount' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
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
                    onChange={handleDiscountValueChange}
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
            )}
          </div>

          {/* Payment Summary */}
          <div className="px-6 pb-4">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
              <h4 className="font-semibold text-gray-700 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Payable:</span>
                  <span className="font-semibold">Rs {totalAfterDiscount.toFixed(2)}</span>
                </div>
                {cashPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cash Amount:</span>
                    <span className="font-semibold text-green-600">Rs {cashPaid.toFixed(2)}</span>
                  </div>
                )}
                {cardPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Card Amount:</span>
                    <span className="font-semibold text-blue-600">Rs {cardPaid.toFixed(2)}</span>
                  </div>
                )}
                {creditPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Amount:</span>
                    <span className="font-semibold text-orange-600">Rs {creditPaid.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="font-semibold">Rs {totalPaid.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Fixed Action Buttons with Balance - stays at bottom */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 bg-white">
          {/* Balance Display */}
          <div className="px-6 pt-3 pb-2">
            <div className={`rounded-lg p-3 ${totalPaid >= totalAfterDiscount ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 text-lg">
                  {totalPaid >= totalAfterDiscount ? 'Balance/Change:' : 'Remaining:'}
                </span>
                <span className={`text-2xl font-bold ${totalPaid >= totalAfterDiscount ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPaid < totalAfterDiscount && "-"}
                  Rs {Math.abs(totalPaid - totalAfterDiscount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
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
          </div>
        </div>
      </div>
    </div>
  );
}