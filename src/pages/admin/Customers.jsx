import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  Search,
  RotateCw,
  X,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
} from "../../services/customerService";

export default function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  // Selected customer for detail view
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadCustomersList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCustomers({
        search: searchQuery,
        status: statusFilter,
      });
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadCustomersList();
  }, [navigate, loadCustomersList]);

  // Load customer detail drawer
  async function handleViewDetails(id) {
    setSelectedCustomerId(id);
    setLoadingDetail(true);
    try {
      const data = await getCustomerById(id);
      setCustomerDetail(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load customer profile.");
    } finally {
      setLoadingDetail(false);
    }
  }

  // Toggle customer status
  async function handleToggleStatus(customer) {
    const nextStatus = customer.status === "active" ? "blocked" : "active";
    const confirmMsg =
      nextStatus === "blocked"
        ? `Are you sure you want to block ${customer.name}? They will not be able to log in or purchase.`
        : `Re-activate customer account for ${customer.name}?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(customer._id);
    try {
      await updateCustomerStatus(customer._id, nextStatus);
      await loadCustomersList();

      if (selectedCustomerId === customer._id) {
        setCustomerDetail((prev) =>
          prev ? { ...prev, customer: { ...prev.customer, status: nextStatus } } : null
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update customer status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "active").length;
    const blocked = customers.filter((c) => c.status === "blocked").length;
    const totalSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return { total, active, blocked, totalSpend };
  }, [customers]);

  return (
    <AdminLayout>
      <div className="customers-page-container">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">RELATIONSHIPS & CRM</span>
            <h1>Customers</h1>
            <p>Manage customer directory, purchasing history, and account standing.</p>
          </div>

          <button
            type="button"
            className="secondary-button refresh-btn"
            onClick={loadCustomersList}
            disabled={loading}
          >
            <RotateCw size={15} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Customer KPI Metric Strip */}
        <div className="orders-metric-strip">
          <div className="order-metric-card">
            <div className="metric-icon-wrap indigo">
              <Users size={18} />
            </div>
            <div>
              <span className="metric-card-label">Total Customers</span>
              <h4 className="metric-card-value">{metrics.total}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap green">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="metric-card-label">Active Accounts</span>
              <h4 className="metric-card-value">{metrics.active}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap orange">
              <UserX size={18} />
            </div>
            <div>
              <span className="metric-card-label">Blocked / Inactive</span>
              <h4 className="metric-card-value">{metrics.blocked}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap emerald">
              <IndianRupee size={18} />
            </div>
            <div>
              <span className="metric-card-label">Cumulative Spend</span>
              <h4 className="metric-card-value">
                ₹{metrics.totalSpend.toLocaleString("en-IN")}
              </h4>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="orders-filter-container">
          <div className="shopify-order-tabs">
            {[
              { id: "all", label: "All Customers", count: metrics.total },
              { id: "active", label: "Active", count: metrics.active },
              { id: "blocked", label: "Blocked", count: metrics.blocked },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`order-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span className="tab-title">{tab.label}</span>
                <span className="tab-badge">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="order-search-box">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Customers Table */}
        <section className="admin-panel">
          {loading ? (
            <div className="loading-state-card">
              <div className="loading-spinner"></div>
              <p>Fetching customer profiles...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <Users size={42} strokeWidth={1.5} className="empty-icon" />
              <h4>No customers found</h4>
              <p>Registered storefront users will automatically appear in this directory.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spend</th>
                    <th>Status</th>
                    <th>Customer Since</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const initial = (c.name || "C").charAt(0).toUpperCase();
                    const joinDate = c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recently";

                    return (
                      <tr key={c._id} className="table-row">
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar-badge">{initial}</div>
                            <div className="customer-meta">
                              <strong className="customer-name">{c.name || "Customer"}</strong>
                              <small className="customer-email">{c.email}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="customer-phone-text">
                            {c.phone || "Not provided"}
                          </span>
                        </td>

                        <td>
                          <span className="items-count-badge">
                            {c.ordersCount ?? 0} {c.ordersCount === 1 ? "order" : "orders"}
                          </span>
                        </td>

                        <td>
                          <span className="price-tag">
                            ₹{Number(c.totalSpent || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td>
                          <span className={`status-pill ${c.status || "active"}`}>
                            <span className="status-dot"></span>
                            {c.status || "active"}
                          </span>
                        </td>

                        <td>
                          <span className="date-cell-text">{joinDate}</span>
                        </td>

                        <td className="text-right">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="icon-action"
                              onClick={() => handleViewDetails(c._id)}
                              title="View Customer Profile"
                              aria-label={`View ${c.name} details`}
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              className={`icon-action ${c.status === "active" ? "delete" : "edit"}`}
                              onClick={() => handleToggleStatus(c)}
                              disabled={updatingId === c._id}
                              title={c.status === "active" ? "Block Customer" : "Unblock Customer"}
                              aria-label={`${c.status === "active" ? "Block" : "Unblock"} ${c.name}`}
                            >
                              {c.status === "active" ? (
                                <ShieldAlert size={15} />
                              ) : (
                                <ShieldCheck size={15} />
                              )}
                            </button>
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

        {/* Customer Detail Modal / Drawer */}
        {selectedCustomerId && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedCustomerId(null)}
            aria-hidden="true"
          >
            <div
              className="modal-card customer-detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>Customer Profile</h3>
                  <p>Order history and customer lifetime metrics</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedCustomerId(null)}
                >
                  <X size={18} />
                </button>
              </div>

              {loadingDetail || !customerDetail ? (
                <div className="loading-state-card" style={{ padding: "40px" }}>
                  <div className="loading-spinner"></div>
                  <p>Loading profile details...</p>
                </div>
              ) : (
                <div className="modal-body">
                  <div className="customer-profile-banner">
                    <div className="profile-large-avatar">
                      {(customerDetail.customer?.name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-banner-info">
                      <h3>{customerDetail.customer?.name}</h3>
                      <div className="profile-meta-row">
                        <span>
                          <Mail size={13} /> {customerDetail.customer?.email}
                        </span>
                        {customerDetail.customer?.phone && (
                          <span>
                            <Phone size={13} /> {customerDetail.customer?.phone}
                          </span>
                        )}
                        <span>
                          <Calendar size={13} /> Joined{" "}
                          {new Date(customerDetail.customer?.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`status-pill ${customerDetail.customer?.status || "active"}`}>
                      <span className="status-dot"></span>
                      {customerDetail.customer?.status}
                    </span>
                  </div>

                  <div className="customer-kpi-summary">
                    <div className="customer-kpi-item">
                      <span className="kpi-label">Total Orders</span>
                      <strong className="kpi-value">{customerDetail.customer?.ordersCount ?? 0}</strong>
                    </div>
                    <div className="customer-kpi-item">
                      <span className="kpi-label">Lifetime Value</span>
                      <strong className="kpi-value">
                        ₹{Number(customerDetail.customer?.totalSpent || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <div className="customer-kpi-item">
                      <span className="kpi-label">Average Order Value</span>
                      <strong className="kpi-value">
                        ₹
                        {customerDetail.customer?.ordersCount
                          ? Math.round(
                              (customerDetail.customer?.totalSpent || 0) /
                                customerDetail.customer?.ordersCount
                            ).toLocaleString("en-IN")
                          : "0"}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-orders-section">
                    <h4>Order History ({customerDetail.orders?.length || 0})</h4>
                    {customerDetail.orders?.length === 0 ? (
                      <p className="no-orders-hint">No orders placed by this customer yet.</p>
                    ) : (
                      <div className="customer-orders-list">
                        {customerDetail.orders.map((ord) => (
                          <div key={ord._id} className="customer-order-row">
                            <div className="order-row-main">
                              <span className="order-code-badge">
                                #{ord._id.slice(-8).toUpperCase()}
                              </span>
                              <span className="order-date-text">
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="order-row-items">
                              {ord.items?.map((it, idx) => (
                                <span key={idx} className="item-preview-tag">
                                  {it.product?.name || "Product"} × {it.quantity}
                                </span>
                              ))}
                            </div>
                            <div className="order-row-right">
                              <span className="price-tag">
                                ₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}
                              </span>
                              <span className={`status-pill ${ord.status}`}>
                                <span className="status-dot"></span>
                                {ord.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
