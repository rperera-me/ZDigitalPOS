import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import posReducer from "./posSlice";
import dashboardReducer from "./dashboardSlice";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pos: posReducer,
    user: userReducer,
    dashboard: dashboardReducer
  },
});
