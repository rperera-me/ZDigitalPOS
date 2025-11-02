import React, { useRef, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios";
import {
  setCategories,
  setProducts,
  addSaleItem,
  removeSaleItem,
  updateQuantity,
  clearSale,
  setHoldSales,
  setCustomers,
  setCustomer,
  setPaymentMethod,
  setCashGiven,
  setCategoryId,
} from "../app/posSlice";
import ReceiptModal from "../components/receipt/ReceiptPreviewModal";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import storeSetting from "../config/storeSettings";

export default function CashierPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector((state) => state.pos.categories);
  const products = useSelector((state) => state.pos.products);
  const saleItems = useSelector((state) => state.pos.saleItems);
  const holdSales = useSelector((state) => state.pos.holdSales);
  const customers = useSelector((state) => state.pos.customers);
  const currentCustomer = useSelector((state) => state.pos.currentCustomer);
  const paymentMethod = useSelector((state) => state.pos.paymentMethod);
  const cashGiven = useSelector((state) => state.pos.cashGiven);
  const selectedCategoryId = useSelector((state) => state.pos.selectedCategoryId);

  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef();

  const { i18n } = useTranslation();
  const filteredProducts = useMemo(() => {
    if (searchTerm.length >= 3) {
      return products
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return products;
  }, [products, searchTerm]);

  console.log("filteredProducts", filteredProducts);
  console.log("products", products);

  useEffect(() => {
    let buffer = "";
    let timer = null;
    function onKeyDown(e) {
      if (timer) clearTimeout(timer);
      if (e.key === "Enter") {
        if (buffer.length > 0) {
          handleBarcodeAdd(buffer);
          buffer = "";
        }
      } else {
        buffer += e.key;
        timer = setTimeout(() => (buffer = ""), 100);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    api.get("/category").then((res) => {
      dispatch(setCategories(res.data));
      if (res.data.length > 0) dispatch(setCategoryId(res.data[0].id));
    });
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
    fetchHoldSales();
  }, [dispatch]);

  useEffect(() => {
    if (selectedCategoryId) {
      api.get(`/product/category/${selectedCategoryId}`).then((res) =>
        dispatch(setProducts(res.data))
      );
    } else {
      api.get("/product").then((res) => dispatch(setProducts(res.data)));
    }
  }, [selectedCategoryId, dispatch]);

  // useEffect(() => {
  //   function syncOfflineSales() {
  //     window.electronAPI.send("syncSales");
  //   }

  //   window.addEventListener("online", syncOfflineSales);

  //   window.electronAPI.on("syncComplete", () => {
  //     fetchHoldSales();
  //     alert("Offline sales synced!");
  //   });

  //   return () => window.removeEventListener("online", syncOfflineSales);
  // }, [dispatch]);

  const getTotalAmount = () =>
    saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const balance = (parseFloat(cashGiven) || 0) - getTotalAmount();

  function isOnline() {
    return window.navigator.onLine;
  }

  function saveSaleOffline(salePayload) {
    // Electron's exposed API to send data to main process
    window.electronAPI.send("saveSale", salePayload);
  }

  function fetchHoldSales() {
    api.get("/sale/held").then((res) => dispatch(setHoldSales(res.data)));
  }

  function onAddProduct(product) {
    dispatch(
      addSaleItem({
        productId: product.id,
        name: product.name,
        price: product.priceRetail,
        quantity: 1,
      })
    );
  }

  function onRemoveSaleItem(productId) {
    dispatch(removeSaleItem(productId));
  }

  function onUpdateQuantity(productId, quantity) {
    if (quantity < 1) return;
    dispatch(updateQuantity({ productId, quantity }));
  }

  function handleBarcodeAdd(barcode) {
    const code = barcode || barcodeInput.trim();
    if (!code) return;
    api
      .get(`/product/barcode/${code}`)
      .then((res) => {
        if (res.data) {
          onAddProduct(res.data);
          if (!barcode) setBarcodeInput("");
        } else {
          alert("Product not found.");
        }
      })
      .catch(() => alert("Product not found."));
  }

  function holdSale() {
    if (saleItems.length === 0) return alert("No items in sale.");
    const salePayload = {
      cashierId: 1,
      saleItems: saleItems.map(({ productId, name, price, quantity }) => ({
        productId,
        name,
        price,
        quantity,
      })),
      totalAmount: getTotalAmount(),
      isHeld: true,
      paymentType: "Hold",
      amountPaid: 0,
    };

    if (isOnline()) {
      api.post("/sale", salePayload).then(() => {
        dispatch(clearSale());
        fetchHoldSales();
        alert("Sale held.");
      });
    } else {
      saveSaleOffline(salePayload);
      dispatch(clearSale());
      fetchHoldSales();
      alert("Sale saved offline.");
    }
  }

  function resumeSale(sale) {
    // Clear current sale items, add selected held sale's items
    dispatch(clearSale());
    sale.saleItems.forEach((si) => {
      dispatch(
        addSaleItem({ productId: si.productId, name: si.productName, price: si.price, quantity: si.quantity })
      );
    });

    // Remove the resumed hold sale via API and update hold sales state
    api.delete(`/sale/held/${sale.id}`).then(() => {
      fetchHoldSales();
    });
  }

  function newSale() {
    dispatch(clearSale());
  }

  function openPayment() {
    if (saleItems.length === 0) return alert("No items in sale.");
    setIsPaymentOpen(true);
  }

  function onPay() {
    if (paymentMethod === "Cash" && balance < 0) {
      return alert("Insufficient cash.");
    }
    const salePayload = {
      cashierId: 1,
      customerId: currentCustomer?.id || null,
      saleItems: saleItems.map(({ productId, name, price, quantity }) => ({
        productId,
        name,
        price,
        quantity,
      })),
      totalAmount: getTotalAmount(),
      isHeld: false,
      paymentType: paymentMethod,
      amountPaid: paymentMethod === "Cash" ? parseFloat(cashGiven) : getTotalAmount(),
      date: new Date(),
      change: parseFloat(cashGiven || 0) - getTotalAmount(),
    };

    if (isOnline()) {
      api.post("/sale", salePayload).then(() => {
        i18n.changeLanguage(storeSetting.receiptLanguage || "en"); // or your language
        setReceiptData(salePayload);
        setIsReceiptOpen(true);
        setIsPaymentOpen(false);
        dispatch(clearSale());
        dispatch(setCashGiven(""));
        dispatch(setCustomer(null));
        fetchHoldSales();
      });
    } else {
      saveSaleOffline(salePayload);
      i18n.changeLanguage(storeSetting.receiptLanguage || "en");
      setReceiptData(salePayload);
      setIsReceiptOpen(true);
      setIsPaymentOpen(false);
      dispatch(clearSale());
      dispatch(setCashGiven(""));
      dispatch(setCustomer(null));
      fetchHoldSales();
      alert("Sale saved offline, will sync when online.");
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-1/5 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <ul>
          <li
            className={`p-2 cursor-pointer ${!selectedCategoryId ? "bg-blue-500 text-white" : "hover:bg-gray-200"
              }`}
            onClick={() => dispatch(setCategoryId(null))}
          >
            All
          </li>
          {categories.map((cat) => (
            <li
              key={cat.id}
              className={`p-2 cursor-pointer ${selectedCategoryId === cat.id ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                }`}
              onClick={() => dispatch(setCategoryId(cat.id))}
            >
              {cat.name}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col flex-grow p-4">
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            className="flex-grow border p-2 rounded"
            placeholder="Scan or enter barcode"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBarcodeAdd();
            }}
          />
          <button onClick={() => handleBarcodeAdd()} className="bg-blue-600 text-white px-4 rounded">
            Add
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            className="flex-grow border p-2 rounded"
            placeholder="Type at least 3 letters to search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <section className="flex-grow overflow-y-auto border rounded p-2 bg-white mb-4">
          <h3 className="font-semibold mb-2">Products</h3>
          {filteredProducts.length === 0 && <p>No products found.</p>}
          <div className="grid grid-cols-4 gap-2">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => onAddProduct(p)}
                className="border p-2 rounded hover:bg-blue-50 text-left"
              >
                {p.name}
                <br />
                Rs {p.priceRetail.toFixed(2)}
              </button>
            ))}
          </div>
        </section>

        <section className="border rounded p-2 bg-white mb-4 max-h-60 overflow-y-auto">
          <h3 className="font-semibold mb-2">Sale Items</h3>
          {saleItems.length === 0 && <p>No items.</p>}
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {saleItems.map((item) => (
                <tr key={item.productId}>
                  <td>{item.name || "Loading..."}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="w-16 border rounded px-1"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.productId, parseInt(e.target.value))
                      }
                    />
                  </td>
                  <td>Rs {item.price.toFixed(2)}</td>
                  <td>Rs {(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => onRemoveSaleItem(item.productId)}
                      className="text-red-600 font-bold"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-right font-semibold mt-2">
            Total: Rs {getTotalAmount().toFixed(2)}
          </div>
        </section>

        <section className="mb-4">
          <h3 className="font-semibold mb-2">Held Sales</h3>
          {holdSales.length === 0 && <p>No held sales.</p>}
          <ul>
            {holdSales.map((sale) => (
              <li
                key={sale.id}
                className="border rounded p-2 mb-1 flex justify-between items-center"
              >
                <span>
                  {new Date(sale.saleDate).toLocaleString()} - Rs{" "}
                  {sale.totalAmount.toFixed(2)}
                </span>
                <button
                  onClick={() => resumeSale(sale)}
                  className="bg-green-600 text-white px-2 rounded"
                >
                  Resume
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex gap-2">
          <button
            onClick={newSale}
            className="bg-gray-400 px-4 py-2 rounded hover:bg-gray-500"
          >
            New Sale
          </button>
          <button
            onClick={holdSale}
            className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600"
          >
            Hold Sale
          </button>
          <button
            onClick={openPayment}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            Proceed to Payment
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
        </section>
      </main>

      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Payment</h3>

            <label className="block">
              Payment Type
              <select
                value={paymentMethod}
                onChange={(e) => dispatch(setPaymentMethod(e.target.value))}
                className="w-full border rounded p-2 mt-1"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Credit">Credit</option>
              </select>
            </label>

            {paymentMethod === "Cash" && (
              <>
                <label className="block">
                  Cash Given
                  <input
                    type="number"
                    min="0"
                    value={cashGiven}
                    onChange={(e) => dispatch(setCashGiven(e.target.value))}
                    className="w-full border rounded p-2 mt-1"
                  />
                </label>
                <p className="text-right font-semibold">Balance: Rs {balance.toFixed(2)}</p>
              </>
            )}

            {(paymentMethod === "Credit" || paymentMethod === "Card") && (
              <label className="block">
                Select Customer
                <select
                  value={currentCustomer?.id || ""}
                  onChange={(e) => {
                    const sel = customers.find((c) => c.id === parseInt(e.target.value));
                    dispatch(setCustomer(sel || null));
                  }}
                  className="w-full border rounded p-2 mt-1"
                >
                  <option value="">-- None --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} - Credit: Rs {cust.creditBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={onPay}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        ref={receiptRef}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={receiptData}
      />
    </div>
  );
}
