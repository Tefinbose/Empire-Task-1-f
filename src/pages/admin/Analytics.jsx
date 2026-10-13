import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Users,
  RotateCw,
  Award,
  Layers,
  CheckCircle2,
  Clock,
  Ban,
  Package,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { getAnalyticsData } from "../../services/analyticsService";

function CustomSalesTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-label">{label || data.date}</p>
        <p className="tooltip-value">
          ₹{Number(data.sales || 0).toLocaleString("en-IN")}
        </p>
        <span className="tooltip-sub">
          {data.orders} {data.orders === 1 ? "order" : "orders"} on this day
        </span>
      </div>
    );
  }
  return null;
}

export default function Analytics() {
  const navigate = useNavigate();

  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAnalyticsData(range);
      setData(response);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load store analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadAnalytics();
  }, [navigate, loadAnalytics]);

  const kpis = data?.kpis || {
    grossSales: 0,
    deliveredSales: 0,
    totalOrders: 0,
    deliveredCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    aov: 0,
    fulfillmentRate: 100,
    totalCustomers: 0,
    repeatCustomers: 0,
    repeatCustomerRate: 0,
  };

  const salesOverTime = data?.salesOverTime || [];
  const topProducts = data?.topProducts || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const statusDistribution = data?.statusDistribution || [];

  return (
    <AdminLayout>
      <div className="analytics-page-container">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">REPORTING & INTELLIGENCE</span>
            <h1>Analytics</h1>
            <p>Financial metrics, customer repeat patterns, and inventory performance.</p>
          </div>

          <div className="analytics-header-actions">
            <div className="period-tabs">
              {[
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "90d", label: "Last 90 Days" },
                { id: "1y", label: "Past Year" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`period-tab-btn ${range === p.id ? "active" : ""}`}
                  onClick={() => setRange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="secondary-button refresh-btn"
              onClick={loadAnalytics}
              disabled={loading}
              title="Refresh Analytics"
            >
              <RotateCw size={15} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state-card" style={{ padding: "80px 20px" }}>
            <div className="loading-spinner"></div>
            <p>Compiling store analytics and aggregation reports...</p>
          </div>
        ) : (
          <>
            {/* Core Financial & KPI Strip */}
            <div className="stats-grid">
              <article className="stat-card stat-card-green">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap green">
                    <IndianRupee size={22} strokeWidth={2.2} />
                  </div>
                  <div className="stat-trend-badge positive">
                    <TrendingUp size={12} strokeWidth={2.5} />
                    <span>Live Revenue</span>
                  </div>
                </div>
                <div className="stat-card-body">
                  <p className="stat-title">Total Gross Sales</p>
                  <h3 className="stat-value">
                    ₹{Number(kpis.grossSales || 0).toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="stat-card-footer">
                  <span className="stat-description">
                    ₹{Number(kpis.deliveredSales || 0).toLocaleString("en-IN")} delivered
                  </span>
                  <span className="stat-trend-subtext">Completed Orders</span>
                </div>
              </article>

              <article className="stat-card stat-card-indigo">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap indigo">
                    <Award size={22} strokeWidth={2.2} />
                  </div>
                  <div className="stat-trend-badge positive">
                    <span>Average Basket</span>
                  </div>
                </div>
                <div className="stat-card-body">
                  <p className="stat-title">Average Order Value (AOV)</p>
                  <h3 className="stat-value">
                    ₹{Number(kpis.aov || 0).toLocaleString("en-IN")}
                  </h3>
                </div>
                <div className="stat-card-footer">
                  <span className="stat-description">Per valid transaction</span>
                  <span className="stat-trend-subtext">Cart Metric</span>
                </div>
              </article>

              <article className="stat-card stat-card-orange">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap orange">
                    <ShoppingCart size={22} strokeWidth={2.2} />
                  </div>
                  <div className="stat-trend-badge positive">
                    <span>{kpis.fulfillmentRate}% Fulfilled</span>
                  </div>
                </div>
                <div className="stat-card-body">
                  <p className="stat-title">Total Orders Volume</p>
                  <h3 className="stat-value">{kpis.totalOrders}</h3>
                </div>
                <div className="stat-card-footer">
                  <span className="stat-description">
                    {kpis.deliveredCount} delivered, {kpis.pendingCount} pending
                  </span>
                  <span className="stat-trend-subtext">Dispatch Rate</span>
                </div>
              </article>

              <article className="stat-card stat-card-blue">
                <div className="stat-card-header">
                  <div className="stat-icon-wrap blue">
                    <Users size={22} strokeWidth={2.2} />
                  </div>
                  <div className="stat-trend-badge positive">
                    <span>{kpis.repeatCustomerRate}% Repeat</span>
                  </div>
                </div>
                <div className="stat-card-body">
                  <p className="stat-title">Customer Retention</p>
                  <h3 className="stat-value">{kpis.repeatCustomers}</h3>
                </div>
                <div className="stat-card-footer">
                  <span className="stat-description">
                    {kpis.totalCustomers} total registered accounts
                  </span>
                  <span className="stat-trend-subtext">Repeat Buyers</span>
                </div>
              </article>
            </div>

            {/* Sales Over Time Chart */}
            <div className="analytics-main-chart-section">
              <section className="admin-panel sales-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-title-row">
                      <h3>Gross Sales Velocity</h3>
                      <span className="panel-badge-pill">
                        {salesOverTime.length} active data points
                      </span>
                    </div>
                    <p>Daily order volume and revenue generation curve</p>
                  </div>
                  <span className="chart-period">
                    Window: {range.toUpperCase()}
                  </span>
                </div>

                {salesOverTime.length === 0 ? (
                  <div className="empty-state" style={{ padding: "60px 20px" }}>
                    <ShoppingCart size={36} className="empty-icon" />
                    <h4>No order revenue in this period</h4>
                    <p>Sales will automatically register on the chart as customers place orders.</p>
                  </div>
                ) : (
                  <div className="sales-chart" style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesOverTime} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsSalesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                            <stop offset="90%" stopColor="#4f46e5" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                        />
                        <Tooltip content={<CustomSalesTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          fill="url(#analyticsSalesGrad)"
                          activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </div>

            {/* Split Grid: Top Selling Products & Category Breakdown */}
            <div className="analytics-secondary-grid">
              {/* Leaderboard: Top Selling Products */}
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-title-row">
                      <h3>Top Performing Products</h3>
                      <span className="panel-badge-pill">By Revenue</span>
                    </div>
                    <p>Best-selling catalogue items ranked by sales volume</p>
                  </div>
                </div>

                {topProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px" }}>
                    <Package size={36} className="empty-icon" />
                    <h4>No product sales recorded yet</h4>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th className="text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p, idx) => (
                          <tr key={idx} className="table-row">
                            <td>
                              <span className={`rank-badge rank-${idx + 1}`}>
                                #{idx + 1}
                              </span>
                            </td>
                            <td>
                              <div className="product-cell">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="product-thumbnail"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="product-placeholder">
                                    {(p.name || "P").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="product-meta">
                                  <span className="product-title-text">{p.name}</span>
                                  <span className="category-pill" style={{ display: "inline-block", marginTop: "3px" }}>
                                    {p.category}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="items-count-badge">
                                {p.unitsSold} units
                              </span>
                            </td>
                            <td className="text-right">
                              <span className="price-tag">
                                ₹{Number(p.revenue || 0).toLocaleString("en-IN")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Category Revenue Distribution */}
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-title-row">
                      <h3>Sales by Category</h3>
                      <span className="panel-badge-pill">Distribution</span>
                    </div>
                    <p>Gross revenue grouped by department</p>
                  </div>
                </div>

                {categoryDistribution.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px" }}>
                    <Layers size={36} className="empty-icon" />
                    <h4>No category metrics</h4>
                  </div>
                ) : (
                  <div className="category-analytics-container">
                    <div style={{ height: "220px", width: "100%", padding: "10px 10px 0" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
                          <XAxis
                            dataKey="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                          />
                          <Tooltip
                            formatter={(value) => [
                              `₹${Number(value).toLocaleString("en-IN")}`,
                              "Gross Revenue",
                            ]}
                          />
                          <Bar
                            dataKey="revenue"
                            fill="#6366f1"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="category-pills-list">
                      {categoryDistribution.map((cat, idx) => (
                        <div key={idx} className="category-stat-row">
                          <span className="category-name-bold">{cat.category}</span>
                          <span className="category-meta-nums">
                            {cat.units} sold • <strong>₹{Number(cat.revenue).toLocaleString("en-IN")}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Fulfillment Status Health */}
            <div className="fulfillment-health-section">
              <div className="fulfillment-health-card">
                <div className="health-card-header">
                  <h4>Fulfillment Status Pipeline</h4>
                  <p>Distribution of all recorded store checkouts</p>
                </div>
                <div className="status-health-grid">
                  <div className="health-stat-pill">
                    <div className="health-icon delivered">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <span className="health-label">Delivered</span>
                      <strong className="health-num">{kpis.deliveredCount}</strong>
                    </div>
                  </div>

                  <div className="health-stat-pill">
                    <div className="health-icon pending">
                      <Clock size={16} />
                    </div>
                    <div>
                      <span className="health-label">Pending</span>
                      <strong className="health-num">{kpis.pendingCount}</strong>
                    </div>
                  </div>

                  <div className="health-stat-pill">
                    <div className="health-icon cancelled">
                      <Ban size={16} />
                    </div>
                    <div>
                      <span className="health-label">Cancelled</span>
                      <strong className="health-num">{kpis.cancelledCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
