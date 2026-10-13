import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Users, BarChart3, Megaphone, Tag, Settings as SettingsIcon } from "lucide-react";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import Orders from "./pages/admin/Orders";
import Customers from "./pages/admin/Customers";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import PlaceholderPage from "./pages/admin/PlaceholderPage";

function AdminGuard({ children }) {
  const token = localStorage.getItem("adminToken");

  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <AdminGuard>
              <Dashboard />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminGuard>
              <Products />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/products/add"
          element={
            <AdminGuard>
              <AddProduct />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/products/edit/:id"
          element={
            <AdminGuard>
              <EditProduct />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminGuard>
              <Orders />
            </AdminGuard>
          }
        />

        {/* Shopify Customer Management (Fully Connected) */}
        <Route
          path="/admin/customers"
          element={
            <AdminGuard>
              <Customers />
            </AdminGuard>
          }
        />

        {/* Shopify Real-Time Analytics & Reports (Fully Connected) */}
        <Route
          path="/admin/analytics"
          element={
            <AdminGuard>
              <Analytics />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/marketing"
          element={
            <AdminGuard>
              <PlaceholderPage
                title="Marketing & Campaigns"
                description="Manage automated email flows, ad tracking, and promotional outreach"
                icon={Megaphone}
              />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/discounts"
          element={
            <AdminGuard>
              <PlaceholderPage
                title="Discounts & Coupons"
                description="Create percentage discounts, promo codes, and minimum cart promotions"
                icon={Tag}
              />
            </AdminGuard>
          }
        />

        {/* Shopify Store Settings & Merchant Profile (Fully Connected) */}
        <Route
          path="/admin/settings"
          element={
            <AdminGuard>
              <Settings />
            </AdminGuard>
          }
        />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
