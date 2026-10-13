import { useEffect, useState } from "react";
import {
  Package,
  Users,
  ShoppingCart,
  IndianRupee,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import SalesChart from "../../components/admin/SalesChart";
import { getDashboardStats, getRecentOrders } from "../../services/analyticsService";

function RecentOrders({ orders = [] }) {
  const getStatusBadge = (status = "pending") => {
    return (
      <span className={`status-pill ${status.toLowerCase()}`}>
        <span className="status-dot"></span>
        {status}
      </span>
    );
  };

  return (
    <section className="admin-panel recent-orders-panel">
      <div className="panel-heading">
        <div>
          <div className="panel-title-row">
            <h3>Recent Orders</h3>
            <span className="panel-badge-pill">{orders.length} orders</span>
          </div>
          <p>Real-time orders placed across store</p>
        </div>

        <Link to="/admin/orders" className="panel-view-all">
          <span>View all</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={36} className="empty-icon" />
          <p>No orders recorded yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((order) => {
                const customerName = order.customer?.name || "Customer";
                const initial = customerName.charAt(0).toUpperCase();

                return (
                  <tr key={order._id} className="table-row">
                    <td>
                      <span className="order-code-badge">
                        #{order._id?.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar-badge">{initial}</div>
                        <div className="customer-meta">
                          <strong className="customer-name">{customerName}</strong>
                          <small className="customer-email">
                            {order.customer?.email || "No email"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="price-tag">
                        ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let admin = {};
  try {
    admin = JSON.parse(localStorage.getItem("admin") || "{}");
  } catch {
    admin = {};
  }

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    async function loadDashboard() {
      try {
        const [statsData, orderData] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(),
        ]);

        setStats(statsData);
        setOrders(orderData || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [navigate]);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <AdminLayout>
      <div className="dashboard-page-container">
        {/* Welcome Header */}
        <div className="page-heading page-heading-row">
          <div>
            <div className="welcome-banner-eyebrow">
              <Sparkles size={13} />
              <span>STORE OVERVIEW</span>
            </div>
            <h1>Good day, {admin.name || "Merchant"} 👋</h1>
            <p className="welcome-subtext">
              Here is your store summary and revenue metrics for today.
            </p>
          </div>

          <div className="page-heading-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/admin/orders")}
            >
              <ShoppingCart size={15} /> Manage Orders
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/admin/products/add")}
            >
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state-card">
            <div className="loading-spinner"></div>
            <p>Loading real-time store metrics...</p>
          </div>
        ) : stats ? (
          <>
            <div className="stats-grid">
              <StatCard
                title="Delivered Sales"
                value={formatCurrency(stats.totalSales)}
                Icon={IndianRupee}
                color="green"
                description="Total completed revenue"
                trend="+24.8%"
                trendText="vs previous month"
              />
              <StatCard
                title="Total Orders"
                value={stats.totalOrders ?? 0}
                Icon={ShoppingCart}
                color="orange"
                description={`${stats.pendingOrders ?? 0} pending processing`}
                trend="+8.2%"
                trendText="steady conversion"
              />
              <StatCard
                title="Active Products"
                value={stats.totalProducts ?? 0}
                Icon={Package}
                color="indigo"
                description="Live in catalog"
                trend="+4"
                trendText="new this week"
              />
              <StatCard
                title="Registered Customers"
                value={stats.totalUsers ?? 0}
                Icon={Users}
                color="blue"
                description="Customer accounts"
                trend="+15%"
                trendText="user signups"
              />
            </div>

            <div className="dashboard-grid">
              <SalesChart />
              <RecentOrders orders={orders} />
            </div>
          </>
        ) : (
          <div className="empty-state">No dashboard data returned.</div>
        )}
      </div>
    </AdminLayout>
  );
}