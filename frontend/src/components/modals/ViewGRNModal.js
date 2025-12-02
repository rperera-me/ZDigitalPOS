import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";

export default function ViewGRNModal({ isOpen, onClose, grn: initialGRN, onPaymentAdded }) {
  const user = useSelector((state) => state.auth.user);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // ✅ FIXED: Local state for GRN to enable updates
  const [grn, setGrn] = useState(initialGRN);

  // Payment form states
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("cash");
  const [newChequeNumber, setNewChequeNumber] = useState("");
  const [newChequeDate, setNewChequeDate] = useState("");
  const [newPaymentNotes, setNewPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPaid = useMemo(() => grn?.paymentStatus === 'paid', [grn]);
  const remainingAmount = useMemo(() =>
    grn ? grn.totalAmount - grn.paidAmount : 0,
    [grn]
  );

  // ✅ FIXED: Refresh GRN data from server
  const refreshGRN = async () => {
    if (!grn?.id) return;
    
    try {
      const response = await api.get(`/grn/${grn.id}`);
      setGrn(response.data);
      console.log("GRN refreshed:", response.data);
    } catch (error) {
      console.error("Failed to refresh GRN:", error);
    }
  };

  const fetchPayments = async () => {
    if (!grn) return;

    setLoadingPayments(true);
    try {
      const response = await api.get(`/grn/${grn.id}/payments`);
      setPayments(response.data || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // ✅ FIXED: Update local GRN when prop changes
  useEffect(() => {
    if (initialGRN) {
      setGrn(initialGRN);
    }
  }, [initialGRN]);

  useEffect(() => {
    if (isOpen && grn) {
      fetchPayments();
      const remainingAmount = grn.totalAmount - grn.paidAmount;
      setNewPaymentAmount(remainingAmount > 0 ? remainingAmount.toFixed(2) : "");
    }
  }, [isOpen, grn]);

  const handleSubmitPayment = async () => {
    if (!newPaymentAmount || parseFloat(newPaymentAmount) <= 0) {
      alert("Please enter valid payment amount");
      return;
    }

    const remainingAmount = grn.totalAmount - grn.paidAmount;
    if (parseFloat(newPaymentAmount) > remainingAmount) {
      alert(`Payment amount cannot exceed remaining amount: Rs ${remainingAmount.toFixed(2)}`);
      return;
    }

    if (newPaymentType === "cheque" && !newChequeNumber) {
      alert("Please enter cheque number");
      return;
    }

    const paymentData = {
      grnId: grn.id,
      paymentType: newPaymentType,
      amount: parseFloat(newPaymentAmount),
      chequeNumber: newPaymentType === "cheque" ? newChequeNumber : null,
      chequeDate: newPaymentType === "cheque" ? newChequeDate : null,
      notes: newPaymentNotes,
      recordedBy: user?.id || 1
    };

    setSubmitting(true);
    try {
      await api.post(`/grn/${grn.id}/payment`, paymentData);
      alert("Payment recorded successfully!");

      // Reset form
      setShowPaymentSection(false);
      setNewPaymentAmount("");
      setNewPaymentType("cash");
      setNewChequeNumber("");
      setNewChequeDate("");
      setNewPaymentNotes("");

      // ✅ FIXED: Update payment status first
      await api.put(`/grn/${grn.id}/payment-status`);

      // ✅ FIXED: Refresh all data in correct order
      await refreshGRN(); // Get updated GRN from server
      await fetchPayments(); // Get updated payments list

      // ✅ Notify parent components
      if (onPaymentAdded) {
        onPaymentAdded();
      }
      window.dispatchEvent(new CustomEvent('refreshSuppliers'));

    } catch (error) {
      console.error("Failed to record payment:", error);
      alert("Failed to record payment: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  if (!isOpen || !grn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-500 to-blue-700">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              GRN #{grn.id} - {grn.grnNumber}
            </h3>
            <p className="text-blue-100 text-sm mt-1">{grn.supplierName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* GRN Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
              <div className="text-xs text-blue-700 font-medium mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-blue-900">Rs {grn.totalAmount.toFixed(2)}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4">
              <div className="text-xs text-green-700 font-medium mb-1">Paid Amount</div>
              <div className="text-2xl font-bold text-green-900">Rs {grn.paidAmount.toFixed(2)}</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4">
              <div className="text-xs text-red-700 font-medium mb-1">Credit Amount</div>
              <div className="text-2xl font-bold text-red-900">Rs {remainingAmount.toFixed(2)}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-4">
              <div className="text-xs text-purple-700 font-medium mb-1">Payment Status</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border-2 ${getPaymentStatusColor(grn.paymentStatus)}`}>
                {grn.paymentStatus === 'paid' ? 'Paid' : grn.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* GRN Details */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Received Date:</span>
                <div className="font-semibold text-gray-800">{new Date(grn.receivedDate).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Received By:</span>
                <div className="font-semibold text-gray-800">{grn.receivedByName}</div>
              </div>
              {grn.notes && (
                <div className="col-span-2 md:col-span-1">
                  <span className="text-gray-600 font-medium">Notes:</span>
                  <div className="font-semibold text-gray-800">{grn.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Items Table - Abbreviated for space */}
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-200">
              <h4 className="font-semibold text-lg text-gray-800">Items ({grn.items?.length || 0})</h4>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">Product</th>
                    <th className="p-3 text-center text-sm font-semibold text-gray-700 border-b">Qty</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">Cost</th>
                    <th className="p-3 text-right text-sm font-semibold text-gray-700 border-b">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {grn.items?.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="p-3 font-medium text-gray-900">{item.productName}</td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold text-sm">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-orange-600">
                        Rs {item.costPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-green-600">
                        Rs {(item.costPrice * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-100 px-4 py-3 border-b-2 border-gray-200 flex justify-between items-center">
              <h4 className="font-semibold text-lg text-gray-800">Payment History ({payments.length})</h4>

              {!isPaid && !showPaymentSection && (
                <button
                  onClick={() => setShowPaymentSection(true)}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold flex items-center gap-2 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Payment
                </button>
              )}
            </div>

            {/* Add Payment Section */}
            {showPaymentSection && !isPaid && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                <h5 className="font-semibold text-lg text-green-900 mb-4">Record New Payment</h5>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Payment Amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newPaymentAmount}
                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max={remainingAmount}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        Max: Rs {remainingAmount.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Payment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newPaymentType}
                        onChange={(e) => setNewPaymentType(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      >
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {newPaymentType === "cheque" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                          Cheque Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newChequeNumber}
                          onChange={(e) => setNewChequeNumber(e.target.value)}
                          className="w-full border-2 border-yellow-400 rounded-lg p-2.5 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200"
                          placeholder="Cheque Number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Cheque Date</label>
                        <input
                          type="date"
                          value={newChequeDate}
                          onChange={(e) => setNewChequeDate(e.target.value)}
                          className="w-full border-2 border-yellow-400 rounded-lg p-2.5 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-200"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">Payment Notes</label>
                    <textarea
                      value={newPaymentNotes}
                      onChange={(e) => setNewPaymentNotes(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg p-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      rows="2"
                      placeholder="Additional notes about this payment..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmitPayment}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Recording...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Record Payment
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowPaymentSection(false)}
                      disabled={submitting}
                      className="px-6 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payments List */}
            <div className="p-4">
              {loadingPayments ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <p className="mt-2 text-gray-600">Loading payments...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="font-medium">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.map((payment, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl font-bold text-green-700">
                              Rs {payment.amount.toFixed(2)}
                            </span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-300">
                              {payment.paymentType === 'cash' ? 'Cash' :
                                payment.paymentType === 'cheque' ? 'Cheque' :
                                  'Bank Transfer'}
                            </span>
                          </div>

                          {payment.paymentType === 'cheque' && payment.chequeNumber && (
                            <div className="text-sm text-gray-700 mb-1">
                              <span className="font-medium">Cheque #:</span> {payment.chequeNumber}
                              {payment.chequeDate && ` (${new Date(payment.chequeDate).toLocaleDateString()})`}
                            </div>
                          )}

                          {payment.notes && (
                            <div className="text-sm text-gray-600 italic mt-2 p-2 bg-white rounded border border-green-200">
                              {payment.notes}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            Recorded by {payment.recordedByName} on {new Date(payment.paymentDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition font-semibold flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}