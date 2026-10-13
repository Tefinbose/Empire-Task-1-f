import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag,
  Plus,
  Search,
  RotateCw,
  X,
  Copy,
  Check,
  Percent,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2,
  Power,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
} from "../../services/discountService";

const initialForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minPurchaseAmount: "0",
  maxDiscountAmount: "",
  usageLimit: "",
  endDate: "",
};

export default function Discounts() {
  const navigate = useNavigate();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal State (Create & Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  const loadDiscountsList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDiscounts({
        search: searchQuery,
        status: statusFilter,
      });
      setDiscounts(data.discounts || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load discounts."
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadDiscountsList();
  }, [navigate, loadDiscountsList]);

  // Copy code helper
  function handleCopy(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Open modal for creation
  function openCreateModal() {
    setEditingId(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  // Open modal for editing
  function openEditModal(d) {
    setEditingId(d._id);
    setForm({
      code: d.code || "",
      description: d.description || "",
      discountType: d.discountType || "percentage",
      discountValue: String(d.discountValue ?? ""),
      minPurchaseAmount: String(d.minPurchaseAmount ?? "0"),
      maxDiscountAmount: d.maxDiscountAmount ? String(d.maxDiscountAmount) : "",
      usageLimit: d.usageLimit ? String(d.usageLimit) : "",
      endDate: d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "",
    });
    setFormError("");
    setModalOpen(true);
  }

  // Generate random code helper
  function generateRandomCode() {
    const prefixes = ["PROMO", "SAVE", "DEAL", "FESTIVE", "VIP", "OFFER"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(1000 + Math.random() * 9000);
    setForm((prev) => ({ ...prev, code: `${prefix}${number}` }));
  }

  // Handle Form Submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!form.code.trim()) {
      setFormError("Coupon code is required.");
      return;
    }

    if (Number(form.discountValue) <= 0) {
      setFormError("Discount value must be greater than zero.");
      return;
    }

    if (form.discountType === "percentage" && Number(form.discountValue) > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchaseAmount: Number(form.minPurchaseAmount) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        endDate: form.endDate ? form.endDate : null,
      };

      if (editingId) {
        await updateDiscount(editingId, payload);
      } else {
        await createDiscount(payload);
      }

      setModalOpen(false);
      await loadDiscountsList();
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.message || "Failed to save discount."
      );
    } finally {
      setSaving(false);
    }
  }

  // Handle Toggle Status
  async function handleToggleStatus(d) {
    const nextStatus = d.status === "active" ? "disabled" : "active";
    setActionLoadingId(d._id);
    try {
      await toggleDiscountStatus(d._id, nextStatus);
      await loadDiscountsList();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update status."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  // Handle Delete
  async function handleDelete(id, code) {
    if (!window.confirm(`Are you sure you want to permanently delete discount '${code}'?`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      await deleteDiscount(id);
      await loadDiscountsList();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete discount."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = discounts.length;
    const active = discounts.filter((d) => d.effectiveStatus === "active").length;
    const totalRedeemed = discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0);
    const expiredOrDisabled = discounts.filter(
      (d) => d.effectiveStatus === "expired" || d.status === "disabled"
    ).length;
    return { total, active, totalRedeemed, expiredOrDisabled };
  }, [discounts]);

  return (
    <AdminLayout>
      <div className="discounts-page-container">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">PROMOTIONS & CONVERSIONS</span>
            <h1>Discounts & Coupons</h1>
            <p>Manage promotional coupon codes, percentage incentives, and cart rules.</p>
          </div>

          <div className="page-heading-actions">
            <button
              type="button"
              className="secondary-button refresh-btn"
              onClick={loadDiscountsList}
              disabled={loading}
              title="Refresh discounts list"
            >
              <RotateCw size={15} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              <span>Create Discount</span>
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* KPI Strip */}
        <div className="orders-metric-strip">
          <div className="order-metric-card">
            <div className="metric-icon-wrap indigo">
              <Tag size={18} />
            </div>
            <div>
              <span className="metric-card-label">Total Promotions</span>
              <h4 className="metric-card-value">{metrics.total}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap green">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="metric-card-label">Active & Redeemable</span>
              <h4 className="metric-card-value">{metrics.active}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap emerald">
              <ShoppingBag size={18} />
            </div>
            <div>
              <span className="metric-card-label">Total Redemptions</span>
              <h4 className="metric-card-value">{metrics.totalRedeemed}</h4>
            </div>
          </div>

          <div className="order-metric-card">
            <div className="metric-icon-wrap orange">
              <AlertCircle size={18} />
            </div>
            <div>
              <span className="metric-card-label">Disabled / Expired</span>
              <h4 className="metric-card-value">{metrics.expiredOrDisabled}</h4>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="orders-filter-container">
          <div className="shopify-order-tabs">
            {[
              { id: "all", label: "All Discounts" },
              { id: "active", label: "Active" },
              { id: "disabled", label: "Disabled" },
              { id: "expired", label: "Expired" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`order-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="order-search-box">
            <Search size={15} className="search-icon" />
            <input
              placeholder="Search code or description..."
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

        {/* Discounts Table */}
        <section className="admin-panel">
          {loading ? (
            <div className="loading-state-card" style={{ padding: "60px 20px" }}>
              <div className="loading-spinner"></div>
              <p>Fetching active discounts and coupons...</p>
            </div>
          ) : discounts.length === 0 ? (
            <div className="empty-state" style={{ padding: "60px 20px" }}>
              <Tag size={42} strokeWidth={1.5} className="empty-icon" />
              <h4>No discounts found</h4>
              <p>Create a promo code to incentivize shoppers and boost checkout conversion.</p>
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: "16px" }}
                onClick={openCreateModal}
              >
                <Plus size={15} /> Create First Discount
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Coupon Code</th>
                    <th>Benefit</th>
                    <th>Conditions</th>
                    <th>Redemptions</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((d) => {
                    const benefitText =
                      d.discountType === "percentage"
                        ? `${d.discountValue}% Off`
                        : `₹${Number(d.discountValue).toLocaleString("en-IN")} Flat Off`;

                    const conditionText =
                      d.minPurchaseAmount > 0
                        ? `Min spend ₹${d.minPurchaseAmount}`
                        : "No minimum spend";

                    const usageText =
                      d.usageLimit !== null && d.usageLimit !== undefined
                        ? `${d.usageCount} / ${d.usageLimit} used`
                        : `${d.usageCount} redeemed`;

                    const validityText = d.endDate
                      ? `Expires ${new Date(d.endDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                      : "Never expires";

                    let statusBadgeClass = "active";
                    let statusLabel = "Active";

                    if (d.status === "disabled") {
                      statusBadgeClass = "cancelled";
                      statusLabel = "Disabled";
                    } else if (d.isExpired) {
                      statusBadgeClass = "pending";
                      statusLabel = "Expired";
                    } else if (d.isMaxedOut) {
                      statusBadgeClass = "pending";
                      statusLabel = "Limit Reached";
                    }

                    return (
                      <tr key={d._id} className="table-row">
                        <td>
                          <div className="coupon-code-cell">
                            <span className="coupon-code-badge">{d.code}</span>
                            <button
                              type="button"
                              className="copy-coupon-btn"
                              onClick={() => handleCopy(d.code)}
                              title="Copy coupon code"
                            >
                              {copiedCode === d.code ? (
                                <Check size={13} className="text-emerald" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                            {d.description && (
                              <small className="coupon-desc-text">{d.description}</small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="benefit-value-tag">{benefitText}</span>
                        </td>

                        <td>
                          <span className="condition-pill">{conditionText}</span>
                        </td>

                        <td>
                          <span className="items-count-badge">{usageText}</span>
                        </td>

                        <td>
                          <span className="validity-meta-text">
                            <Calendar size={12} />
                            {validityText}
                          </span>
                        </td>

                        <td>
                          <span className={`status-pill ${statusBadgeClass}`}>
                            <span className="status-dot"></span>
                            {statusLabel}
                          </span>
                        </td>

                        <td className="text-right">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="icon-action"
                              onClick={() => handleToggleStatus(d)}
                              disabled={actionLoadingId === d._id}
                              title={d.status === "active" ? "Disable Discount" : "Enable Discount"}
                              aria-label="Toggle status"
                            >
                              <Power
                                size={15}
                                color={d.status === "active" ? "#10b981" : "#94a3b8"}
                              />
                            </button>

                            <button
                              type="button"
                              className="icon-action edit"
                              onClick={() => openEditModal(d)}
                              title="Edit Discount"
                              aria-label="Edit discount"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              className="icon-action delete"
                              onClick={() => handleDelete(d._id, d.code)}
                              disabled={actionLoadingId === d._id}
                              title="Delete Discount"
                              aria-label="Delete discount"
                            >
                              <Trash2 size={15} />
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

        {/* Create / Edit Discount Modal */}
        {modalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          >
            <div
              className="modal-card discount-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>{editingId ? "Edit Discount Coupon" : "Create New Discount"}</h3>
                  <p>Configure promotion rules, percentage values, and checkout thresholds</p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div
                  className="error-message"
                  style={{ margin: "20px 24px 0" }}
                >
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="discount-form-body">
                {/* Code Field & Random Generator */}
                <div className="form-field">
                  <div className="field-label-row">
                    <span className="field-label">
                      Coupon Code <span className="required-star">*</span>
                    </span>
                    <button
                      type="button"
                      className="generate-code-btn"
                      onClick={generateRandomCode}
                    >
                      <Sparkles size={12} />
                      Generate Random Code
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. FESTIVE20"
                    required
                    style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px" }}
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="form-grid-two">
                  <div className="form-field">
                    <span className="field-label">Discount Type</span>
                    <select
                      value={form.discountType}
                      onChange={(e) =>
                        setForm({ ...form, discountType: e.target.value })
                      }
                      className="shopify-select"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Cash Amount (₹)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <span className="field-label">
                      Discount Value ({form.discountType === "percentage" ? "%" : "₹"}){" "}
                      <span className="required-star">*</span>
                    </span>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.discountValue}
                      onChange={(e) =>
                        setForm({ ...form, discountValue: e.target.value })
                      }
                      placeholder={form.discountType === "percentage" ? "e.g. 15" : "e.g. 200"}
                      required
                    />
                  </div>
                </div>

                {/* Min Purchase & Max Cap */}
                <div className="form-grid-two">
                  <div className="form-field">
                    <span className="field-label">Minimum Purchase Amount (₹)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.minPurchaseAmount}
                      onChange={(e) =>
                        setForm({ ...form, minPurchaseAmount: e.target.value })
                      }
                      placeholder="0 for no minimum"
                    />
                  </div>

                  <div className="form-field">
                    <span className="field-label">Max Discount Cap (₹ Optional)</span>
                    <input
                      type="number"
                      min="0"
                      value={form.maxDiscountAmount}
                      onChange={(e) =>
                        setForm({ ...form, maxDiscountAmount: e.target.value })
                      }
                      placeholder="Unlimited if blank"
                      disabled={form.discountType === "fixed"}
                    />
                  </div>
                </div>

                {/* Usage Limit & Expiration */}
                <div className="form-grid-two">
                  <div className="form-field">
                    <span className="field-label">Total Redemption Limit</span>
                    <input
                      type="number"
                      min="1"
                      value={form.usageLimit}
                      onChange={(e) =>
                        setForm({ ...form, usageLimit: e.target.value })
                      }
                      placeholder="Unlimited if blank"
                    />
                  </div>

                  <div className="form-field">
                    <span className="field-label">Expiration Date</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-field">
                  <span className="field-label">Description / Note</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="e.g. 15% discount for first-time customers"
                  />
                </div>

                {/* Actions */}
                <div className="form-sticky-footer" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    <Check size={16} />
                    <span>{saving ? "Saving..." : editingId ? "Update Discount" : "Create Discount"}</span>
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
