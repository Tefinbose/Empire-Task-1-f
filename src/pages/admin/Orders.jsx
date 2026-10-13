import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  RotateCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  IndianRupee,
  Search,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { getRecentOrders, updateOrderStatus } from "../../services/analyticsService";

const statuses = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRecentOrders();
      setOrders(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadOrders();
  }, [navigate, loadOrders]);

  async function changeStatus(id, newStatus) {
    setUpdatingId(id);
    try {
      await updateOrderStatus(id, newStatus);
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update order.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce(
      (sum, o) => (o.status === "delivered" ? sum + (o.totalAmount || 0) : sum),
      0
    );
    return { total, pending, delivered, revenue };
  }, [orders]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    statuses.slice(1).forEach((st) => {
      counts[st] = orders.filter((o) => o.status === st).length;
    });
    return counts;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeStatusTab !== "all" && order.status !== activeStatusTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const idMatch = order._id?.toLowerCase().includes(query);
        const nameMatch = order.customer?.name?.toLowerCase().includes(query);
        const emailMatch = order.customer?.email?.toLowerCase().includes(query);
        return idMatch || nameMatch || emailMatch;
      }
      return true;
    });
  }, [orders, activeStatusTab, searchQuery]);

  return (
    <AdminLayout>
      <div className="orders-page-container">
        {/* Page Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">FULFILLMENT & DISPATCH</span>
            <h1>Orders</h1>
            <p>Track customer purchases, fulfillment workflows, and order settlements.</p>
          </div>

          <button
            type="button"
            className="secondary-button refresh-btn"
            onClick={loadOrders}
            disabled={loading}
          >
            <RotateCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Order KPI Strip */}
        <div className="orders-metric-strip">
          <div className="order-metric-card">
            <div className="metric-icon-wrap indigo">
              <ShoppingBag size={18} />
            </div>
            <div>
              <span className="metric-card-label">Total Volume</span>
              <h4 className="metric-card-value">{metrics.total}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap orange">
              <Clock size={18} />
            </div>
            <div>
              <span className="metric-card-label">Pending Action</span>
              <h4 className="metric-card-value">{metrics.pending}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap green">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="metric-card-label">Fulfilled & Delivered</span>
              <h4 className="metric-card-value">{metrics.delivered}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap emerald">
              <IndianRupee size={18} />
            </div>
            <div>
              <span className="metric-card-label">Delivered Revenue</span>
              <h4 className="metric-card-value">
                ₹{metrics.revenue.toLocaleString("en-IN")}
              </h4>
            </div>
          </div>
        </div>

        {/* Status Tabs and Search */}
        <div className="orders-filter-container">
          <div className="shopify-order-tabs">
            {statuses.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`order-tab-btn ${activeStatusTab === tab ? "active" : ""}`}
                onClick={() => setActiveStatusTab(tab)}
              >
                <span className="tab-title">
                  {tab === "all" ? "All Orders" : tab}
                </span>
                <span className="tab-badge">{tabCounts[tab] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="order-search-box">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Search by ID, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table Panel */}
        <section className="admin-panel">
          {loading ? (
            <div className="loading-state-card">
              <div className="loading-spinner"></div>
              <p>Fetching order queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={42} strokeWidth={1.5} className="empty-icon" />
              <h4>No orders match your criteria</h4>
              <p>Try switching to another tab or resetting your search query.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Current Status</th>
                    <th>Fulfillment Control</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const customerName = order.customer?.name || "Customer";
                    const initial = customerName.charAt(0).toUpperCase();
                    const totalItems =
                      order.items?.reduce(
                        (sum, it) => sum + (it.quantity || 1),
                        0
                      ) || 1;

                    return (
                      <tr key={order._id} className="table-row">
                        <td>
                          <span className="order-code-badge">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                        </td>

                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar-badge">{initial}</div>
                            <div className="customer-meta">
                              <strong className="customer-name">{customerName}</strong>
                              <small className="customer-email">
                                {order.customer?.email || "No contact info"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="items-count-badge">
                            {totalItems} {totalItems === 1 ? "item" : "items"}
                          </span>
                        </td>

                        <td>
                          <span className="price-tag">
                            ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td>
                          <span className={`status-pill ${order.status || "pending"}`}>
                            <span className="status-dot"></span>
                            {order.status || "pending"}
                          </span>
                        </td>

                        <td>
                          <div className="status-control-cell">
                            <select
                              value={order.status}
                              onChange={(e) => changeStatus(order._id, e.target.value)}
                              className={`status-select ${order.status}`}
                              disabled={updatingId === order._id}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updatingId === order._id && (
                              <div className="status-updating-dot"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}