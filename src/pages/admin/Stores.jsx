import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Plus,
  RotateCw,
  Check,
  ExternalLink,
  Trash2,
  Settings as SettingsIcon,
  Globe,
  Coins,
  ShieldCheck,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import {
  getStores,
  createStore,
  switchStore,
  deleteStore,
} from "../../services/storeService";

export default function Stores() {
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [switchingId, setSwitchingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Create store modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [plan, setPlan] = useState("growth");
  const [savingStore, setSavingStore] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStores();
      setStores(res?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to load merchant stores"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleSwitch = async (storeId) => {
    setSwitchingId(storeId);
    setError("");
    setSuccessMsg("");
    try {
      const switched = await switchStore(storeId);
      setSuccessMsg(`Switched active context to "${switched.name}"`);
      await loadStores();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to switch store"
      );
    } finally {
      setSwitchingId(null);
    }
  };

  const handleDelete = async (store) => {
    if (stores.length <= 1) {
      alert("Cannot delete your only store. At least one store is required.");
      return;
    }

    const confirmMsg = `Are you sure you want to delete "${store.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(store._id);
    setError("");
    setSuccessMsg("");
    try {
      await deleteStore(store._id);
      setSuccessMsg(`Store "${store.name}" deleted successfully`);
      await loadStores();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete store"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Store name is required");
      return;
    }

    setSavingStore(true);
    setModalError("");
    try {
      const created = await createStore({
        name: name.trim(),
        slug: slug.trim() || undefined,
        domain: domain.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        currency,
        currencySymbol: currency === "INR" ? "₹" : "$",
        plan,
      });

      setShowModal(false);
      setName("");
      setSlug("");
      setDomain("");
      setContactEmail("");
      setSuccessMsg(`Store "${created.name}" created successfully and set as active.`);
      await loadStores();
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.message || "Failed to create store"
      );
    } finally {
      setSavingStore(false);
    }
  };

  const currentStore = stores.find((s) => s.isCurrent) || stores[0];

  return (
    <AdminLayout>
      <div className="admin-page-container">
        {/* Page Header */}
        <div className="page-header-row">
          <div>
            <h1 className="page-main-title">Merchant Stores & Environments</h1>
            <p className="page-subtitle">
              Manage multiple stores, domains, global currencies, and isolated tenant environments.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              type="button"
              className="btn-refresh"
              onClick={loadStores}
              disabled={loading}
              title="Refresh Stores"
            >
              <RotateCw size={16} className={loading ? "spin" : ""} />
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setModalError("");
                setShowModal(true);
              }}
            >
              <Plus size={16} />
              <span>Create Store</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-box error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert-box success">
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="stats-grid-row">
          <StatCard
            label="Total Stores"
            value={stores.length.toString()}
            icon={Store}
            trend="+1 this period"
          />
          <StatCard
            label="Active Environment"
            value={currentStore?.name || "Loading..."}
            icon={ShieldCheck}
            trend="Isolated Tenant"
          />
          <StatCard
            label="Store Currency"
            value={`${currentStore?.currency || "INR"} (${currentStore?.currencySymbol || "₹"})`}
            icon={Coins}
            trend="Active Exchange"
          />
          <StatCard
            label="Current Plan"
            value={(currentStore?.plan || "Growth").toUpperCase()}
            icon={Layers}
            trend="Multi-store Enabled"
          />
        </div>

        {/* Stores List View */}
        <div className="content-card-box">
          <div className="card-header-bar">
            <div>
              <h2 className="card-box-title">Configured Stores</h2>
              <p className="card-box-sub">
                Switch between stores to manage inventory, orders, discounts, and campaigns independently.
              </p>
            </div>
            <span className="badge-count-pill">{stores.length} Stores</span>
          </div>

          {loading ? (
            <div className="loading-state-box">
              <RotateCw size={28} className="spin" />
              <p>Fetching merchant stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="empty-state-box">
              <Store size={40} className="empty-icon" />
              <h3>No stores found</h3>
              <p>Create your first store to get started with multi-store management.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={16} />
                <span>Create Store</span>
              </button>
            </div>
          ) : (
            <div className="stores-grid-layout">
              {stores.map((store) => {
                const isCurrent = Boolean(store.isCurrent);
                const isSwitching = switchingId === store._id;
                const isDeleting = deletingId === store._id;

                return (
                  <div
                    key={store._id}
                    className={`store-management-card ${isCurrent ? "current-active" : ""}`}
                  >
                    <div className="store-card-header">
                      <div className="store-avatar-circle">
                        {(store.name || "Store").charAt(0).toUpperCase()}
                      </div>
                      <div className="store-card-info">
                        <div className="store-card-title-row">
                          <h3 className="store-card-name">{store.name}</h3>
                          {isCurrent && (
                            <span className="active-tag-badge">
                              <Check size={12} /> Active
                            </span>
                          )}
                        </div>
                        <span className="store-card-slug">
                          {store.slug}.myshopify.com
                        </span>
                      </div>
                    </div>

                    <div className="store-card-meta-list">
                      <div className="meta-row">
                        <span className="meta-label">Plan Tier</span>
                        <span className="plan-badge-pill">
                          {(store.plan || "growth").toUpperCase()}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Currency</span>
                        <strong className="meta-val">
                          {store.currency || "INR"} ({store.currencySymbol || "₹"})
                        </strong>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Support Email</span>
                        <span className="meta-val">
                          {store.contactEmail || "Not configured"}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Timezone</span>
                        <span className="meta-val">
                          {store.timezone || "Asia/Kolkata (IST)"}
                        </span>
                      </div>
                    </div>

                    <div className="store-card-actions">
                      {isCurrent ? (
                        <button
                          type="button"
                          className="btn-active-context"
                          disabled
                        >
                          <Check size={15} />
                          <span>Current Store</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-switch-store"
                          onClick={() => handleSwitch(store._id)}
                          disabled={isSwitching}
                        >
                          {isSwitching ? (
                            <>
                              <RotateCw size={14} className="spin" />
                              <span>Switching...</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight size={14} />
                              <span>Switch To This Store</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="store-card-sub-actions">
                        <button
                          type="button"
                          className="btn-icon-sub"
                          title="Configure Store Settings"
                          onClick={() => navigate("/admin/settings")}
                        >
                          <SettingsIcon size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Delete Store"
                          onClick={() => handleDelete(store)}
                          disabled={stores.length <= 1 || isDeleting}
                        >
                          {isDeleting ? (
                            <RotateCw size={14} className="spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Store Modal */}
      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Store size={20} className="modal-icon" />
                <h3>Create New Merchant Store</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              {modalError && (
                <div className="modal-error-banner">{modalError}</div>
              )}

              <div className="form-group">
                <label htmlFor="storeNameInput">Store Name *</label>
                <input
                  id="storeNameInput"
                  type="text"
                  placeholder="e.g. Empire Flagship Store"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "-")
                          .replace(/-+/g, "-")
                      );
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="storeSlugInput">Store Handle / Slug</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">shop/</span>
                  <input
                    id="storeSlugInput"
                    type="text"
                    placeholder="empire-flagship"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  />
                </div>
                <small className="form-help">
                  Unique subdomain for this storefront.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="storeDomainInput">Custom Domain (Optional)</label>
                <input
                  id="storeDomainInput"
                  type="text"
                  placeholder="e.g. flagship.empire.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="storeEmailInput">Contact Email</label>
                <input
                  id="storeEmailInput"
                  type="email"
                  placeholder="orders@empire.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="currencySelect">Currency</label>
                  <select
                    id="currencySelect"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="planSelect">Store Plan</label>
                  <select
                    id="planSelect"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  >
                    <option value="starter">Starter Plan</option>
                    <option value="growth">Growth Plan</option>
                    <option value="enterprise">Enterprise Plan</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={savingStore}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingStore}
                >
                  {savingStore ? (
                    <>
                      <RotateCw size={15} className="spin" />
                      <span>Creating Store...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Create Store</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
