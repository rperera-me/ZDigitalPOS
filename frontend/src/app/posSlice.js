import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  products: [],
  suppliers: [],
  saleItems: [],
  holdSales: [],
  customers: [],
  currentCustomer: null,
  paymentMethod: "Cash",
  cashGiven: "",
  selectedCategoryId: null,
  selectedBatch: null,
  showBatchModal: false,
  currentProduct: null,
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
    setSuppliers: (state, action) => {
      state.suppliers = action.payload;
    },
    addSaleItem: (state, action) => {
      const item = action.payload;
      
      // Create unique key: if no batch, use productId + price for matching
      const itemKey = item.batchId 
        ? `${item.productId}-${item.batchId}` 
        : `${item.productId}-${item.price}`;
      
      // Find existing item with same key
      const existing = state.saleItems.find(i => {
        const existingKey = i.batchId 
          ? `${i.productId}-${i.batchId}` 
          : `${i.productId}-${i.price}`;
        return existingKey === itemKey;
      });
      
      if (existing) {
        // Update quantity of existing item
        existing.quantity += item.quantity;
      } else {
        // Add as new item
        state.saleItems.push(item);
      }
    },
    removeSaleItem: (state, action) => {
      const { productId, batchId, price } = action.payload;
      state.saleItems = state.saleItems.filter(i => {
        // Match by batch if provided, otherwise by price
        if (batchId !== undefined && batchId !== null) {
          return !(i.productId === productId && i.batchId === batchId);
        } else {
          return !(i.productId === productId && i.price === price);
        }
      });
    },
    updateQuantity: (state, action) => {
      const { productId, batchId, price, quantity } = action.payload;
      const item = state.saleItems.find(i => {
        if (batchId !== undefined && batchId !== null) {
          return i.productId === productId && i.batchId === batchId;
        } else {
          return i.productId === productId && i.price === price;
        }
      });
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
    setShowBatchModal: (state, action) => {
      state.showBatchModal = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    setSelectedBatch: (state, action) => {
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