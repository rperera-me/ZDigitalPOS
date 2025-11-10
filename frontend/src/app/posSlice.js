import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  products: [],
  suppliers: [],
  saleItems: [],
  holdSales: [],
  customers: [],
  currentCustomer: null,
  selectedCategoryId: null,
  selectedSource: null,
  showPriceModal: false,
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
      
      const itemKey = item.sourceId 
        ? `${item.productId}-${item.sourceId}` 
        : `${item.productId}-${item.price}`;
      
      const existing = state.saleItems.find(i => {
        const existingKey = i.sourceId 
          ? `${i.productId}-${i.sourceId}` 
          : `${i.productId}-${i.price}`;
        return existingKey === itemKey;
      });
      
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.saleItems.push(item);
      }
    },
    removeSaleItem: (state, action) => {
      const { productId, sourceId, price } = action.payload;
      state.saleItems = state.saleItems.filter(i => {
        if (sourceId !== undefined && sourceId !== null) {
          return !(i.productId === productId && i.sourceId === sourceId);
        } else {
          return !(i.productId === productId && i.price === price);
        }
      });
    },
    updateQuantity: (state, action) => {
      const { productId, sourceId, price, quantity } = action.payload;
      const item = state.saleItems.find(i => {
        if (sourceId !== undefined && sourceId !== null) {
          return i.productId === productId && i.sourceId === sourceId;
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
      state.selectedSource = null;
      state.showPriceModal = false;
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
    setCategoryId: (state, action) => {
      state.selectedCategoryId = action.payload;
    },
    setShowPriceModal: (state, action) => {
      state.showPriceModal = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    setSelectedSource: (state, action) => {
      state.selectedSource = action.payload;
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
  setCategoryId,
  setShowPriceModal,
  setCurrentProduct,
  setSelectedSource,
} = posSlice.actions;

export default posSlice.reducer;
