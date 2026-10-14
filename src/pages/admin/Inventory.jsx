import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  X,
  Package,
  ArrowUpDown,
  AlertTriangle,
  PackageX,
  Truck,
  ClipboardList,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Hash,
  DollarSign,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Warehouse,
  ShoppingBag,
  Loader2,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import {
  getInventory,
  adjustInventory,
  syncInventory,
  getTransfers,
  getPurchaseOrders,
} from "../../services/inventoryService";

/* ─── helpers ───────────────────────────────────── */
function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function relativeTime(d) {
  if (!d) return "—";
  const now = Date.now();
  const diff = now - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function statusColor(status) {
  const map = {
    draft: "inv-badge-draft",
    ordered: "inv-badge-ordered",
    ready_to_ship: "inv-badge-ordered",
    in_transit: "inv-badge-transit",
    partial: "inv-badge-partial",
    completed: "inv-badge-completed",
    received: "inv-badge-completed",
    cancelled: "inv-badge-cancelled",
  };
  return map[status] || "inv-badge-draft";
}

const ACTIVITY_LABELS = {
  correction: "Correction",
  count: "Stock Count",
  received: "Received",
  transfer: "Transfer",
  purchase_order: "Purchase Order",
  order_fulfillment: "Order Fulfilled",
  order_cancellation: "Order Cancelled",
  return: "Return",
  damaged: "Damaged",
};

/* ─── Tabs ──────────────────────────────────────── */
const TABS = [
  { id: "inventory", label: "Inventory", Icon: Package },
  { id: "transfers", label: "Transfers", Icon: Truck },
  { id: "purchase_orders", label: "Purchase Orders", Icon: ClipboardList },
];

/* ─── Main Component ───────────────────────────── */
export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inventory state
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Adjustment modal
  const [adjustModal, setAdjustModal] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjActivity, setAdjActivity] = useState("correction");
  const [adjReference, setAdjReference] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Transfers state
  const [transfers, setTransfers] = useState([]);
  const [transfersTotal, setTransfersTotal] = useState(0);

  // Purchase Orders state
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poTotal, setPoTotal] = useState(0);

  /* ─── loaders ──────────────────────────────── */
  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { search };
      if (stockFilter === "low") params.lowStock = "true";
      if (stockFilter === "out") params.outOfStock = "true";

      const data = await getInventory(params);
      setItems(data.items || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [search, stockFilter]);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTransfers();
      setTransfers(data.transfers || []);
      setTransfersTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPurchaseOrders();
      setPurchaseOrders(data.purchaseOrders || []);
      setPoTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "inventory") loadInventory();
    else if (activeTab === "transfers") loadTransfers();
    else if (activeTab === "purchase_orders") loadPurchaseOrders();
  }, [activeTab, loadInventory, loadTransfers, loadPurchaseOrders]);

  /* ─── sync ─────────────────────────────────── */
  async function handleSync() {
    setSyncing(true);
    setError("");
    try {
      const result = await syncInventory();
      setSuccessMsg(result.message || "Inventory synced");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  }

  /* ─── adjustment ───────────────────────────── */
  function openAdjustModal(item) {
    setAdjustModal(item);
    setAdjQty("");
    setAdjActivity("correction");
    setAdjReference("");
  }

  async function handleAdjust(e) {
    e.preventDefault();
    if (!adjQty || Number(adjQty) === 0) return;
    setAdjusting(true);
    try {
      await adjustInventory({
        inventoryId: adjustModal._id,
        quantity: Number(adjQty),
        activity: adjActivity,
        reference: adjReference,
      });
      setAdjustModal(null);
      setSuccessMsg("Stock adjusted successfully");
      setTimeout(() => setSuccessMsg(""), 3000);
      await loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setAdjusting(false);
    }
  }

  /* ─── derived ──────────────────────────────── */
  const filteredItems = useMemo(() => {
    return items;
  }, [items]);

  /* ─── render ───────────────────────────────── */
  return (
    <AdminLayout>
      <div className="inv-page">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">STOCK MANAGEMENT</span>
            <h1>Inventory</h1>
            <p>Track stock levels, transfers, and purchase orders in one place.</p>
          </div>
          <div className="inv-header-actions">
            <button
              className="inv-btn inv-btn-outline"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw size={15} className={syncing ? "spin" : ""} />
              {syncing ? "Syncing…" : "Sync Products"}
            </button>
          </div>
        </div>

        {/* Toasts */}
        {error && (
          <div className="inv-toast inv-toast-error">
            <XCircle size={16} /> {error}
            <button onClick={() => setError("")}><X size={14} /></button>
          </div>
        )}
        {successMsg && (
          <div className="inv-toast inv-toast-success">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Summary Cards */}
        {activeTab === "inventory" && summary.totalItems !== undefined && (
          <div className="inv-summary-grid">
            <div className="inv-summary-card">
              <div className="inv-summary-icon inv-icon-primary">
                <Package size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.totalItems}</span>
                <span className="inv-summary-label">Total SKUs</span>
              </div>
            </div>
            <div className="inv-summary-card">
              <div className="inv-summary-icon inv-icon-emerald">
                <Warehouse size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.totalAvailable}</span>
                <span className="inv-summary-label">Available</span>
              </div>
            </div>
            <div className="inv-summary-card">
              <div className="inv-summary-icon inv-icon-amber">
                <ShoppingBag size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.totalCommitted}</span>
                <span className="inv-summary-label">Committed</span>
              </div>
            </div>
            <div className="inv-summary-card">
              <div className="inv-summary-icon inv-icon-sky">
                <Truck size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.totalIncoming}</span>
                <span className="inv-summary-label">Incoming</span>
              </div>
            </div>
            <div className="inv-summary-card inv-summary-card-wide">
              <div className="inv-summary-icon inv-icon-rose">
                <AlertTriangle size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.lowStockCount}</span>
                <span className="inv-summary-label">Low Stock</span>
              </div>
              <div className="inv-summary-sep" />
              <div className="inv-summary-icon inv-icon-rose">
                <PackageX size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{summary.outOfStockCount}</span>
                <span className="inv-summary-label">Out of Stock</span>
              </div>
            </div>
            <div className="inv-summary-card">
              <div className="inv-summary-icon inv-icon-primary">
                <DollarSign size={20} />
              </div>
              <div className="inv-summary-data">
                <span className="inv-summary-value">{formatCurrency(summary.totalValue)}</span>
                <span className="inv-summary-label">Inventory Value</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="inv-tabs">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`inv-tab ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {id === "transfers" && transfersTotal > 0 && (
                <span className="inv-tab-badge">{transfersTotal}</span>
              )}
              {id === "purchase_orders" && poTotal > 0 && (
                <span className="inv-tab-badge">{poTotal}</span>
              )}
            </button>
          ))}
        </div>

        {/* Inventory Tab Content */}
        {activeTab === "inventory" && (
          <>
            {/* Search & Filters */}
            <div className="inv-toolbar">
              <div className="inv-search-wrap">
                <Search size={17} className="inv-search-icon" />
                <input
                  className="inv-search-input"
                  placeholder="Search by product, SKU, or barcode…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="inv-search-clear" onClick={() => setSearch("")}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="inv-filter-pills">
                <Filter size={14} />
                {[
                  { value: "all", label: "All Stock" },
                  { value: "low", label: "Low Stock" },
                  { value: "out", label: "Out of Stock" },
                ].map((f) => (
                  <button
                    key={f.value}
                    className={`inv-pill ${stockFilter === f.value ? "active" : ""}`}
                    onClick={() => setStockFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <div className="inv-loading-state">
                <Loader2 size={28} className="spin" />
                <p>Loading inventory items…</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="inv-empty-state">
                <Package size={48} strokeWidth={1} />
                <h3>No inventory items found</h3>
                <p>Try syncing your products or adjusting your filters.</p>
                <button className="inv-btn inv-btn-primary" onClick={handleSync}>
                  <RefreshCw size={15} /> Sync Products
                </button>
              </div>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th className="inv-th-product">Product</th>
                      <th>SKU</th>
                      <th>Location</th>
                      <th className="inv-th-num">Available</th>
                      <th className="inv-th-num">On Hand</th>
                      <th className="inv-th-num">Committed</th>
                      <th className="inv-th-num">Incoming</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const isExpanded = expandedId === item._id;
                      const isLow = item.tracked && item.available > 0 && item.available <= 10;
                      const isOut = item.tracked && item.available <= 0;

                      return (
                        <>
                          <tr
                            key={item._id}
                            className={`inv-row ${isLow ? "inv-row-low" : ""} ${isOut ? "inv-row-out" : ""}`}
                          >
                            <td className="inv-td-product">
                              <div className="inv-product-cell">
                                {item.product?.image ? (
                                  <img
                                    src={item.product.image}
                                    alt=""
                                    className="inv-product-thumb"
                                  />
                                ) : (
                                  <div className="inv-product-thumb-placeholder">
                                    <Package size={16} />
                                  </div>
                                )}
                                <div className="inv-product-info">
                                  <span className="inv-product-title">
                                    {item.productTitle || item.product?.title || "Untitled"}
                                  </span>
                                  {item.variantTitle && (
                                    <span className="inv-variant-label">{item.variantTitle}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="inv-sku">{item.sku || "—"}</span>
                            </td>
                            <td>
                              <span className="inv-location">
                                <MapPin size={12} />
                                {item.locationName}
                              </span>
                            </td>
                            <td className="inv-th-num">
                              <span className={`inv-qty ${isOut ? "inv-qty-out" : isLow ? "inv-qty-low" : "inv-qty-ok"}`}>
                                {item.available}
                              </span>
                            </td>
                            <td className="inv-th-num">{item.onHand}</td>
                            <td className="inv-th-num">{item.committed}</td>
                            <td className="inv-th-num">{item.incoming}</td>
                            <td>
                              {!item.tracked ? (
                                <span className="inv-badge inv-badge-untracked">Untracked</span>
                              ) : isOut ? (
                                <span className="inv-badge inv-badge-out">Out of Stock</span>
                              ) : isLow ? (
                                <span className="inv-badge inv-badge-low">Low Stock</span>
                              ) : (
                                <span className="inv-badge inv-badge-in">In Stock</span>
                              )}
                            </td>
                            <td>
                              <div className="inv-actions">
                                <button
                                  className="inv-action-btn"
                                  onClick={() => openAdjustModal(item)}
                                  title="Adjust stock"
                                >
                                  <ArrowUpDown size={14} />
                                </button>
                                <button
                                  className="inv-action-btn"
                                  onClick={() =>
                                    setExpandedId(isExpanded ? null : item._id)
                                  }
                                  title="View history"
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={14} />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded History Row */}
                          {isExpanded && (
                            <tr key={`${item._id}-hist`} className="inv-history-row">
                              <td colSpan={9}>
                                <div className="inv-history-panel">
                                  <h4>
                                    <Clock size={14} /> Adjustment History
                                  </h4>
                                  {item.history && item.history.length > 0 ? (
                                    <div className="inv-history-list">
                                      {item.history
                                        .slice()
                                        .reverse()
                                        .slice(0, 10)
                                        .map((h, i) => (
                                          <div key={i} className="inv-history-item">
                                            <div className="inv-hist-icon">
                                              {h.quantityChanged >= 0 ? (
                                                <TrendingUp size={13} />
                                              ) : (
                                                <TrendingDown size={13} />
                                              )}
                                            </div>
                                            <div className="inv-hist-details">
                                              <span className="inv-hist-activity">
                                                {ACTIVITY_LABELS[h.activity] || h.activity}
                                              </span>
                                              <span className="inv-hist-meta">
                                                {h.staffMember} · {relativeTime(h.date)}
                                                {h.reference && ` · ${h.reference}`}
                                              </span>
                                            </div>
                                            <div className="inv-hist-qty">
                                              <span
                                                className={
                                                  h.quantityChanged >= 0
                                                    ? "inv-hist-plus"
                                                    : "inv-hist-minus"
                                                }
                                              >
                                                {h.quantityChanged >= 0 ? "+" : ""}
                                                {h.quantityChanged}
                                              </span>
                                              <span className="inv-hist-after">
                                                → {h.newAvailable}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="inv-history-empty">No adjustment history yet.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Transfers Tab Content */}
        {activeTab === "transfers" && (
          <div className="inv-sub-section">
            {loading ? (
              <div className="inv-loading-state">
                <Loader2 size={28} className="spin" />
                <p>Loading transfers…</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="inv-empty-state">
                <Truck size={48} strokeWidth={1} />
                <h3>No transfers found</h3>
                <p>Stock transfers between locations will appear here.</p>
              </div>
            ) : (
              <div className="inv-cards-grid">
                {transfers.map((t) => (
                  <div key={t._id} className="inv-transfer-card">
                    <div className="inv-transfer-header">
                      <span className="inv-transfer-number">
                        <Hash size={13} /> {t.transferNumber}
                      </span>
                      <span className={`inv-badge ${statusColor(t.status)}`}>
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="inv-transfer-route">
                      <div className="inv-route-point">
                        <MapPin size={13} />
                        <span>{t.origin?.name || "Origin"}</span>
                      </div>
                      <ArrowRight size={15} className="inv-route-arrow" />
                      <div className="inv-route-point">
                        <MapPin size={13} />
                        <span>{t.destination?.name || "Destination"}</span>
                      </div>
                    </div>
                    <div className="inv-transfer-meta">
                      <span>
                        <Package size={13} />{" "}
                        {t.lineItems?.length || 0} item{t.lineItems?.length !== 1 ? "s" : ""}
                      </span>
                      {t.expectedArrivalDate && (
                        <span>
                          <Clock size={13} />{" "}
                          ETA: {new Date(t.expectedArrivalDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                      <span className="inv-transfer-time">
                        {relativeTime(t.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Purchase Orders Tab Content */}
        {activeTab === "purchase_orders" && (
          <div className="inv-sub-section">
            {loading ? (
              <div className="inv-loading-state">
                <Loader2 size={28} className="spin" />
                <p>Loading purchase orders…</p>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="inv-empty-state">
                <ClipboardList size={48} strokeWidth={1} />
                <h3>No purchase orders found</h3>
                <p>Purchase orders from suppliers will appear here.</p>
              </div>
            ) : (
              <div className="inv-cards-grid">
                {purchaseOrders.map((po) => (
                  <div key={po._id} className="inv-po-card">
                    <div className="inv-po-header">
                      <span className="inv-po-number">
                        <Hash size={13} /> {po.poNumber}
                      </span>
                      <span className={`inv-badge ${statusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </div>
                    <div className="inv-po-supplier">
                      <strong>{po.supplier?.name || "Unknown Supplier"}</strong>
                      {po.supplier?.email && (
                        <span className="inv-po-email">{po.supplier.email}</span>
                      )}
                    </div>
                    <div className="inv-po-stats">
                      <div className="inv-po-stat">
                        <span className="inv-po-stat-val">{po.totalQuantity || 0}</span>
                        <span className="inv-po-stat-label">Items</span>
                      </div>
                      <div className="inv-po-stat">
                        <span className="inv-po-stat-val">{formatCurrency(po.totalAmount)}</span>
                        <span className="inv-po-stat-label">Total Cost</span>
                      </div>
                      <div className="inv-po-stat">
                        <span className="inv-po-stat-val">
                          {po.destinationLocation || "Shop location"}
                        </span>
                        <span className="inv-po-stat-label">Destination</span>
                      </div>
                    </div>
                    <div className="inv-po-footer">
                      <span>{relativeTime(po.createdAt)}</span>
                      {po.expectedArrivalDate && (
                        <span>
                          ETA:{" "}
                          {new Date(po.expectedArrivalDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Adjustment Modal ──────────────── */}
        {adjustModal && (
          <div className="inv-modal-backdrop" onClick={() => setAdjustModal(null)}>
            <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
              <div className="inv-modal-header">
                <h3>
                  <ArrowUpDown size={18} /> Adjust Stock
                </h3>
                <button onClick={() => setAdjustModal(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="inv-modal-product">
                <strong>{adjustModal.productTitle}</strong>
                {adjustModal.variantTitle && (
                  <span className="inv-variant-label">{adjustModal.variantTitle}</span>
                )}
                <span className="inv-modal-current">
                  Current stock: <strong>{adjustModal.available}</strong>
                </span>
              </div>
              <form onSubmit={handleAdjust} className="inv-modal-form">
                <div className="inv-form-row">
                  <label>Quantity Change</label>
                  <div className="inv-qty-input-group">
                    <button
                      type="button"
                      className="inv-qty-btn"
                      onClick={() =>
                        setAdjQty((prev) => String(Number(prev || 0) - 1))
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={adjQty}
                      onChange={(e) => setAdjQty(e.target.value)}
                      placeholder="0"
                      className="inv-qty-input"
                    />
                    <button
                      type="button"
                      className="inv-qty-btn"
                      onClick={() =>
                        setAdjQty((prev) => String(Number(prev || 0) + 1))
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {adjQty && Number(adjQty) !== 0 && (
                    <span className="inv-qty-preview">
                      New available:{" "}
                      <strong>
                        {Math.max(0, adjustModal.available + Number(adjQty))}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="inv-form-row">
                  <label>Reason</label>
                  <select
                    value={adjActivity}
                    onChange={(e) => setAdjActivity(e.target.value)}
                    className="inv-select"
                  >
                    {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inv-form-row">
                  <label>Reference (optional)</label>
                  <input
                    type="text"
                    value={adjReference}
                    onChange={(e) => setAdjReference(e.target.value)}
                    placeholder="e.g. Order #1234"
                    className="inv-text-input"
                  />
                </div>

                <div className="inv-modal-actions">
                  <button
                    type="button"
                    className="inv-btn inv-btn-outline"
                    onClick={() => setAdjustModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inv-btn inv-btn-primary"
                    disabled={adjusting || !adjQty || Number(adjQty) === 0}
                  >
                    {adjusting ? (
                      <>
                        <Loader2 size={15} className="spin" /> Adjusting…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} /> Apply Adjustment
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
