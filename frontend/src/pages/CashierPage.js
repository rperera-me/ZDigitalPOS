import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
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
  setCategoryId,
} from "../app/posSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import storeSetting from "../config/storeSettings";
import {
  PaymentModal,
  LastSaleModal,
  HeldSalesModal,
  PriceSelectionModal,
  ReceiptModal,
  AddCustomerModal
} from "../components/modals";

export default function CashierPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const receiptRef = useRef();

  // Redux state
  const categories = useSelector((state) => state.pos.categories);
  const products = useSelector((state) => state.pos.products);
  const saleItems = useSelector((state) => state.pos.saleItems);
  const holdSales = useSelector((state) => state.pos.holdSales);
  const customers = useSelector((state) => state.pos.customers);
  const currentCustomer = useSelector((state) => state.pos.currentCustomer);
  const selectedCategoryId = useSelector((state) => state.pos.selectedCategoryId);
  const user = useSelector((state) => state.auth.user);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [isLastSaleModalOpen, setIsLastSaleModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeQuantity, setBarcodeQuantity] = useState(1);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceVariants, setPriceVariants] = useState([]);

  const [isHeldSalesModalOpen, setIsHeldSalesModalOpen] = useState(false);

  const [customerType, setCustomerType] = useState("walk-in"); // walk-in, loyalty, wholesale
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [addCustomerType, setAddCustomerType] = useState('loyalty');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Filtered products with search
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.stockQuantity > 0);
    if (searchTerm.length >= 3) {
      return filtered
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return products;
  }, [products, searchTerm]);

  const getProductCount = () => {
    return saleItems.length; // Number of different products
  };

  // Helper functions
  const getTotalAmount = () =>
    saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getTotalItems = () =>
    saleItems.reduce((sum, item) => sum + item.quantity, 0);

  // Offline sync functionality (commented for future use)
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

  function isOnline() {
    return window.navigator.onLine;
  }

  function saveSaleOffline(salePayload) {
    // Electron's exposed API to send data to main process
    window.electronAPI.send("saveSale", salePayload);
  }

  const fetchHoldSales = useCallback(() => {
    api.get("/sale/held").then((res) => dispatch(setHoldSales(res.data)));
  }, [dispatch]);

  function addToCart(product, price, quantity, sourceId = null) {
    console.log("🛒 Adding to cart:", {
      product: product.name || product,
      price,
      quantity,
      sourceId
    });

    dispatch(
      addSaleItem({
        productId: typeof product === 'object' ? product.id : product,
        name: typeof product === 'object' ? product.name : '',
        price: price,
        quantity: quantity,
        sourceId: sourceId // Changed from batchId
      })
    );
  }

  function handlePriceSelect(variant, price, quantity) {
    console.log("✅ Price selected:", { price, quantity });

    // Get source ID (no batch logic)
    const firstSource = variant.sources && variant.sources.length > 0 ? variant.sources[0] : null;
    const sourceId = firstSource?.sourceId || null;

    addToCart(selectedProduct, price, quantity, sourceId);

    setShowPriceModal(false);
    setSelectedProduct(null);
    setPriceVariants([]);
  }

  function onAddProduct(product) {
    console.log("🔍 Adding product:", product.name, "HasMultipleProductPrices:", product.hasMultipleProductPrices);

    // Check if product has multiple PRICES (not batches)
    if (product.hasMultipleProductPrices) {
      console.log("💰 Product has multiple prices, fetching variants...");

      api.get(`/product/${product.id}/price-variants`)
        .then((res) => {
          console.log("📊 Price variants received:", res.data);

          if (res.data && res.data.length > 1) {
            // Multiple prices exist - SHOW MODAL
            console.log("✅ Showing price selection modal");
            setPriceVariants(res.data);
            setSelectedProduct(product);
            setShowPriceModal(true);
          } else if (res.data && res.data.length === 1) {
            // Only one price - add directly
            console.log("✅ Single price - adding directly");
            const variant = res.data[0];
            const price = customerType === "wholesale" ? variant.wholesalePrice : variant.sellingPrice;

            const firstSource = variant.sources && variant.sources.length > 0 ? variant.sources[0] : null;
            const sourceId = firstSource?.sourceId || null;

            addToCart(product, price, 1, sourceId);
          } else {
            // No variants - use default prices (fallback)
            console.log("⚠️ No price variants - using min prices");
            const price = customerType === "wholesale"
              ? (product.minWholesalePrice || product.minSellingPrice || 0)
              : (product.minSellingPrice || 0);
            addToCart(product, price, 1, null);
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching variants:", err);
          // Fallback to min prices
          const price = customerType === "wholesale"
            ? (product.minWholesalePrice || product.minSellingPrice || 0)
            : (product.minSellingPrice || 0);
          addToCart(product, price, 1, null);
        });
    } else {
      // No multiple prices - use min/default prices
      console.log("📝 Single price product - using min prices");
      const price = customerType === "wholesale"
        ? (product.minWholesalePrice || product.minSellingPrice || 0)
        : (product.minSellingPrice || 0);
      addToCart(product, price, 1, null);
    }
  }

  function onRemoveSaleItem(productId, sourceId, price) {
    dispatch(removeSaleItem({ productId, sourceId, price }));
  }

  function onUpdateQuantity(productId, sourceId, price, quantity) {
    if (quantity < 1) return;
    dispatch(updateQuantity({ productId, sourceId, price, quantity }));
  }

  const handleBarcodeAdd = useCallback((barcode) => {
    const code = barcode || barcodeInput.trim();
    if (!code) return;

    const quantity = parseInt(barcodeQuantity) || 1;
    console.log("🔍 Barcode search:", code, "Quantity:", quantity);

    api.get(`/product/barcode/${code}`)
      .then((res) => {
        if (res.data) {
          console.log("✅ Product found:", res.data.name);
          console.log("📊 HasMultipleProductPrices:", res.data.hasMultipleProductPrices);

          if (res.data.hasMultipleProductPrices) {
            onAddProduct(res.data);
          } else {
            const price = customerType === "wholesale"
              ? (res.data.minWholesalePrice || res.data.minSellingPrice || 0)
              : (res.data.minSellingPrice || 0);

            addToCart(res.data, price, quantity, null);
          }

          if (!barcode) {
            setBarcodeInput("");
            setBarcodeQuantity(1);
            setTimeout(() => {
              document.getElementById('barcode-input')?.focus();
            }, 100);
          }
        } else {
          alert("Product not found.");
        }
      })
      .catch(() => alert("Product not found."));
  }, [barcodeInput, barcodeQuantity, customerType]);

  function holdSale() {
    if (saleItems.length === 0) return alert("No items in sale.");
    const salePayload = {
      cashierId: user?.id || 1,
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
    dispatch(clearSale());
    sale.saleItems.forEach((si) => {
      dispatch(
        addSaleItem({
          productId: si.productId,
          name: si.productName,
          price: si.price,
          quantity: si.quantity
        })
      );
    });

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

  function onPay(paymentData) {
    const salePayload = {
      cashierId: user?.id || 1,
      customerId: paymentData.customer?.id || null,
      saleItems: saleItems.map(({ productId, name, price, quantity, sourceId }) => ({
        productId,
        name,
        price,
        quantity,
        sourceId
      })),
      totalAmount: paymentData.totalAmount,
      discountType: paymentData.discountType,
      discountValue: paymentData.discountValue,
      discountAmount: paymentData.discountAmount,
      finalAmount: paymentData.finalAmount,
      isHeld: false,
      paymentType: paymentData.payments.length > 1 ? "Mixed" : paymentData.payments[0]?.type || "Cash",
      payments: paymentData.payments, // Array of payment methods
      amountPaid: paymentData.finalAmount,
      change: paymentData.balance,
      date: new Date(),
    };

    if (isOnline()) {
      api.post("/sale", salePayload).then((response) => {
        // Update customer credit if credit payment was made
        if (paymentData.customer && paymentData.payments.some(p => p.type === "Credit")) {
          const creditPayment = paymentData.payments.find(p => p.type === "Credit");
          const newCreditBalance = (paymentData.customer.creditBalance || 0) + creditPayment.amount;

          // Update customer credit balance
          api.put(`/customer/${paymentData.customer.id}`, {
            ...paymentData.customer,
            creditBalance: newCreditBalance
          });
        }

        // Show receipt
        i18n.changeLanguage(storeSetting.receiptLanguage || "en");
        setReceiptData({
          ...salePayload,
          storeName: storeSetting.storeName,
          cashier: user?.username || "Cashier"
        });
        setIsReceiptOpen(true);
        setIsPaymentOpen(false);
        dispatch(clearSale());
        dispatch(setCustomer(null));
        fetchHoldSales();
      }).catch((err) => {
        console.error("Sale failed:", err);
        alert("Failed to process sale: " + (err.response?.data?.message || err.message));
      });
    } else {
      // Offline mode
      saveSaleOffline(salePayload);
      i18n.changeLanguage(storeSetting.receiptLanguage || "en");
      setReceiptData({
        ...salePayload,
        storeName: storeSetting.storeName,
        cashier: user?.username || "Cashier"
      });
      setIsReceiptOpen(true);
      setIsPaymentOpen(false);
      dispatch(clearSale());
      dispatch(setCustomer(null));
      fetchHoldSales();
      alert("Sale saved offline, will sync when online.");
    }
  }

  // Menu action handlers
  function handleReprintBill() {
    if (!receiptData && !lastSale) {
      // Fetch the last sale if no receipt data
      api.get("/sale/last").then((res) => {
        if (res.data) {
          i18n.changeLanguage(storeSetting.receiptLanguage || "en");
          setReceiptData(res.data);
          setIsReceiptOpen(true);
        } else {
          alert("No previous sale found to reprint.");
        }
      }).catch(() => {
        alert("Error fetching last sale.");
      });
    } else {
      // Reprint current or last receipt
      i18n.changeLanguage(storeSetting.receiptLanguage || "en");
      setIsReceiptOpen(true);
    }
  }

  // Add this function to handle customer type change
  function handleCustomerTypeChange(type) {
    setCustomerType(type);
    if (type === "walk-in") {
      dispatch(setCustomer(null));
      setSelectedCustomerId(null);
    }
  }

  function handleViewLastSale() {
    api.get("/sale/last").then((res) => {
      if (res.data) {
        setLastSale(res.data);
        setIsLastSaleModalOpen(true);
      } else {
        alert("No previous sale found.");
      }
    }).catch(() => {
      alert("Error fetching last sale.");
    });
  }

  const handleCustomerAdded = useCallback((newCustomer) => {
    // Refresh customers list
    api.get("/customer").then((res) => {
      const filteredCustomers = res.data.filter(c => c.type !== "walk-in");
      dispatch(setCustomers(filteredCustomers));

      // Auto-select the newly added customer
      dispatch(setCustomer(newCustomer));
    });
  }, [dispatch]);

  function handleLoadLastSale() {
    if (!lastSale) return;

    dispatch(clearSale());
    lastSale.saleItems.forEach((si) => {
      dispatch(
        addSaleItem({
          productId: si.productId,
          name: si.productName || si.name,
          price: si.price,
          quantity: si.quantity
        })
      );
    });

    if (lastSale.customer) {
      dispatch(setCustomer(lastSale.customer));
    }

    setIsLastSaleModalOpen(false);
    alert("Last sale loaded into current sale.");
  }

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      // Format: Monday, 10 November 2025
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-GB', options));
    };

    updateDateTime(); // Initial call
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Barcode scanner listener
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
  }, [handleBarcodeAdd]);

  // Initial data fetch - Set "All" as default
  useEffect(() => {
    api.get("/category").then((res) => {
      dispatch(setCategories(res.data));
      dispatch(setCategoryId(null));
    });
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
    fetchHoldSales();
  }, [dispatch, fetchHoldSales]);

  // Fetch products when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      api.get(`/product/category/${selectedCategoryId}`).then((res) =>
        dispatch(setProducts(res.data))
      );
    } else {
      api.get("/product").then((res) => dispatch(setProducts(res.data)));
    }
  }, [selectedCategoryId, dispatch]);

  useEffect(() => {
    const handleOpenCustomerModal = () => {
      setCustomerType('loyalty'); // Or 'wholesale' based on your preference
      setIsCustomerModalOpen(true);
    };

    window.addEventListener('openCustomerModal', handleOpenCustomerModal);

    return () => {
      window.removeEventListener('openCustomerModal', handleOpenCustomerModal);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* COMPACT NAVIGATION BAR */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 shadow-lg">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left - Store Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{storeSetting.storeName}</h1>
              </div>
            </div>

            {/* Center - Date & Time Display */}
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex items-center gap-3 text-white">
                <span className="text-sm font-medium">{currentDate}</span>
                <span className="text-white/40">|</span>
                <span className="text-sm font-bold tabular-nums">{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Right - User Info & Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-white text-sm font-semibold">{user?.username || "Cashier"}</div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-all shadow-lg text-sm font-semibold"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* PRODUCTS PANEL */}
        <div className="flex-1 flex flex-col bg-white border-r">
          {/* Single Line Search & Category */}
          <div className="p-2 border-b bg-gray-50">
            <div className="flex gap-2">
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => dispatch(setCategoryId(e.target.value ? parseInt(e.target.value) : null))}
                className="border p-1 rounded text-xs"
                style={{ minWidth: "120px" }}
              >
                <option value="">All Products</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="flex-1 border p-1 rounded text-xs"
                placeholder="Search products (min 3 letters)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredProducts.map((p) => {
                const displayPrice = p.minProductPrice || 0;
                const hasMultiplePrices = p.hasMultipleProductPrices;

                return (
                  <button
                    key={p.id}
                    onClick={() => onAddProduct(p)}
                    className="group relative bg-white rounded-lg p-2 shadow hover:shadow-lg transition-all hover:scale-105 cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    {/* Product Name - Compact */}
                    <h3 className="font-semibold text-gray-800 text-xs mb-1 text-center line-clamp-2 min-h-[2rem]">
                      {p.name}
                    </h3>

                    {/* Price Display - Compact */}
                    <div className="flex items-center justify-center">
                      {hasMultiplePrices ? (
                        <span className="text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                          Multiple
                        </span>
                      ) : (
                        <div className="text-sm font-bold text-blue-600">
                          Rs {displayPrice.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                      {p.stockQuantity}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BOTTOM NAVIGATION PANEL */}
          <div className="border-t bg-white shadow-lg">
            {/* Main Action Buttons */}
            <div className="p-2">
              <div className="grid grid-cols-6 gap-1">
                <button
                  className="flex flex-col items-center justify-center p-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 rounded"
                >
                  <span className="text-xs font-medium text-white">
                    ZDigital POS <br />
                    Version 1.0
                  </span>
                </button>
                {/* Hold Sales */}
                <button
                  onClick={() => setIsHeldSalesModalOpen(true)}
                  className="flex flex-col items-center justify-center p-2 bg-gray-100 hover:bg-blue-100 rounded transition-colors relative"
                >
                  <svg className="w-5 h-5 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Held Sales</span>
                  {holdSales.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {holdSales.length}
                    </span>
                  )}
                </button>
                {/* Bill Reprint */}
                <button
                  onClick={handleReprintBill}
                  className="flex flex-col items-center justify-center p-2 bg-gray-100 hover:bg-blue-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Bill Reprint</span>
                </button>

                {/* Last Bill */}
                <button
                  onClick={handleViewLastSale}
                  className="flex flex-col items-center justify-center p-2 bg-gray-100 hover:bg-blue-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Last Bill</span>
                </button>

                {/* Today Sales */}
                <button
                  onClick={() => navigate("/sales")}
                  className="flex flex-col items-center justify-center p-2 bg-gray-100 hover:bg-blue-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">Today Sales</span>
                </button>

                {/* Exit */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex flex-col items-center justify-center p-2 bg-red-100 hover:bg-red-200 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs font-medium text-red-600">Exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CART PANEL */}
        <div className="w-2/5 flex flex-col bg-gray-50">
          {/* Compact Inline Customer Selection Panel */}
          <div className="bg-white border-b p-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Customer:</label>
              <select
                value={customerType}
                onChange={(e) => handleCustomerTypeChange(e.target.value)}
                className="border rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                style={{ minWidth: "90px" }}
              >
                <option value="walk-in">Walk-in</option>
                <option value="loyalty">Loyalty</option>
                <option value="wholesale">Wholesale</option>
              </select>

              {/* Inline Customer Selection for Loyalty/Wholesale */}
              {(customerType === "loyalty" || customerType === "wholesale") && (
                <>
                  <select
                    value={currentCustomer?.id || ""}
                    onChange={(e) => {
                      const customer = customers.find((c) => c.id === parseInt(e.target.value));
                      dispatch(setCustomer(customer || null));
                    }}
                    className="flex-1 border rounded p-1 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers
                      .filter((c) => c.type === customerType)
                      .map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} - {cust.phone || 'N/A'}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => {
                      setAddCustomerType(customerType);
                      setShowAddCustomerModal(true);
                    }}
                    className="bg-green-600 text-white p-1 rounded hover:bg-green-700 transition flex items-center gap-1 px-2"
                    title="Add New Customer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs">Add</span>
                  </button>
                </>
              )}
            </div>

            {/* Customer Info Display */}
            {currentCustomer && (customerType === "loyalty" || customerType === "wholesale") && (
              <div className="mt-1 p-1 bg-blue-50 rounded border border-blue-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-blue-900 truncate">{currentCustomer.name}</span>
                  <div className="flex gap-2 text-blue-600">
                    <span>Credit: Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}</span>
                    {customerType === "loyalty" && currentCustomer.loyaltyPoints !== undefined && (
                      <span>Pts: {currentCustomer.loyaltyPoints}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Barcode Input with Quantity */}
          <div className="bg-white border-b p-2">
            <div className="flex gap-1 items-center">
              <input
                type="text"
                className="flex-grow border p-1 rounded text-xs"
                placeholder="Scan barcode"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBarcodeAdd();
                    document.getElementById('barcode-quantity')?.focus();
                  }
                }}
                autoFocus
                id="barcode-input"
              />
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2">
                <button
                  onClick={() => setBarcodeQuantity(Math.max(1, parseInt(barcodeQuantity) - 1))}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded font-bold text-sm"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={barcodeQuantity}
                  onChange={(e) => setBarcodeQuantity(e.target.value)}
                  className="w-12 border p-1 rounded text-xs text-center"
                  id="barcode-quantity"
                />
                <button
                  onClick={() => setBarcodeQuantity(parseInt(barcodeQuantity) + 1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded font-bold text-sm"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  handleBarcodeAdd();
                  document.getElementById('barcode-input')?.focus();
                }}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Compact Cart Header - Single Line */}
          <div className="bg-blue-600 text-white px-2 py-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">Current Sale</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="opacity-80">Products:</span>
                  <span className="font-bold">{getProductCount()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="opacity-80">Items:</span>
                  <span className="font-bold">{getTotalItems()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {saleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-xs">No items in cart</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Product</th>
                    <th className="text-center p-1">Qty</th>
                    <th className="text-right p-1">Price</th>
                    <th className="text-right p-1">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item, index) => (
                    <tr key={`${item.productId}-${item.sourceId || item.price}-${index}`} className="border-b hover:bg-gray-100">
                      <td className="p-1 text-xs">
                        {item.name}
                      </td>
                      <td className="text-center p-1">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.sourceId, item.price, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 rounded px-1.5 py-0.5 text-xs"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.productId, item.sourceId, item.price, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 rounded px-1.5 py-0.5 text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="text-right p-1 text-xs">Rs {item.price.toFixed(2)}</td>
                      <td className="text-right p-1 font-semibold text-xs">Rs {(item.price * item.quantity).toFixed(2)}</td>
                      <td className="p-1 text-center">
                        <button
                          onClick={() => onRemoveSaleItem(item.productId, item.sourceId, item.price)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Compact Total & Actions */}
          <div className="bg-white border-t p-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">TOTAL</span>
              <span className="text-xl font-bold text-blue-600">Rs {getTotalAmount().toFixed(2)}</span>
            </div>

            <div className="flex gap-4 mb-2">
              <div className="flex flex-col gap-2 flex-grow max-w-xs">
                <button
                  onClick={holdSale}
                  className="w-full py-1 bg-yellow-500 hover:bg-yellow-600 rounded font-semibold text-white"
                >
                  Hold
                </button>
                <button
                  onClick={newSale}
                  className="w-full py-1 bg-blue-500 hover:bg-blue-600 rounded font-semibold text-white"
                >
                  New
                </button>

              </div>


              <div className="flex flex-col justify-between w-1/3">
                <button
                  onClick={openPayment}
                  disabled={saleItems.length === 0}
                  className="w-full h-full bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed<br />
                  to<br />
                  Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPay={onPay}
        getTotalAmount={getTotalAmount}
        customers={customers}
        currentCustomer={currentCustomer}
        customerType={customerType}
      />

      {/* RECEIPT MODAL */}
      <ReceiptModal
        ref={receiptRef}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={receiptData}
      />

      {/* LAST SALE VIEW MODAL */}
      <LastSaleModal
        isOpen={isLastSaleModalOpen}
        onClose={() => setIsLastSaleModalOpen(false)}
        lastSale={lastSale}
        onLoadSale={handleLoadLastSale}
        onPrintReceipt={(saleData) => {
          i18n.changeLanguage(storeSetting.receiptLanguage || "en");
          setReceiptData(saleData);
          setIsLastSaleModalOpen(false);
          setIsReceiptOpen(true);
        }}
        i18n={i18n}
        storeSetting={storeSetting}
      />

      {/* HELD SALES MODAL */}
      <HeldSalesModal
        isOpen={isHeldSalesModalOpen}
        onClose={() => setIsHeldSalesModalOpen(false)}
        holdSales={holdSales}
        onResumeSale={(sale) => {
          resumeSale(sale);
          setIsHeldSalesModalOpen(false);
        }}
      />

      <PriceSelectionModal
        isOpen={showPriceModal}
        onClose={() => {
          console.log("❌ Modal closed");
          setShowPriceModal(false);
          setSelectedProduct(null);
          setPriceVariants([]);
        }}
        product={selectedProduct}
        priceVariants={priceVariants}
        onSelectPrice={handlePriceSelect}
        customerType={customerType === "wholesale" ? "wholesale" : "retail"}
      />

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
        customerType={addCustomerType}
      />
    </div >
  );
}
