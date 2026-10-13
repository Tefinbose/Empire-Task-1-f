import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, Loader2 } from "lucide-react";
import { getAnalyticsData } from "../../services/analyticsService";

function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildTimeline(activePeriod, salesOverTime = []) {
  const days = activePeriod === "7D" ? 7 : 30;
  const result = [];
  const salesMap = new Map();

  salesOverTime.forEach((item) => {
    if (item.date) {
      salesMap.set(item.date, item);
    }
  });

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = formatDateKey(d);
    const match = salesMap.get(dateStr);

    const label = d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });

    result.push({
      date: dateStr,
      label,
      sales: match ? match.sales : 0,
      orders: match ? match.orders : 0,
    });
  }

  return result;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-label">{label || data.date}</p>
        <p className="tooltip-value">
          ₹{Number(data.sales || 0).toLocaleString("en-IN")}
        </p>
        <span className="tooltip-sub">
          {data.orders || 0} {data.orders === 1 ? "order" : "orders"} on this day
        </span>
      </div>
    );
  }
  return null;
}

export default function SalesChart() {
  const [activePeriod, setActivePeriod] = useState("7D");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchChartData() {
      setLoading(true);
      try {
        const rangeParam = activePeriod === "7D" ? "7d" : "30d";
        const response = await getAnalyticsData(rangeParam);
        if (isMounted) {
          setAnalytics(response);
        }
      } catch (err) {
        console.error("Failed to fetch live sales chart data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchChartData();
    return () => {
      isMounted = false;
    };
  }, [activePeriod]);

  const chartData = useMemo(() => {
    const salesOverTime = analytics?.salesOverTime || [];
    return buildTimeline(activePeriod, salesOverTime);
  }, [activePeriod, analytics]);

  const currentTotal = useMemo(() => {
    if (analytics?.kpis?.grossSales !== undefined) {
      return analytics.kpis.grossSales;
    }
    return chartData.reduce((acc, curr) => acc + curr.sales, 0);
  }, [analytics, chartData]);

  return (
    <section className="admin-panel sales-panel">
      <div className="panel-heading">
        <div>
          <div className="panel-title-row">
            <h3>Sales & Revenue Analytics</h3>
            <span className="live-pill-sm">
              <TrendingUp size={12} />
              Live Orders
            </span>
          </div>
          <p>Gross revenue volume across online checkout</p>
        </div>

        <div className="chart-actions">
          <div className="period-tabs">
            {["7D", "30D"].map((period) => (
              <button
                key={period}
                type="button"
                className={`period-tab-btn ${activePeriod === period ? "active" : ""}`}
                onClick={() => setActivePeriod(period)}
                disabled={loading}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sales-chart-summary">
        <div className="chart-metric-item">
          <span className="metric-label">Period Gross Sales</span>
          <h4 className="metric-value">
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Loader2 size={16} className="spin" />
                <span>Updating...</span>
              </span>
            ) : (
              `₹${Number(currentTotal || 0).toLocaleString("en-IN")}`
            )}
          </h4>
        </div>
        <div className="chart-metric-item">
          <span className="metric-label">Reporting Range</span>
          <span className="metric-sub">
            <Calendar size={13} />
            {activePeriod === "7D" ? "Past 7 Calendar Days" : "Past 30 Calendar Days"}
          </span>
        </div>
      </div>

      <div className="sales-chart">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="85%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval={activePeriod === "30D" ? "preserveStartEnd" : 0}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(value) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#4f46e5"
              strokeWidth={3}
              fill="url(#salesGradient)"
              activeDot={{ r: 6, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}