import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CashierPage from "./pages/CashierPage";
import AdminPage from "./pages/AdminPage";
import CategoriesPage from "./pages/AdminCategoriesPage";
import ProductsPage from "./pages/AdminProductsPage";
import CustomersPage from "./pages/AdminCustomersPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import NavigationBar from "./components/NavigationBar";
import GRNPage from "./pages/GRNPage";
import AdminSuppliersPage from "./pages/AdminSuppliersPage";

// Layout wrapper to include navigation bar for pages that need it
function MainLayout({ children }) {
  return (
    <>
      <NavigationBar />
      <div>{children}</div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["admin", "cashier"]}>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier"
        element={
          <ProtectedRoute roles={["cashier", "admin"]}>
            <CashierPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <CustomersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <CategoriesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <ProductsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suppliers"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <AdminSuppliersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/grn"
        element={
          <ProtectedRoute roles={["admin"]}>
            <MainLayout>
              <GRNPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}