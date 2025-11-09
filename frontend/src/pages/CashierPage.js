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
import PriceSelectionModal from "../components/PriceSelectionModal";

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
  const paymentMethod = useSelector((state) => state.pos.paymentMethod);
  const cashGiven = useSelector((state) => state.pos.cashGiven);
  const selectedCategoryId = useSelector((state) => state.pos.selectedCategoryId);
  const user = useSelector((state) => state.auth.user);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [customerType, setCustomerType] = useState("walk-in"); // walk-in, loyalty, wholesale
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLastSaleModalOpen, setIsLastSaleModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState(1);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceVariants, setPriceVariants] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHeldSalesModalOpen, setIsHeldSalesModalOpen] = useState(false);

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

  const balance = (parseFloat(cashGiven) || 0) - getTotalAmount();

  // Time update
  useEffect(() => {
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
  }, []);

  // Initial data fetch - Set "All" as default
  useEffect(() => {
    api.get("/category").then((res) => {
      dispatch(setCategories(res.data));
      dispatch(setCategoryId(null)); // Set to null for "All Products"
    });
    api.get("/customer").then((res) => dispatch(setCustomers(res.data)));
    fetchHoldSales();
  }, [dispatch]);

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

  function fetchHoldSales() {
    api.get("/sale/held").then((res) => dispatch(setHoldSales(res.data)));
  }

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

  function handleBarcodeAdd(barcode) {
    const code = barcode || barcodeInput.trim();
    if (!code) return;

    const quantity = parseInt(barcodeQuantity) || 1;
    console.log("🔍 Barcode search:", code, "Quantity:", quantity);

    api.get(`/product/barcode/${code}`)
      .then((res) => {
        if (res.data) {
          console.log("✅ Product found:", res.data.name);
          console.log("📊 HasMultipleProductPrices:", res.data.hasMultipleProductPrices);

          // Check for multiple prices (not batches)
          if (res.data.hasMultipleProductPrices) {
            // Will trigger price selection modal
            onAddProduct(res.data);
          } else {
            // Use min prices directly
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
  }

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

  function onPay() {
    if (paymentMethod === "Cash" && balance < 0) {
      return alert("Insufficient cash.");
    }
    const salePayload = {
      cashierId: user?.id || 1,
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
        i18n.changeLanguage(storeSetting.receiptLanguage || "en");
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

  function handleSelectCustomerForSale() {
    const customer = customers.find((c) => c.id === parseInt(selectedCustomerId));
    if (customer) {
      dispatch(setCustomer(customer));
      setIsCustomerModalOpen(false);
    }
  }

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

            {/* Center - Time Display */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-1 border border-white/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-white font-bold tabular-nums">
                {currentTime.toLocaleTimeString()}
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

              {/* Inline Customer Selection - Shows when Loyalty or Wholesale selected */}
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
                    <option value="">-- Select --</option>
                    {customers
                      .filter((c) => c.type === customerType)
                      .map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} - {cust.phone}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                    title="View/Edit Customer"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Compact Customer Info Display (appears on next line if needed) */}
            {currentCustomer && (customerType === "loyalty" || customerType === "wholesale") && (
              <div className="mt-1 p-1 bg-blue-50 rounded border border-blue-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-blue-900 truncate">{currentCustomer.name}</span>
                  <div className="flex gap-2 text-blue-600">
                    <span>Credit: Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}</span>
                    {customerType === "loyalty" && currentCustomer.loyaltyPoints && (
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
      {
        isPaymentOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded p-4 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-3">Payment</h3>

              <label className="block mb-3">
                <span className="text-sm font-medium">Payment Type</span>
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
                  <label className="block mb-3">
                    <span className="text-sm font-medium">Cash Given</span>
                    <input
                      type="number"
                      min="0"
                      value={cashGiven}
                      onChange={(e) => dispatch(setCashGiven(e.target.value))}
                      className="w-full border rounded p-2 mt-1"
                    />
                  </label>
                  <p className="text-right font-semibold mb-3">
                    Balance: <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                      Rs {balance.toFixed(2)}
                    </span>
                  </p>
                </>
              )}

              {(paymentMethod === "Credit" || paymentMethod === "Card") && (
                <label className="block mb-3">
                  <span className="text-sm font-medium">Select Customer</span>
                  <select
                    value={currentCustomer?.id || ""}
                    onChange={(e) => {
                      const sel = customers.find((c) => c.id === parseInt(e.target.value));
                      dispatch(setCustomer(sel || null));
                    }}
                    className="w-full border rounded p-2 mt-1"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="flex justify-end gap-2">
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
        )
      }

      {/* RECEIPT MODAL */}
      <ReceiptModal
        ref={receiptRef}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={receiptData}
      />

      {/* CUSTOMER SELECTION MODAL */}
      {
        isCustomerModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Manage {customerType === "loyalty" ? "Loyalty" : customerType === "wholesale" ? "Wholesale" : ""} Customer
                </h3>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {customerType === "walk-in" ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Walk-in customers don't require selection.</p>
                  <p className="text-sm text-gray-500">Change customer type to Loyalty or Wholesale to select a customer.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium">
                      Select {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer:
                    </label>
                    <select
                      value={currentCustomer?.id || ""}
                      onChange={(e) => {
                        const customer = customers.find((c) => c.id === parseInt(e.target.value));
                        dispatch(setCustomer(customer || null));
                      }}
                      className="w-full border-2 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Select Customer --</option>
                      {customers
                        .filter((c) => c.type === customerType)
                        .map((cust) => (
                          <option key={cust.id} value={cust.id}>
                            {cust.name} - {cust.phone} - Credit: Rs {cust.creditBalance?.toFixed(2) || "0.00"}
                          </option>
                        ))}
                    </select>
                  </div>

                  {currentCustomer && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Selected Customer</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Name:</span> {currentCustomer.name}</p>
                        <p><span className="font-medium">Phone:</span> {currentCustomer.phone}</p>
                        <p><span className="font-medium">Email:</span> {currentCustomer.email || "N/A"}</p>
                        <p><span className="font-medium">Credit Balance:</span> Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}</p>
                        {customerType === "loyalty" && (
                          <p><span className="font-medium">Loyalty Points:</span> {currentCustomer.loyaltyPoints || 0}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        dispatch(setCustomer(null));
                        setIsCustomerModalOpen(false);
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setIsCustomerModalOpen(false)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                    >
                      Done
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsCustomerModalOpen(false);
                        navigate(`/customers/add?type=${customerType}`);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* LAST SALE VIEW MODAL */}
      {
        isLastSaleModalOpen && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Last Sale Details</h3>
                <button
                  onClick={() => setIsLastSaleModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Sale ID</p>
                    <p className="font-semibold">{lastSale.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Date & Time</p>
                    <p className="font-semibold">{new Date(lastSale.saleDate || lastSale.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Payment Type</p>
                    <p className="font-semibold">{lastSale.paymentType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Customer</p>
                    <p className="font-semibold">{lastSale.customer?.name || "Walk-in"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Items:</h4>
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 border">Product</th>
                        <th className="text-center p-2 border">Qty</th>
                        <th className="text-right p-2 border">Price</th>
                        <th className="text-right p-2 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastSale.saleItems?.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.productName || item.name}</td>
                          <td className="text-center p-2">{item.quantity}</td>
                          <td className="text-right p-2">Rs {item.price.toFixed(2)}</td>
                          <td className="text-right p-2 font-semibold">
                            Rs {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">
                      Rs {lastSale.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  {lastSale.paymentType === "Cash" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Amount Paid:</span>
                        <span>Rs {lastSale.amountPaid?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Change:</span>
                        <span>Rs {lastSale.change?.toFixed(2) || "0.00"}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleLoadLastSale}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Load to Current Sale
                </button>
                <button
                  onClick={() => {
                    i18n.changeLanguage(storeSetting.receiptLanguage || "en");
                    setReceiptData(lastSale);
                    setIsLastSaleModalOpen(false);
                    setIsReceiptOpen(true);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* HELD SALES MODAL */}
      {isHeldSalesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Held Sales
                <span className="ml-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {holdSales.length} {holdSales.length === 1 ? 'sale' : 'sales'}
                </span>
              </h3>
              <button
                onClick={() => setIsHeldSalesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {holdSales.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 mb-2">No held sales</p>
                <p className="text-sm text-gray-400">Sales that are put on hold will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holdSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => {
                      resumeSale(sale);
                      setIsHeldSalesModalOpen(false);
                    }}
                    className="border-2 border-yellow-400 rounded-lg p-4 hover:bg-yellow-50 transition cursor-pointer hover:shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Sale ID</div>
                        <div className="text-lg font-bold text-gray-800">#{sale.id}</div>
                      </div>
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        On Hold
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-semibold">{new Date(sale.saleDate).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items:</span>
                        <span className="font-semibold">{sale.saleItems?.length || 0} items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Qty:</span>
                        <span className="font-semibold">
                          {sale.saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} units
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-yellow-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                        <span className="text-xl font-bold text-blue-600">
                          Rs {sale.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <div className="text-xs text-gray-500 mb-2">Items Preview:</div>
                      <div className="space-y-1">
                        {sale.saleItems?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="truncate flex-1">{item.productName}</span>
                            <span className="font-semibold ml-2">×{item.quantity}</span>
                          </div>
                        ))}
                        {sale.saleItems?.length > 3 && (
                          <div className="text-xs text-gray-500 italic">
                            +{sale.saleItems.length - 3} more items...
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resume Sale
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
    </div >
  );
}
