import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  products: [],
  suppliers: [], // New
  saleItems: [],
  holdSales: [],
  customers: [],
  currentCustomer: null,
  paymentMethod: "Cash",
  cashGiven: "",
  selectedCategoryId: null,
  selectedBatch: null, // New
  showBatchModal: false, // New
  currentProduct: null, // New
};

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setSuppliers: (state, action) => { // New
      state.suppliers = action.payload;
    },
    addSaleItem: (state, action) => {
      const item = action.payload;
      const existing = state.saleItems.find(i => 
        i.productId === item.productId && i.batchId === item.batchId
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.saleItems.push(item);
      }
    },
    removeSaleItem: (state, action) => {
      state.saleItems = state.saleItems.filter(i => 
        !(i.productId === action.payload.productId && i.batchId === action.payload.batchId)
      );
    },
    updateQuantity: (state, action) => {
      const { productId, batchId, quantity } = action.payload;
      const item = state.saleItems.find(i => 
        i.productId === productId && i.batchId === batchId
      );
      if (item) {
        item.quantity = quantity;
      }
    },
    clearSale: (state) => {
      state.saleItems = [];
      state.currentCustomer = null;
      state.paymentMethod = "Cash";
      state.cashGiven = "";
      state.selectedBatch = null;
      state.showBatchModal = false;
      state.currentProduct = null;
    },
    setHoldSales: (state, action) => {
      state.holdSales = action.payload;
    },
    setCustomers: (state, action) => {
      state.customers = action.payload;
    },
    setCustomer: (state, action) => {
      state.currentCustomer = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    setCashGiven: (state, action) => {
      state.cashGiven = action.payload;
    },
    setCategoryId: (state, action) => {
      state.selectedCategoryId = action.payload;
    },
    setShowBatchModal: (state, action) => { // New
      state.showBatchModal = action.payload;
    },
    setCurrentProduct: (state, action) => { // New
      state.currentProduct = action.payload;
    },
    setSelectedBatch: (state, action) => { // New
      state.selectedBatch = action.payload;
    },
  },
});

export const {
  setCategories,
  setProducts,
  setSuppliers,
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
  setShowBatchModal,
  setCurrentProduct,
  setSelectedBatch,
} = posSlice.actions;

export default posSlice.reducer;
