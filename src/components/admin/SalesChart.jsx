import { useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

const datasets = {
  "7D": [
    { label: "Mon", sales: 14500, orders: 12 },
    { label: "Tue", sales: 22800, orders: 19 },
    { label: "Wed", sales: 18200, orders: 15 },
    { label: "Thu", sales: 31400, orders: 26 },
    { label: "Fri", sales: 27900, orders: 22 },
    { label: "Sat", sales: 42100, orders: 35 },
    { label: "Sun", sales: 38600, orders: 31 },
  ],
  "30D": [
    { label: "Wk 1", sales: 94000, orders: 84 },
    { label: "Wk 2", sales: 128000, orders: 110 },
    { label: "Wk 3", sales: 116000, orders: 98 },
    { label: "Wk 4", sales: 165000, orders: 142 },
  ],
};

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          ₹{Number(data.sales || 0).toLocaleString("en-IN")}
        </p>
        {data.orders && (
          <span className="tooltip-sub">
            {data.orders} completed orders
          </span>
        )}
      </div>
    );
  }
  return null;
}

export default function SalesChart() {
  const [activePeriod, setActivePeriod] = useState("7D");
  const chartData = datasets[activePeriod] || datasets["7D"];

  const currentTotal = chartData.reduce((acc, curr) => acc + curr.sales, 0);

  return (
    <section className="admin-panel sales-panel">
      <div className="panel-heading">
        <div>
          <div className="panel-title-row">
            <h3>Sales & Revenue Analytics</h3>
            <span className="live-pill-sm">
              <TrendingUp size={12} />
              +18.2% Growth
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
            ₹{currentTotal.toLocaleString("en-IN")}
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