import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import "./i18n/i18n"

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <HashRouter>  {/* ✅ Changed from BrowserRouter */}
      <App />
    </HashRouter>
  </Provider>
);
