import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  }
);

export const fetchLowStock = createAsyncThunk(
  "dashboard/fetchLowStock",
  async () => {
    const response = await api.get("/dashboard/lowstock");
    return response.data;
  }
);

export const fetchBestSellers = createAsyncThunk(
  "dashboard/fetchBestSellers",
  async () => {
    const response = await api.get("/dashboard/bestsellers");
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchLowStock.fulfilled, (state, action) => {
        state.lowStock = action.payload;
      })
      .addCase(fetchBestSellers.fulfilled, (state, action) => {
        state.bestSellers = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
