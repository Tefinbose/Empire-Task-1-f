import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  TrendingUp,
  Plus,
  Search,
  RotateCw,
  Play,
  Pause,
  Trash2,
  Pencil,
  Send,
  Share2,
  Mail,
  MessageSquare,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Clock,
  Users,
  ShoppingBag,
  IndianRupee,
  Target,
  Percent,
  Zap,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Link as LinkIcon,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import AdminLayout from "../../components/admin/AdminLayout";
import {
  getMarketingSummary,
  getCampaigns,
  createCampaign,
  updateCampaign,
  toggleCampaignStatus,
  triggerCampaign,
  deleteCampaign,
  getAutomations,
  toggleAutomationStatus,
  updateAutomation,
} from "../../services/marketingService";
import { getDiscounts } from "../../services/discountService";

const initialCampaignForm = {
  name: "",
  channel: "email",
  status: "active",
  targetAudience: "all",
  discountCode: "",
  budget: "",
  spend: "0",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  subject: "",
  content: "",
  ctaText: "Shop the Sale",
  ctaUrl: "/collections/all",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
};

// Tooltip for Revenue Timeline Chart
function MarketingChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-label">{label || data.date}</p>
        <p className="tooltip-value">
          ₹{Number(data.sales || 0).toLocaleString("en-IN")}
        </p>
        <span className="tooltip-sub">
          {data.orders} {data.orders === 1 ? "order" : "orders"} • ₹
          {Number(data.spend || 0).toLocaleString("en-IN")} ad spend
        </span>
      </div>
    );
  }
  return null;
}

export default function Marketing() {
  const navigate = useNavigate();

  // Active view tab: "overview", "campaigns", "automations", "utm-builder"
  const [activeTab, setActiveTab] = useState("overview");

  // Main Data States
  const [summaryData, setSummaryData] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Campaign Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Create / Edit Campaign Modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignForm, setCampaignForm] = useState(initialCampaignForm);
  const [campaignFormError, setCampaignFormError] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Automation Edit Modal
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState(null);
  const [autoDelay, setAutoDelay] = useState("");
  const [autoDiscount, setAutoDiscount] = useState("");
  const [savingAuto, setSavingAuto] = useState(false);

  // UTM Link Generator Tool States
  const [utmUrl, setUtmUrl] = useState("https://yourstore.com/products/summer-drop");
  const [utmCampaignInput, setUtmCampaignInput] = useState("summer_flash_sale");
  const [utmSourceInput, setUtmSourceInput] = useState("instagram");
  const [utmMediumInput, setUtmMediumInput] = useState("paid_social");
  const [copiedLink, setCopiedLink] = useState(false);

  // Toast Helper
  const showToast = useCallback((msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch all initial marketing data
  const loadMarketingData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [sumRes, campRes, autoRes, discRes] = await Promise.all([
        getMarketingSummary(),
        getCampaigns({
          search: searchQuery,
          status: statusFilter,
          channel: channelFilter,
        }),
        getAutomations(),
        getDiscounts().catch(() => ({ discounts: [] })),
      ]);

      setSummaryData(sumRes.data || null);
      setCampaigns(campRes.campaigns || []);
      setAutomations(autoRes.automations || []);
      setAvailableCoupons(discRes.discounts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load marketing data."
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, channelFilter]);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }
    loadMarketingData();
  }, [navigate, loadMarketingData]);

  // Open Campaign Modal for Creation
  function openCreateCampaign(targetAudience = "all") {
    setEditingCampaignId(null);
    setCampaignForm({
      ...initialCampaignForm,
      targetAudience,
      name:
        targetAudience === "vip"
          ? "VIP Exclusive Perks Campaign"
          : targetAudience === "new_customers"
          ? "New Customer Welcome Blast"
          : targetAudience === "abandoned_checkout"
          ? "Checkout Recovery Re-engagement"
          : "",
    });
    setCampaignFormError("");
    setCampaignModalOpen(true);
  }

  // Open Campaign Modal for Editing
  function openEditCampaign(c) {
    setEditingCampaignId(c._id);
    setCampaignForm({
      name: c.name || "",
      channel: c.channel || "email",
      status: c.status || "active",
      targetAudience: c.targetAudience || "all",
      discountCode: c.discountCode || "",
      budget: c.budget ? String(c.budget) : "0",
      spend: c.spend ? String(c.spend) : "0",
      startDate: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().split("T")[0] : "",
      subject: c.subject || "",
      content: c.content || "",
      ctaText: c.ctaText || "Shop the Sale",
      ctaUrl: c.ctaUrl || "/collections/all",
      utmSource: c.utmSource || "",
      utmMedium: c.utmMedium || "",
      utmCampaign: c.utmCampaign || "",
    });
    setCampaignFormError("");
    setCampaignModalOpen(true);
  }

  // Handle Campaign Form Save
  async function handleSaveCampaign(e) {
    e.preventDefault();
    setCampaignFormError("");

    if (!campaignForm.name.trim()) {
      setCampaignFormError("Campaign name is required.");
      return;
    }

    setSavingCampaign(true);
    try {
      const payload = {
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        status: campaignForm.status,
        targetAudience: campaignForm.targetAudience,
        discountCode: campaignForm.discountCode.trim().toUpperCase(),
        budget: Number(campaignForm.budget) || 0,
        spend: Number(campaignForm.spend) || 0,
        startDate: campaignForm.startDate || new Date(),
        endDate: campaignForm.endDate ? campaignForm.endDate : null,
        subject: campaignForm.subject.trim(),
        content: campaignForm.content.trim(),
        ctaText: campaignForm.ctaText.trim(),
        ctaUrl: campaignForm.ctaUrl.trim(),
        utmSource: campaignForm.utmSource.trim(),
        utmMedium: campaignForm.utmMedium.trim(),
        utmCampaign: campaignForm.utmCampaign.trim(),
      };

      if (editingCampaignId) {
        await updateCampaign(editingCampaignId, payload);
        showToast("Campaign updated successfully!");
      } else {
        await createCampaign(payload);
        showToast("New marketing campaign launched!");
      }

      setCampaignModalOpen(false);
      await loadMarketingData();
    } catch (err) {
      setCampaignFormError(
        err.response?.data?.message || err.message || "Failed to save campaign."
      );
    } finally {
      setSavingCampaign(false);
    }
  }

  // Toggle Campaign Status
  async function handleToggleCampaign(c) {
    const nextStatus = c.status === "active" ? "paused" : "active";
    setActionLoadingId(c._id);
    try {
      await toggleCampaignStatus(c._id, nextStatus);
      showToast(`Campaign ${nextStatus === "active" ? "resumed" : "paused"}.`);
      await loadMarketingData();
    } catch (err) {
      showToast(err.message || "Failed to change campaign status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Trigger / Dispatch Campaign Blast
  async function handleTriggerCampaign(c) {
    if (
      !window.confirm(
        `Are you ready to dispatch '${c.name}' to the ${c.targetAudience.replace("_", " ").toUpperCase()} audience via ${c.channel.toUpperCase()}?`
      )
    ) {
      return;
    }

    setActionLoadingId(c._id);
    try {
      const res = await triggerCampaign(c._id);
      showToast(res.message || "Campaign blast successfully dispatched!");
      await loadMarketingData();
    } catch (err) {
      showToast(err.message || "Failed to dispatch campaign.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Delete Campaign
  async function handleDeleteCampaign(id, name) {
    if (!window.confirm(`Permanently delete campaign '${name}'? This cannot be undone.`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      await deleteCampaign(id);
      showToast("Campaign deleted.");
      await loadMarketingData();
    } catch (err) {
      showToast(err.message || "Failed to delete campaign.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Toggle Automation Status
  async function handleToggleAutomation(auto) {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    setActionLoadingId(auto._id);
    try {
      await toggleAutomationStatus(auto._id, nextStatus);
      showToast(`Automation flow "${auto.name}" is now ${nextStatus}.`);
      await loadMarketingData();
    } catch (err) {
      showToast(err.message || "Failed to toggle automation.", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  // Open Edit Automation Modal
  function openEditAutomationModal(auto) {
    setEditingAuto(auto);
    setAutoDelay(auto.delay || "Immediate");
    setAutoDiscount(auto.discountCode || "");
    setAutoModalOpen(true);
  }

  // Save Automation Settings
  async function handleSaveAutomation(e) {
    e.preventDefault();
    if (!editingAuto) return;

    setSavingAuto(true);
    try {
      await updateAutomation(editingAuto._id, {
        delay: autoDelay,
        discountCode: autoDiscount.trim().toUpperCase(),
      });
      showToast("Automation configuration updated.");
      setAutoModalOpen(false);
      await loadMarketingData();
    } catch (err) {
      showToast(err.message || "Failed to update automation.", "error");
    } finally {
      setSavingAuto(false);
    }
  }

  // Channel Icon Helper
  function getChannelIcon(channel) {
    switch (channel) {
      case "email":
        return <Mail size={15} />;
      case "social":
        return <Share2 size={15} />;
      case "search":
        return <Globe size={15} />;
      case "sms":
        return <MessageSquare size={15} />;
      default:
        return <Megaphone size={15} />;
    }
  }

  // Generated UTM Preview
  const computedUtmLink = useMemo(() => {
    try {
      const url = new URL(utmUrl.startsWith("http") ? utmUrl : `https://${utmUrl}`);
      if (utmSourceInput) url.searchParams.set("utm_source", utmSourceInput);
      if (utmMediumInput) url.searchParams.set("utm_medium", utmMediumInput);
      if (utmCampaignInput) url.searchParams.set("utm_campaign", utmCampaignInput);
      return url.toString();
    } catch {
      return `${utmUrl}?utm_source=${utmSourceInput}&utm_medium=${utmMediumInput}&utm_campaign=${utmCampaignInput}`;
    }
  }, [utmUrl, utmSourceInput, utmMediumInput, utmCampaignInput]);

  function handleCopyUtmLink() {
    navigator.clipboard.writeText(computedUtmLink);
    setCopiedLink(true);
    showToast("Trackable campaign URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const metrics = summaryData?.metrics || {
    totalMarketingRevenue: 0,
    storeTotalSales: 0,
    salesAttributionRate: 0,
    totalMarketingOrders: 0,
    totalAdSpend: 0,
    overallRoas: 0,
    avgOrderValue: 0,
    totalClicks: 0,
    overallConversionRate: 0,
  };

  return (
    <AdminLayout>
      <div className="marketing-page-container">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className={`marketing-floating-toast ${toastMessage.type}`}>
            {toastMessage.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="page-heading page-heading-row">
          <div>
            <div className="flex-center-gap" style={{ gap: "8px", marginBottom: "4px" }}>
              <span className="eyebrow">SHOPIFY MERCHANT CORE</span>
              <span className="live-pill-sm">
                <Sparkles size={11} /> Real-Time Attribution
              </span>
            </div>
            <h1>Marketing & Campaigns</h1>
            <p>
              Drive store revenue, manage automated multi-channel campaigns, ad spend, and customer lifecycle flows.
            </p>
          </div>

          <div className="page-heading-actions">
            <button
              type="button"
              className="secondary-button refresh-btn"
              onClick={loadMarketingData}
              disabled={loading}
              title="Refresh marketing analytics"
            >
              <RotateCw size={15} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => openCreateCampaign("all")}
            >
              <Plus size={16} />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* Error Banner if any */}
        {error && (
          <div className="error-banner" style={{ marginBottom: "20px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs (Overview, Campaigns, Automations, UTM Link Generator) */}
        <div className="marketing-tab-nav">
          <button
            type="button"
            className={`marketing-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp size={16} />
            <span>Attribution & Overview</span>
          </button>

          <button
            type="button"
            className={`marketing-tab-btn ${activeTab === "campaigns" ? "active" : ""}`}
            onClick={() => setActiveTab("campaigns")}
          >
            <Megaphone size={16} />
            <span>Campaigns</span>
            <span className="tab-counter-badge">{campaigns.length}</span>
          </button>

          <button
            type="button"
            className={`marketing-tab-btn ${activeTab === "automations" ? "active" : ""}`}
            onClick={() => setActiveTab("automations")}
          >
            <Zap size={16} />
            <span>Automations (Flows)</span>
            <span className="tab-counter-badge">{automations.length}</span>
          </button>

          <button
            type="button"
            className={`marketing-tab-btn ${activeTab === "utm-builder" ? "active" : ""}`}
            onClick={() => setActiveTab("utm-builder")}
          >
            <LinkIcon size={16} />
            <span>UTM Link Builder</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: ATTRIBUTION & OVERVIEW
            ========================================================================= */}
        {activeTab === "overview" && (
          <div className="marketing-tab-content">
            {/* Shopify Attribution Highlight Card */}
            <div className="shopify-attribution-banner">
              <div className="attribution-banner-left">
                <span className="attribution-eyebrow">
                  <Target size={14} /> Marketing Attribution Ratio
                </span>
                <div className="attribution-stat-number">
                  {metrics.salesAttributionRate}%
                  <span className="attribution-stat-label">of all store sales driven by marketing</span>
                </div>
                <div className="attribution-progress-track">
                  <div
                    className="attribution-progress-bar"
                    style={{ width: `${Math.min(100, metrics.salesAttributionRate)}%` }}
                  />
                </div>
                <div className="attribution-meta-stats">
                  <span>
                    Marketing Revenue: <strong>₹{metrics.totalMarketingRevenue.toLocaleString("en-IN")}</strong>
                  </span>
                  <span>
                    Store Total Sales: <strong>₹{metrics.storeTotalSales.toLocaleString("en-IN")}</strong>
                  </span>
                </div>
              </div>

              <div className="attribution-banner-right">
                <div className="attribution-metric-chip">
                  <span className="chip-label">Return On Ad Spend (ROAS)</span>
                  <strong className="chip-value emerald">{metrics.overallRoas}x</strong>
                  <span className="chip-hint">₹{metrics.overallRoas} generated per ₹1 spent</span>
                </div>
                <div className="attribution-metric-chip">
                  <span className="chip-label">Avg Order Value (AOV)</span>
                  <strong className="chip-value">₹{metrics.avgOrderValue.toLocaleString("en-IN")}</strong>
                  <span className="chip-hint">{metrics.totalMarketingOrders} marketing conversions</span>
                </div>
              </div>
            </div>

            {/* 4 Primary KPI Cards */}
            <div className="stats-grid" style={{ marginBottom: "24px" }}>
              <div className="admin-card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Attributed Revenue</span>
                  <div className="stat-icon-wrap emerald">
                    <IndianRupee size={20} />
                  </div>
                </div>
                <div className="stat-card-value">
                  ₹{metrics.totalMarketingRevenue.toLocaleString("en-IN")}
                </div>
                <div className="stat-card-footer">
                  <span className="stat-badge positive">
                    +{metrics.salesAttributionRate}% store share
                  </span>
                  <span className="stat-card-hint">Campaigns & flows</span>
                </div>
              </div>

              <div className="admin-card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Marketing Orders</span>
                  <div className="stat-icon-wrap indigo">
                    <ShoppingBag size={20} />
                  </div>
                </div>
                <div className="stat-card-value">
                  {metrics.totalMarketingOrders}
                </div>
                <div className="stat-card-footer">
                  <span className="stat-badge positive">
                    {metrics.overallConversionRate}% Conv. Rate
                  </span>
                  <span className="stat-card-hint">From {metrics.totalClicks.toLocaleString()} clicks</span>
                </div>
              </div>

              <div className="admin-card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Ad Spend</span>
                  <div className="stat-icon-wrap amber">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="stat-card-value">
                  ₹{metrics.totalAdSpend.toLocaleString("en-IN")}
                </div>
                <div className="stat-card-footer">
                  <span className="stat-badge neutral">
                    Budget utilization
                  </span>
                  <span className="stat-card-hint">Across paid channels</span>
                </div>
              </div>

              <div className="admin-card stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-title">Click Engagements</span>
                  <div className="stat-icon-wrap sky">
                    <Users size={20} />
                  </div>
                </div>
                <div className="stat-card-value">
                  {metrics.totalClicks.toLocaleString("en-IN")}
                </div>
                <div className="stat-card-footer">
                  <span className="stat-badge positive">
                    High intent
                  </span>
                  <span className="stat-card-hint">Inbound store traffic</span>
                </div>
              </div>
            </div>

            {/* Performance Timeline Chart & Channel Share */}
            <div className="marketing-dashboard-grid">
              {/* Left: 30-Day Revenue Trend Chart */}
              <div className="admin-panel marketing-chart-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Attributed Marketing Revenue (Last 30 Days)</h3>
                    <p className="panel-subtitle">Daily sales generated by campaigns and automated flows</p>
                  </div>
                  <span className="chart-legend-pill">
                    <span className="chart-legend-dot primary" /> Marketing Sales
                  </span>
                </div>

                <div className="marketing-chart-body">
                  {summaryData?.timeline && summaryData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height={290}>
                      <AreaChart
                        data={summaryData.timeline}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="mktgRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          interval={4}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                          tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                        />
                        <Tooltip content={<MarketingChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#mktgRevenueGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">No timeline telemetry recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Right: Channel Breakdown */}
              <div className="admin-panel marketing-channels-panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Sales by Marketing Channel</h3>
                    <p className="panel-subtitle">Revenue attribution by traffic source</p>
                  </div>
                </div>

                <div className="channel-breakdown-list">
                  {summaryData?.channelBreakdown?.map((ch) => (
                    <div key={ch.channel} className="channel-breakdown-row">
                      <div className="channel-icon-pill">
                        {getChannelIcon(ch.channel)}
                      </div>
                      <div className="channel-info-col">
                        <div className="channel-name-row">
                          <strong className="channel-title">
                            {ch.channel.toUpperCase()}
                          </strong>
                          <span className="channel-revenue">
                            ₹{ch.revenue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="channel-bar-track">
                          <div
                            className={`channel-bar-fill ${ch.channel}`}
                            style={{ width: `${Math.max(4, ch.share)}%` }}
                          />
                        </div>
                        <div className="channel-meta-row">
                          <span>{ch.share}% share • {ch.orders} orders</span>
                          <span className="roas-text">
                            {ch.roas > 0 ? `${ch.roas}x ROAS` : "Organic Flow"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Audience Segments for Targeted Marketing */}
            <div className="admin-panel" style={{ marginTop: "24px" }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Audience Targeting Intelligence</h3>
                  <p className="panel-subtitle">
                    Live segment sizes calculated from real shoppers. Launch tailored campaigns with 1 click.
                  </p>
                </div>
              </div>

              <div className="audience-segments-grid">
                <div className="audience-card">
                  <div className="audience-card-top">
                    <div className="audience-badge all">
                      <Users size={16} />
                    </div>
                    <button
                      type="button"
                      className="launch-segment-btn"
                      onClick={() => openCreateCampaign("all")}
                    >
                      <span>Campaign</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <strong className="audience-number">
                    {summaryData?.audienceSegments?.all || 0}
                  </strong>
                  <span className="audience-name">All Active Customers</span>
                  <p className="audience-desc">
                    Reach your entire registered subscriber base with global announcements.
                  </p>
                </div>

                <div className="audience-card">
                  <div className="audience-card-top">
                    <div className="audience-badge vip">
                      <Sparkles size={16} />
                    </div>
                    <button
                      type="button"
                      className="launch-segment-btn"
                      onClick={() => openCreateCampaign("vip")}
                    >
                      <span>Campaign</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <strong className="audience-number">
                    {summaryData?.audienceSegments?.vip || 0}
                  </strong>
                  <span className="audience-name">High-Value VIP Shoppers</span>
                  <p className="audience-desc">
                    Customers who have spent &gt; ₹5,000. Send private perks and exclusive discount tiers.
                  </p>
                </div>

                <div className="audience-card">
                  <div className="audience-card-top">
                    <div className="audience-badge repeat">
                      <ShoppingBag size={16} />
                    </div>
                    <button
                      type="button"
                      className="launch-segment-btn"
                      onClick={() => openCreateCampaign("repeat_buyers")}
                    >
                      <span>Campaign</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <strong className="audience-number">
                    {summaryData?.audienceSegments?.repeat_buyers || 0}
                  </strong>
                  <span className="audience-name">Repeat Loyal Buyers</span>
                  <p className="audience-desc">
                    Shoppers with 2+ completed orders. Perfect target for restock and catalog drop campaigns.
                  </p>
                </div>

                <div className="audience-card">
                  <div className="audience-card-top">
                    <div className="audience-badge abandon">
                      <Clock size={16} />
                    </div>
                    <button
                      type="button"
                      className="launch-segment-btn"
                      onClick={() => openCreateCampaign("abandoned_checkout")}
                    >
                      <span>Campaign</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <strong className="audience-number">
                    {summaryData?.audienceSegments?.abandoned_checkout || 0}
                  </strong>
                  <span className="audience-name">Inactive / Cart Abandoners</span>
                  <p className="audience-desc">
                    Users needing an extra incentive to complete their checkout or return to the store.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CAMPAIGNS MANAGEMENT
            ========================================================================= */}
        {activeTab === "campaigns" && (
          <div className="marketing-tab-content">
            {/* Filter Bar */}
            <div className="admin-panel" style={{ marginBottom: "20px" }}>
              <div className="campaign-filter-row">
                {/* Search */}
                <div className="search-input-wrap" style={{ maxWidth: "340px", flex: 1 }}>
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, discount or UTM tag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Channel Filter */}
                <select
                  className="channel-select-dropdown"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                >
                  <option value="all">All Channels</option>
                  <option value="email">Email Marketing</option>
                  <option value="social">Social Ads (Meta / IG)</option>
                  <option value="search">Search Ads (Google)</option>
                  <option value="sms">SMS Outreach</option>
                </select>

                {/* Status Filter Buttons */}
                <div className="filter-pill-group">
                  {["all", "active", "scheduled", "paused", "completed"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Table Panel */}
            <section className="admin-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">All Marketing Campaigns</h3>
                  <p className="panel-subtitle">
                    Tracking live ad campaigns, email blasts, and conversion performance
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button-sm"
                  onClick={() => openCreateCampaign("all")}
                >
                  <Plus size={14} />
                  <span>New Campaign</span>
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="empty-state" style={{ padding: "60px 24px" }}>
                  <div
                    className="stat-icon-wrap indigo"
                    style={{ width: "48px", height: "48px", margin: "0 auto 12px" }}
                  >
                    <Megaphone size={24} />
                  </div>
                  <h3>No Marketing Campaigns Found</h3>
                  <p style={{ maxWidth: "420px", margin: "8px auto 16px" }}>
                    Launch your first campaign to boost store conversions, drive customer retention, and track ROAS.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => openCreateCampaign("all")}
                  >
                    <Plus size={15} />
                    <span>Create First Campaign</span>
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Campaign & Activity</th>
                        <th>Channel</th>
                        <th>Status</th>
                        <th>Target Audience</th>
                        <th>Budget / Spend</th>
                        <th>Revenue & Orders</th>
                        <th>ROAS</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => (
                        <tr key={c._id}>
                          {/* Name, coupon & UTM */}
                          <td>
                            <div className="campaign-name-cell">
                              <strong className="campaign-title-text">{c.name}</strong>
                              <div className="campaign-tags-row">
                                {c.discountCode && (
                                  <span className="coupon-code-pill">
                                    <Percent size={11} /> {c.discountCode}
                                  </span>
                                )}
                                {c.utmCampaign && (
                                  <span className="utm-tag-preview" title={`utm_campaign=${c.utmCampaign}`}>
                                    utm:{c.utmCampaign}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Channel */}
                          <td>
                            <span className={`channel-badge ${c.channel}`}>
                              {getChannelIcon(c.channel)}
                              {c.channel.toUpperCase()}
                            </span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`status-pill ${c.status}`}>
                              {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                            </span>
                          </td>

                          {/* Audience */}
                          <td>
                            <span className="audience-pill">
                              <Users size={12} />
                              {c.targetAudience.replace("_", " ")}
                            </span>
                          </td>

                          {/* Budget & Spend */}
                          <td>
                            <div className="budget-spend-cell">
                              <span className="spend-val">
                                ₹{(c.spend || 0).toLocaleString("en-IN")}
                              </span>
                              <span className="budget-val">
                                / ₹{(c.budget || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </td>

                          {/* Revenue & Orders */}
                          <td>
                            <div className="revenue-orders-cell">
                              <strong className="revenue-val emerald">
                                ₹{(c.revenue || 0).toLocaleString("en-IN")}
                              </strong>
                              <span className="orders-count-text">
                                {c.ordersCount || 0} orders • {c.clicks || 0} clicks
                              </span>
                            </div>
                          </td>

                          {/* ROAS */}
                          <td>
                            <span
                              className={`roas-badge ${
                                (c.roas || 0) >= 3 ? "high" : (c.roas || 0) > 1 ? "medium" : "low"
                              }`}
                            >
                              {c.roas ? `${c.roas}x` : "—"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons-wrap">
                              {/* Trigger Dispatch Blast */}
                              <button
                                type="button"
                                className="icon-action-btn trigger-btn"
                                onClick={() => handleTriggerCampaign(c)}
                                disabled={actionLoadingId === c._id}
                                title="Dispatch blast to audience"
                              >
                                <Send size={15} />
                              </button>

                              {/* Toggle Status (Play / Pause) */}
                              <button
                                type="button"
                                className={`icon-action-btn ${c.status === "active" ? "pause" : "play"}`}
                                onClick={() => handleToggleCampaign(c)}
                                disabled={actionLoadingId === c._id}
                                title={c.status === "active" ? "Pause Campaign" : "Resume Campaign"}
                              >
                                {c.status === "active" ? <Pause size={15} /> : <Play size={15} />}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                className="icon-action-btn edit"
                                onClick={() => openEditCampaign(c)}
                                title="Edit Campaign"
                              >
                                <Pencil size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                className="icon-action-btn delete"
                                onClick={() => handleDeleteCampaign(c._id, c.name)}
                                disabled={actionLoadingId === c._id}
                                title="Delete Campaign"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* =========================================================================
            TAB 3: AUTOMATIONS (SHOPIFY FLOWS)
            ========================================================================= */}
        {activeTab === "automations" && (
          <div className="marketing-tab-content">
            <div className="admin-panel" style={{ marginBottom: "20px" }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Automated Lifecycle Marketing Flows</h3>
                  <p className="panel-subtitle">
                    Automations trigger in response to shopper events (cart abandonment, account signup, delivery).
                  </p>
                </div>
              </div>

              <div className="automations-flow-grid">
                {automations.map((auto) => (
                  <div
                    key={auto._id}
                    className={`automation-card ${auto.status === "active" ? "active-flow" : "paused-flow"}`}
                  >
                    <div className="auto-card-top">
                      <div className="auto-icon-badge">
                        <Zap size={18} />
                      </div>
                      <div className="auto-status-toggle">
                        <label className="switch-toggle">
                          <input
                            type="checkbox"
                            checked={auto.status === "active"}
                            onChange={() => handleToggleAutomation(auto)}
                            disabled={actionLoadingId === auto._id}
                          />
                          <span className="slider round" />
                        </label>
                      </div>
                    </div>

                    <strong className="auto-flow-title">{auto.name}</strong>
                    <p className="auto-flow-desc">{auto.description}</p>

                    <div className="auto-flow-rules">
                      <div className="rule-row">
                        <span className="rule-label">Trigger:</span>
                        <span className="rule-val">{auto.trigger}</span>
                      </div>
                      <div className="rule-row">
                        <span className="rule-label">Delay:</span>
                        <span className="rule-val">{auto.delay || "Immediate"}</span>
                      </div>
                      <div className="rule-row">
                        <span className="rule-label">Coupon:</span>
                        <span className="rule-val highlight">
                          {auto.discountCode ? auto.discountCode : "None (Informational)"}
                        </span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="auto-stats-strip">
                      <div className="auto-stat-item">
                        <span className="label">Triggered</span>
                        <strong className="val">{auto.runsTriggered || 0}x</strong>
                      </div>
                      <div className="auto-stat-item">
                        <span className="label">Open Rate</span>
                        <strong className="val">{auto.openRate || 0}%</strong>
                      </div>
                      <div className="auto-stat-item">
                        <span className="label">Click Rate</span>
                        <strong className="val">{auto.clickRate || 0}%</strong>
                      </div>
                      <div className="auto-stat-item">
                        <span className="label">Recovered</span>
                        <strong className="val emerald">
                          ₹{(auto.revenueRecovered || 0).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>

                    <div className="auto-card-footer">
                      <button
                        type="button"
                        className="auto-configure-btn"
                        onClick={() => openEditAutomationModal(auto)}
                      >
                        <Pencil size={13} />
                        <span>Configure Flow</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: UTM & TRACKABLE LINK GENERATOR
            ========================================================================= */}
        {activeTab === "utm-builder" && (
          <div className="marketing-tab-content">
            <div className="admin-panel utm-builder-card">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Campaign Tracking Link Generator (UTM Builder)</h3>
                  <p className="panel-subtitle">
                    Create trackable marketing links for ad networks, newsletters, influencers, and SMS.
                  </p>
                </div>
              </div>

              <div className="utm-builder-body">
                <div className="form-group">
                  <label className="field-label">Target Page URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://yourstore.com/products/example"
                    value={utmUrl}
                    onChange={(e) => setUtmUrl(e.target.value)}
                  />
                  <span className="field-hint">The landing page shoppers will reach upon clicking.</span>
                </div>

                <div className="form-grid-three" style={{ marginTop: "16px" }}>
                  <div className="form-group">
                    <label className="field-label">Campaign Name (utm_campaign)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="summer_sale_2026"
                      value={utmCampaignInput}
                      onChange={(e) => setUtmCampaignInput(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Campaign Source (utm_source)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="instagram, google, newsletter"
                      value={utmSourceInput}
                      onChange={(e) => setUtmSourceInput(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Campaign Medium (utm_medium)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="paid_social, cpc, email, sms"
                      value={utmMediumInput}
                      onChange={(e) => setUtmMediumInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Generated Link Preview Box */}
                <div className="utm-result-box" style={{ marginTop: "24px" }}>
                  <div className="utm-result-header">
                    <span className="utm-result-title">Generated Trackable Link</span>
                    <button
                      type="button"
                      className="copy-utm-btn"
                      onClick={handleCopyUtmLink}
                    >
                      {copiedLink ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                      <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
                    </button>
                  </div>
                  <div className="utm-result-url">{computedUtmLink}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CREATE & EDIT MARKETING CAMPAIGN
            ========================================================================= */}
        {campaignModalOpen && (
          <div className="modal-backdrop">
            <div className="admin-modal-card campaign-modal-card">
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <div className="modal-icon-badge">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h3 className="modal-title">
                      {editingCampaignId ? "Edit Campaign" : "Create Marketing Campaign"}
                    </h3>
                    <p className="modal-subtitle">
                      Set marketing channels, audience rules, budget and creative copy
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setCampaignModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {campaignFormError && (
                <div className="modal-error-banner">
                  <AlertCircle size={16} />
                  <span>{campaignFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveCampaign} className="campaign-form-body">
                {/* Campaign Name */}
                <div className="form-group">
                  <label className="field-label">Campaign Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Diwali Mega Festival Sale"
                    value={campaignForm.name}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Channel & Target Audience */}
                <div className="form-grid-two">
                  <div className="form-group">
                    <label className="field-label">Marketing Channel</label>
                    <select
                      className="form-select"
                      value={campaignForm.channel}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, channel: e.target.value }))
                      }
                    >
                      <option value="email">Email Campaign</option>
                      <option value="social">Social Media Ads (Meta / Instagram)</option>
                      <option value="search">Search & Shopping Ads (Google)</option>
                      <option value="sms">SMS Outreach</option>
                      <option value="influencer">Influencer Collaboration</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="field-label">Target Audience Segment</label>
                    <select
                      className="form-select"
                      value={campaignForm.targetAudience}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, targetAudience: e.target.value }))
                      }
                    >
                      <option value="all">All Store Shoppers</option>
                      <option value="vip">VIP High-Spenders (&gt; ₹5,000)</option>
                      <option value="repeat_buyers">Repeat Loyal Buyers (2+ Orders)</option>
                      <option value="new_customers">First-Time Registered Customers</option>
                      <option value="abandoned_checkout">Cart Abandoners / Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Coupon Attachment & Budget */}
                <div className="form-grid-two">
                  <div className="form-group">
                    <label className="field-label">Attached Coupon Code (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. FESTIVE20"
                      value={campaignForm.discountCode}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          discountCode: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                    {availableCoupons.length > 0 && (
                      <div className="quick-coupon-pills">
                        <span className="quick-coupon-label">Active:</span>
                        {availableCoupons.slice(0, 4).map((d) => (
                          <button
                            key={d._id}
                            type="button"
                            className="coupon-tag-btn"
                            onClick={() =>
                              setCampaignForm((prev) => ({ ...prev, discountCode: d.code }))
                            }
                          >
                            {d.code}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="field-label">Budget Allocation (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="10000"
                      value={campaignForm.budget}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, budget: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="form-grid-three">
                  <div className="form-group">
                    <label className="field-label">Status</label>
                    <select
                      className="form-select"
                      value={campaignForm.status}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="field-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={campaignForm.startDate}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={campaignForm.endDate}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Creative Copy: Subject & Content */}
                <div className="form-group">
                  <label className="field-label">Email Subject / Ad Headline</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Exclusive 20% Off Festive Collection"
                    value={campaignForm.subject}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Message Content / Ad Copy</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe the promotion or customer incentive..."
                    value={campaignForm.content}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                  />
                </div>

                {/* Call To Action Buttons */}
                <div className="form-grid-two">
                  <div className="form-group">
                    <label className="field-label">CTA Label</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Shop Now"
                      value={campaignForm.ctaText}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, ctaText: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">CTA Destination URL</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="/collections/all"
                      value={campaignForm.ctaUrl}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({ ...prev, ctaUrl: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setCampaignModalOpen(false)}
                    disabled={savingCampaign}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingCampaign}
                  >
                    {savingCampaign ? (
                      <>
                        <RotateCw size={15} className="spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>{editingCampaignId ? "Save Changes" : "Launch Campaign"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CONFIGURE AUTOMATION FLOW
            ========================================================================= */}
        {autoModalOpen && editingAuto && (
          <div className="modal-backdrop">
            <div className="admin-modal-card" style={{ maxWidth: "500px" }}>
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <div className="modal-icon-badge">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="modal-title">Configure Automation</h3>
                    <p className="modal-subtitle">{editingAuto.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setAutoModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAutomation} className="campaign-form-body">
                <div className="form-group">
                  <label className="field-label">Trigger Rule</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingAuto.trigger}
                    disabled
                  />
                  <span className="field-hint">Trigger rule managed by store event dispatcher.</span>
                </div>

                <div className="form-group">
                  <label className="field-label">Dispatch Delay Interval</label>
                  <select
                    className="form-select"
                    value={autoDelay}
                    onChange={(e) => setAutoDelay(e.target.value)}
                  >
                    <option value="Immediate">Immediate upon event</option>
                    <option value="30 minutes">30 minutes after trigger</option>
                    <option value="1 hour">1 hour after trigger</option>
                    <option value="6 hours">6 hours after trigger</option>
                    <option value="24 hours">24 hours after trigger</option>
                    <option value="2 days">2 days after delivery</option>
                    <option value="60 days inactive">60 days inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Linked Incentive Discount Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RECOVER10"
                    value={autoDiscount}
                    onChange={(e) => setAutoDiscount(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setAutoModalOpen(false)}
                    disabled={savingAuto}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingAuto}
                  >
                    {savingAuto ? (
                      <>
                        <RotateCw size={15} className="spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>Update Flow</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
