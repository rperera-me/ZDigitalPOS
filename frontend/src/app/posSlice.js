import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  products: [],
  saleItems: [],
  holdSales: [],
  customers: [],
  currentCustomer: null,
  paymentMethod: "Cash",
  cashGiven: "",
  selectedCategoryId: null,
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
    addSaleItem: (state, action) => {
      const item = action.payload;
      const existing = state.saleItems.find(i => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.saleItems.push(item);
      }
    },
    removeSaleItem: (state, action) => {
      state.saleItems = state.saleItems.filter(i => i.productId !== action.payload);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.saleItems.find(i => i.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
    },
    clearSale: (state) => {
      state.saleItems = [];
      state.currentCustomer = null;
      state.paymentMethod = "Cash";
      state.cashGiven = "";
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
  },
});

export const {
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
} = posSlice.actions;

export default posSlice.reducer;
