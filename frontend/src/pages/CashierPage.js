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
  const [currentTime, setCurrentTime] = useState(new Date());

  const [customerType, setCustomerType] = useState("walk-in");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isLastSaleModalOpen, setIsLastSaleModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [barcodeQuantity, setBarcodeQuantity] = useState(1);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceVariants, setPriceVariants] = useState([]);

  // Time update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered products - ONLY SHOW IN STOCK PRODUCTS
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.stockQuantity > 0); // Only in-stock products
    
    if (searchTerm.length >= 3) {
      filtered = filtered.filter((p) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  const getProductCount = () => {
    return saleItems.length;
  };

  const getTotalAmount = () =>
    saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getTotalItems = () =>
    saleItems.reduce((sum, item) => sum + item.quantity, 0);

  const balance = (parseFloat(cashGiven) || 0) - getTotalAmount();

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

  // Initial data fetch
  useEffect(() => {
    api.get("/category").then((res) => {
      dispatch(setCategories(res.data));
      dispatch(setCategoryId(null));
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

  function isOnline() {
    return window.navigator.onLine;
  }

  function saveSaleOffline(salePayload) {
    if (window.electronAPI) {
      window.electronAPI.send("saveSale", salePayload);
    }
  }

  function fetchHoldSales() {
    api.get("/sale/held").then((res) => dispatch(setHoldSales(res.data)));
  }

  function addToCart(product, price, quantity, sourceId = null) {
    dispatch(
      addSaleItem({
        productId: typeof product === 'object' ? product.id : product,
        name: typeof product === 'object' ? product.name : '',
        price: price,
        quantity: quantity,
        sourceId: sourceId
      })
    );
  }

  function handlePriceSelect(variant, price, quantity) {
    const firstSource = variant.sources && variant.sources.length > 0 ? variant.sources[0] : null;
    const sourceId = firstSource?.sourceId || null;

    addToCart(selectedProduct, price, quantity, sourceId);

    setShowPriceModal(false);
    setSelectedProduct(null);
    setPriceVariants([]);
  }

  function onAddProduct(product) {
    if (product.hasMultipleProductPrices) {
      api.get(`/product/${product.id}/price-variants`)
        .then((res) => {
          if (res.data && res.data.length > 1) {
            setPriceVariants(res.data);
            setSelectedProduct(product);
            setShowPriceModal(true);
          } else if (res.data && res.data.length === 1) {
            const variant = res.data[0];
            const price = customerType === "wholesale" ? variant.wholesalePrice : variant.sellingPrice;

            const firstSource = variant.sources && variant.sources.length > 0 ? variant.sources[0] : null;
            const sourceId = firstSource?.sourceId || null;

            addToCart(product, price, 1, sourceId);
          } else {
            const price = customerType === "wholesale"
              ? (product.minWholesalePrice || product.minSellingPrice || 0)
              : (product.minSellingPrice || 0);
            addToCart(product, price, 1, null);
          }
        })
        .catch((err) => {
          console.error("Error fetching variants:", err);
          const price = customerType === "wholesale"
            ? (product.minWholesalePrice || product.minSellingPrice || 0)
            : (product.minSellingPrice || 0);
          addToCart(product, price, 1, null);
        });
    } else {
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

    api.get(`/product/barcode/${code}`)
      .then((res) => {
        if (res.data) {
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

  function handleReprintBill() {
    if (!receiptData && !lastSale) {
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
      i18n.changeLanguage(storeSetting.receiptLanguage || "en");
      setIsReceiptOpen(true);
    }
  }

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* MODERN NAVIGATION BAR */}
      <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Store Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{storeSetting.storeName}</h1>
                <p className="text-blue-200 text-xs">Point of Sale System</p>
              </div>
            </div>

            {/* Center - Time Display */}
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-2 border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-white">
                <div className="text-xs opacity-80">Current Time</div>
                <div className="font-bold tabular-nums text-lg">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Right - User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-200">Cashier</div>
                  <div className="text-white font-semibold">{user?.username || "Cashier"}</div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* PRODUCTS PANEL */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Search & Category */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex gap-3 mb-3">
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => dispatch(setCategoryId(e.target.value ? parseInt(e.target.value) : null))}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                style={{ minWidth: "150px" }}
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
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="Search products (min 3 letters)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((p) => {
                const displayPrice = p.minSellingPrice || 0;
                const hasMultiplePrices = p.hasMultipleProductPrices;

                return (
                  <button
                    key={p.id}
                    onClick={() => onAddProduct(p)}
                    className="group relative bg-white rounded-2xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-gray-100 hover:border-blue-300"
                  >
                    {/* Product Icon */}
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 text-center group-hover:text-blue-600 transition-colors min-h-[3rem]">
                      {p.name}
                    </h3>

                    {/* Price Display */}
                    <div className="flex items-center justify-center">
                      {hasMultiplePrices ? (
                        <span className="text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                          Multiple Prices
                        </span>
                      ) : (
                        <div className="text-2xl font-bold text-blue-600">
                          Rs {displayPrice.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity pointer-events-none"></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Menu Bar */}
          <div className="border-t bg-white p-3 shadow-lg">
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>

              <button
                onClick={handleReprintBill}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Bill Reprint
              </button>

              <button
                onClick={() => navigate("/sales")}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Today Sales
              </button>

              <button
                onClick={handleViewLastSale}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last Sale
              </button>

              {holdSales.length > 0 && (
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Held Sales
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {holdSales.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Held Sales Dropdown */}
          {holdSales.length > 0 && (
            <div className="border-t bg-yellow-50 p-3">
              <h3 className="font-semibold text-sm mb-2 text-yellow-800">Held Sales ({holdSales.length})</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {holdSales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => resumeSale(sale)}
                    className="flex-shrink-0 bg-white border-2 border-yellow-400 rounded-xl p-3 hover:bg-yellow-100 transition-all shadow-md hover:shadow-lg min-w-[140px]"
                  >
                    <div className="text-xs text-gray-600">{new Date(sale.saleDate).toLocaleTimeString()}</div>
                    <div className="font-semibold text-gray-800">{sale.saleItems?.length || 0} items</div>
                    <div className="text-blue-600 font-bold text-lg">Rs {sale.totalAmount.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CART PANEL */}
        <div className="w-96 bg-white shadow-2xl flex flex-col">
          {/* Cart Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">Current Sale</h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="font-bold">{getTotalItems()} items</span>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-gray-50 border-b p-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Customer:</label>
              <select
                value={customerType}
                onChange={(e) => handleCustomerTypeChange(e.target.value)}
                className="border-2 border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500 transition-all"
                style={{ minWidth: "90px" }}
              >
                <option value="walk-in">Walk-in</option>
                <option value="loyalty">Loyalty</option>
                <option value="wholesale">Wholesale</option>
              </select>

              {(customerType === "loyalty" || customerType === "wholesale") && (
                <>
                  <select
                    value={currentCustomer?.id || ""}
                    onChange={(e) => {
                      const customer = customers.find((c) => c.id === parseInt(e.target.value));
                      dispatch(setCustomer(customer || null));
                    }}
                    className="flex-1 border-2 border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select --</option>
                    {customers
                      .filter((c) => c.type === customerType)
                      .map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all"
                    title="View/Edit Customer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {currentCustomer && (customerType === "loyalty" || customerType === "wholesale") && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
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

          {/* Barcode Input */}
          <div className="bg-white border-b p-3">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                className="flex-grow border-2 border-gray-200 rounded-xl p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2">
                <button
                  onClick={() => setBarcodeQuantity(Math.max(1, parseInt(barcodeQuantity) - 1))}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded-lg font-bold transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={barcodeQuantity}
                  onChange={(e) => setBarcodeQuantity(e.target.value)}
                  className="w-12 border-0 p-1 rounded text-sm text-center bg-transparent focus:outline-none"
                  id="barcode-quantity"
                />
                <button
                  onClick={() => setBarcodeQuantity(parseInt(barcodeQuantity) + 1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  handleBarcodeAdd();
                  document.getElementById('barcode-input')?.focus();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md"
              >
                Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {saleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-20 h-20 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-medium">Cart is empty</p>
                <p className="text-sm text-gray-400">Scan or select products to add</p>
              </div>
            ) : (
              saleItems.map((item, index) => (
                <div key={`${item.productId}-${item.sourceId || item.price}-${index}`} className="group bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border-2 border-gray-100 hover:border-blue-200">
                  <div className="flex items-start gap-3">
                    {/* Product Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 mb-1 truncate">{item.name}</h4>
                      <div className="text-sm font-medium text-green-600 mb-2">
                        Rs {item.price.toFixed(2)} each
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.sourceId, item.price, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.productId, item.sourceId, item.price, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-blue-600">
                        Rs {(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => onRemoveSaleItem(item.productId, item.sourceId, item.price)}
                        className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total & Actions */}
          <div className="p-4 border-t bg-white">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 mb-4 shadow-lg">
              <div className="flex items-center justify-between text-white">
                <span className="text-lg font-semibold">TOTAL</span>
                <span className="text-3xl font-bold">
                  Rs {getTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={newSale}
                className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
              >
                New
              </button>
              <button
                onClick={holdSale}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Hold
              </button>
              <button
                onClick={() => dispatch(clearSale())}
                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Clear
              </button>
            </div>

            <button
              onClick={openPayment}
              disabled={saleItems.length === 0}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Payment</h3>

            <label className="block mb-4">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Payment Type</span>
              <select
                value={paymentMethod}
                onChange={(e) => dispatch(setPaymentMethod(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Credit">Credit</option>
              </select>
            </label>

            {paymentMethod === "Cash" && (
              <>
                <label className="block mb-4">
                  <span className="text-sm font-semibold text-gray-700 mb-2 block">Cash Given</span>
                  <input
                    type="number"
                    min="0"
                    value={cashGiven}
                    onChange={(e) => dispatch(setCashGiven(e.target.value))}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Enter amount"
                  />
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Balance:</span>
                    <span className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      Rs {balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {(paymentMethod === "Credit" || paymentMethod === "Card") && (
              <label className="block mb-4">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Select Customer</span>
                <select
                  value={currentCustomer?.id || ""}
                  onChange={(e) => {
                    const sel = customers.find((c) => c.id === parseInt(e.target.value));
                    dispatch(setCustomer(sel || null));
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
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

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onPay}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal
        ref={receiptRef}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={receiptData}
      />

      {/* CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Manage {customerType === "loyalty" ? "Loyalty" : "Wholesale"} Customer
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {currentCustomer && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Customer</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {currentCustomer.name}</p>
                  <p><span className="font-medium">Phone:</span> {currentCustomer.phone}</p>
                  <p><span className="font-medium">Credit Balance:</span> Rs {currentCustomer.creditBalance?.toFixed(2) || "0.00"}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* LAST SALE MODAL */}
      {isLastSaleModalOpen && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Last Sale Details</h3>
              <button
                onClick={() => setIsLastSaleModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-600">Sale ID</p>
                  <p className="font-semibold text-gray-800">{lastSale.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Date & Time</p>
                  <p className="font-semibold text-gray-800">{new Date(lastSale.saleDate || lastSale.date).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-3xl font-bold">
                    Rs {lastSale.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLoadLastSale}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
              >
                Load to Current Sale
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage(storeSetting.receiptLanguage || "en");
                  setReceiptData(lastSale);
                  setIsLastSaleModalOpen(false);
                  setIsReceiptOpen(true);
                }}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all font-semibold shadow-lg"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRICE SELECTION MODAL */}
      <PriceSelectionModal
        isOpen={showPriceModal}
        onClose={() => {
          setShowPriceModal(false);
          setSelectedProduct(null);
          setPriceVariants([]);
        }}
        product={selectedProduct}
        priceVariants={priceVariants}
        onSelectPrice={handlePriceSelect}
        customerType={customerType === "wholesale" ? "wholesale" : "retail"}
      />
    </div>
  );
}