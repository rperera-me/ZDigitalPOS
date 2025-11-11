import React, { useState, useEffect, useCallback, useMemo } from "react";

export default function PaymentModal({
  isOpen,
  onClose,
  onPay,
  getTotalAmount,
  customers,
  currentCustomer,
  customerType = "walk-in"
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

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    const total = getTotalAmount();
    if (!discountValue || isNaN(discountValue)) return 0;

    if (discountType === "percentage") {
      return (total * parseFloat(discountValue)) / 100;
    } else {
      return Math.min(parseFloat(discountValue), total);
    }
  }, [discountType, discountValue, getTotalAmount]);

  // Calculate total after discount
  const totalAfterDiscount = useMemo(() => {
    return getTotalAmount() - discountAmount;
  }, [getTotalAmount, discountAmount]);

  // Calculate payment totals
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

  // Auto-calculate credit amount when credit tab is active and customer is selected
  useEffect(() => {
    if (activeTab === 'credit' && creditCustomer) {
      const remaining = totalAfterDiscount - cashPaid - cardPaid;
      if (remaining > 0) {
        setCreditAmount(remaining.toFixed(2));
      }
    }
  }, [activeTab, creditCustomer, totalAfterDiscount, cashPaid, cardPaid]);

  // Sync credit customer with current customer from sale
  useEffect(() => {
    if (isOpen && currentCustomer && (customerType === "loyalty" || customerType === "wholesale")) {
      console.log("🔄 Syncing customer to payment modal:", currentCustomer); // ✅ Debug log
      setCreditCustomer(currentCustomer);

      // Auto-switch to credit tab if customer has credit or if credit payment makes sense
      if (currentCustomer.creditBalance > 0 || customerType === "loyalty" || customerType === "wholesale") {
        setActiveTab('credit');
      }
    }
  }, [isOpen, currentCustomer, customerType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashAmount("");
      setCardAmount("");
      setCardLastFour("");
      setCreditAmount("");
      if (customerType !== "walk-in" && currentCustomer) {
        setCreditCustomer(currentCustomer);
      } else {
        setCreditCustomer(null);
      }
      setDiscountType("percentage");
      setDiscountValue("");
      setActiveTab('cash');
    }
  }, [isOpen, currentCustomer, customerType]);

  // Event handlers
  const handleCashChange = useCallback((e) => {
    setCashAmount(e.target.value);
  }, []);

  const handleCardAmountChange = useCallback((e) => {
    setCardAmount(e.target.value);
  }, []);

  const handleCardLastFourChange = useCallback((e) => {
    setCardLastFour(e.target.value.replace(/\D/g, ''));
  }, []);

  const handleCreditCustomerChange = useCallback((e) => {
    const customer = customers.find((c) => c.id === parseInt(e.target.value));
    setCreditCustomer(customer || null);
  }, [customers]);

  const handleDiscountValueChange = useCallback((e) => {
    setDiscountValue(e.target.value);
  }, []);

  const handleQuickCash = useCallback((amount) => {
    const currentAmount = parseFloat(cashAmount) || 0;
    setCashAmount((currentAmount + amount).toString());
  }, [cashAmount]);

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

  // Filter customers by type
  const filteredCustomers = customers.filter(c => {
    if (customerType === "loyalty") return c.type === "loyalty";
    if (customerType === "wholesale") return c.type === "wholesale";
    return false;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Processing
          </h3>
          <button onClick={onClose} type="button" className="text-white hover:text-gray-700 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Amount Summary */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex justify-between items-center">
            {discountAmount > 0 ? (
              // Show Subtotal and Discount when discount is applied
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-600">Subtotal</div>
                  <div className="text-lg font-semibold text-gray-700">Rs {getTotalAmount().toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Discount</div>
                  <div className="text-lg font-semibold text-red-600">- Rs {discountAmount.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              // Empty div to maintain layout when no discount
              <div></div>
            )}
            <div className="text-right">
              <div className="text-xs text-gray-600">Total Payable</div>
              <div className="text-2xl font-bold text-blue-600">Rs {totalAfterDiscount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab('cash')}
              className={`flex-1 px-3 py-2 font-semibold text-sm transition ${activeTab === 'cash'
                ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              💵 Cash
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 px-3 py-2 font-semibold text-sm transition ${activeTab === 'card'
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              💳 Card
            </button>
            {/* ✅ ONLY SHOW CREDIT TAB IF NOT WALK-IN */}
            {customerType !== "walk-in" && (
              <button
                onClick={() => setActiveTab('credit')}
                className={`flex-1 px-3 py-2 font-semibold text-sm transition ${activeTab === 'credit'
                  ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                📋 Credit
              </button>
            )}
            <button
              onClick={() => setActiveTab('discount')}
              className={`flex-1 px-3 py-2 font-semibold text-sm transition ${activeTab === 'discount'
                ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              🏷️ Discount
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Cash Tab */}
          {activeTab === 'cash' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Cash Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={handleCashChange}
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-green-500"
                placeholder="Enter cash amount"
                autoComplete="off"
                autoFocus
              />
              {/* Quick Cash Amount Tiles */}
              <div className="grid grid-cols-5 gap-2">
                {[50, 100, 500, 1000, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickCash(amount)}
                    className="bg-white hover:bg-green-200 text-green-700 font-semibold py-2 px-1 rounded-lg border-2 border-green-300 transition active:scale-95"
                  >
                    +{amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Tab */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 Digits of Card</label>
                <input
                  type="text"
                  maxLength="4"
                  value={cardLastFour}
                  onChange={handleCardLastFourChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                  placeholder="****"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={handleCardAmountChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:border-blue-500"
                  placeholder="Enter card amount"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Credit Tab */}
          {activeTab === 'credit' && customerType !== "walk-in" && (
            <div className="space-y-3">
              {/* Customer Selection - Auto-filled if customer already selected */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer
                </label>
                <select
                  value={creditCustomer?.id || ""}
                  onChange={handleCreditCustomerChange}
                  className="w-full border-2 border-gray-300 rounded-lg p-3 focus:outline-none focus:border-orange-500"
                  disabled={!!currentCustomer} // ✅ Disable if customer already selected from sale
                >
                  <option value="">-- Select Customer --</option>
                  {filteredCustomers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} - {cust.phone}
                    </option>
                  ))}
                </select>
                {currentCustomer && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Customer auto-loaded from sale
                  </p>
                )}
              </div>

              {creditCustomer && (
                <>
                  {/* Customer Summary */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-lg p-3">
                    <h4 className="font-semibold text-orange-900 mb-2 text-sm">Customer Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Name:</span>
                        <span className="font-semibold text-gray-900">{creditCustomer.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Phone:</span>
                        <span className="font-semibold text-gray-900">{creditCustomer.phone}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-orange-300">
                        <span className="text-gray-700">Current Credit Balance:</span>
                        <span className="font-bold text-orange-600">
                          Rs {(creditCustomer.creditBalance || 0).toFixed(2)}
                        </span>
                      </div>
                      {customerType === "loyalty" && creditCustomer.loyaltyPoints !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Loyalty Points:</span>
                          <span className="font-bold text-purple-600">{creditCustomer.loyaltyPoints || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credit Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={creditAmount}
                      readOnly
                      className="w-full border-2 border-orange-300 rounded-lg p-3 text-lg bg-orange-50 font-bold text-orange-600"
                      placeholder="Auto-calculated"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      * Credit amount is automatically calculated based on remaining payment
                    </p>
                  </div>

                  {/* New Balance Preview */}
                  {creditPaid > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">New Credit Balance:</span>
                        <span className="text-lg font-bold text-red-600">
                          Rs {((creditCustomer.creditBalance || 0) + creditPaid).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!creditCustomer && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-blue-800 font-medium">Please select a customer to use credit payment</p>
                </div>
              )}
            </div>
          )}

          {/* Discount Tab */}
          {activeTab === 'discount' && (
            <div className="space-y-3">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-purple-900 mb-3">Apply Discount</label>
                <div className="flex items-center gap-3">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="border-2 border-purple-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Amount (Rs)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={handleDiscountValueChange}
                    className="flex-1 border-2 border-purple-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-purple-500"
                    placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-900">Discount Applied:</span>
                      <span className="text-lg font-bold text-purple-600">- Rs {discountAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="mt-4 bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
            <h4 className="font-semibold text-gray-700 mb-2 text-sm">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Payable:</span>
                <span className="font-semibold">Rs {totalAfterDiscount.toFixed(2)}</span>
              </div>
              {cashPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash:</span>
                  <span className="font-semibold text-green-600">Rs {cashPaid.toFixed(2)}</span>
                </div>
              )}
              {cardPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Card:</span>
                  <span className="font-semibold text-blue-600">Rs {cardPaid.toFixed(2)}</span>
                </div>
              )}
              {creditPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit:</span>
                  <span className="font-semibold text-orange-600">Rs {creditPaid.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                <span className="text-gray-700">Total Paid:</span>
                <span className={totalPaid >= totalAfterDiscount ? 'text-green-600' : 'text-red-600'}>
                  Rs {totalPaid.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Balance and Action Buttons */}
        <div className="border-t-2 border-gray-200 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 p-4">
          {/* Balance Display */}
          <div className={`rounded-lg p-3 mb-3 border-2 ${totalPaid >= totalAfterDiscount
            ? 'bg-white border-green-600'
            : 'bg-white border-red-600'
            }`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">
                {totalPaid >= totalAfterDiscount ? 'Change:' : 'Remaining:'}
              </span>
              <span className={`text-2xl font-bold ${totalPaid >= totalAfterDiscount ? 'text-green-600' : 'text-red-600'
                }`}>
                {totalPaid < totalAfterDiscount && "-"}
                Rs {Math.abs(totalPaid - totalAfterDiscount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={
                totalPaid < totalAfterDiscount ||
                (cardPaid > 0 && cardLastFour.length !== 4) ||
                (creditPaid > 0 && !creditCustomer)
              }
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete Payment
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}