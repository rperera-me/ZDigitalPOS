import { createSlice } from "@reduxjs/toolkit";
import defaultSettings from "../config/storeSettings";

const STORAGE_KEY = "zdigitalpos_store_settings";

const BASE_DEFAULTS = {
  ...defaultSettings,
  storeLogo: "",
  paperWidth: "80mm",
};

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...BASE_DEFAULTS, ...JSON.parse(saved) };
  } catch {}
  return { ...BASE_DEFAULTS };
}

const settingsSlice = createSlice({
  name: "settings",
  initialState: loadFromStorage(),
  reducers: {
    saveSettings: (_state, action) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      } catch {}
      return action.payload;
    },
  },
});

export const { saveSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
