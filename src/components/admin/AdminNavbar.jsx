import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  Store,
  Layers,
  ExternalLink,
  X,
  RotateCw,
} from "lucide-react";
import {
  getStores,
  getCurrentStore,
  switchStore,
  createStore,
} from "../../services/storeService";

export default function AdminNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "{}");
    } catch {
      return {};
    }
  });

  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);

  // New store modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [newStoreCurrency, setNewStoreCurrency] = useState("INR");
  const [creatingStore, setCreatingStore] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadStoreData = async () => {
    try {
      const [allStoresRes, activeStore] = await Promise.all([
        getStores().catch(() => ({ data: [] })),
        getCurrentStore().catch(() => null),
      ]);

      if (allStoresRes?.data) {
        setStores(allStoresRes.data);
      }
      if (activeStore) {
        setCurrentStore(activeStore);
        localStorage.setItem("currentStoreId", activeStore._id);
        localStorage.setItem("currentStoreName", activeStore.name);
      }
    } catch (err) {
      console.error("Failed to load stores in navbar:", err);
    }
  };

  useEffect(() => {
    loadStoreData();

    const handleProfileUpdate = () => {
      try {
        setAdmin(JSON.parse(localStorage.getItem("admin") || "{}"));
      } catch {
        setAdmin({});
      }
    };

    const handleStoreChange = (e) => {
      if (e.detail) {
        setCurrentStore(e.detail);
      }
      loadStoreData();
    };

    window.addEventListener("adminProfileUpdated", handleProfileUpdate);
    window.addEventListener("storeChanged", handleStoreChange);
    window.addEventListener("storeUpdated", loadStoreData);
    window.addEventListener("storage", handleProfileUpdate);

    // Click outside listener for dropdown
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("adminProfileUpdated", handleProfileUpdate);
      window.removeEventListener("storeChanged", handleStoreChange);
      window.removeEventListener("storeUpdated", loadStoreData);
      window.removeEventListener("storage", handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectStore = async (storeId) => {
    if (currentStore?._id === storeId) {
      setIsDropdownOpen(false);
      return;
    }
    setSwitchingId(storeId);
    try {
      const switched = await switchStore(storeId);
      setCurrentStore(switched);
      setIsDropdownOpen(false);
      // Reload page state or notify components
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch store:", err);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleCreateStoreSubmit = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      setCreateError("Store name is required");
      return;
    }
    setCreatingStore(true);
    setCreateError("");
    try {
      const created = await createStore({
        name: newStoreName.trim(),
        slug: newStoreSlug.trim() || undefined,
        currency: newStoreCurrency,
        currencySymbol: newStoreCurrency === "INR" ? "₹" : "$",
      });
      setShowCreateModal(false);
      setNewStoreName("");
      setNewStoreSlug("");
      setIsDropdownOpen(false);
      if (created?._id) {
        await switchStore(created._id);
        window.location.reload();
      } else {
        await loadStoreData();
      }
    } catch (err) {
      setCreateError(
        err.response?.data?.message || err.message || "Failed to create store"
      );
    } finally {
      setCreatingStore(false);
    }
  };

  return (
    <>
      <header className="admin-navbar">
        <div className="navbar-left">
          <button
            className="mobile-menu-button"
            onClick={onMenuClick}
            aria-label="Open mobile navigation"
          >
            <Menu size={20} />
          </button>

          {/* Interactive Store Switcher Dropdown */}
          <div className="navbar-store-info" ref={dropdownRef}>
            <button
              type="button"
              className="store-switcher-trigger"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
              title="Click to switch or create store"
            >
              <div className="store-badge">
                <Store size={14} className="store-badge-icon" />
                <span className="store-name">
                  {currentStore?.name || "Empire Main Store"}
                </span>
                <ChevronDown
                  size={14}
                  className={`store-chevron ${isDropdownOpen ? "open" : ""}`}
                />
              </div>
              <span className="store-subtext">
                {currentStore?.plan
                  ? `${currentStore.plan.toUpperCase()} Plan`
                  : "Production Environment"}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="store-switcher-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-header-title">
                    <Layers size={14} />
                    <span>Your Merchant Stores ({stores.length})</span>
                  </div>
                  <button
                    type="button"
                    className="dropdown-new-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowCreateModal(true);
                    }}
                  >
                    <Plus size={13} />
                    <span>New Store</span>
                  </button>
                </div>

                <div className="dropdown-store-list">
                  {stores.map((s) => {
                    const isSelected = currentStore?._id === s._id;
                    const isSwitching = switchingId === s._id;
                    return (
                      <button
                        key={s._id}
                        type="button"
                        className={`dropdown-store-item ${
                          isSelected ? "active" : ""
                        }`}
                        onClick={() => handleSelectStore(s._id)}
                        disabled={isSwitching}
                      >
                        <div className="store-item-avatar">
                          {(s.name || "Store").charAt(0).toUpperCase()}
                        </div>
                        <div className="store-item-details">
                          <strong className="store-item-name">{s.name}</strong>
                          <span className="store-item-slug">
                            {s.slug}.myshopify.com
                          </span>
                        </div>
                        <div className="store-item-right">
                          <span className="store-plan-tag">
                            {s.plan || "growth"}
                          </span>
                          {isSwitching ? (
                            <RotateCw size={14} className="spin" />
                          ) : isSelected ? (
                            <Check size={16} className="selected-check" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="dropdown-footer">
                  <Link
                    to="/admin/stores"
                    onClick={() => setIsDropdownOpen(false)}
                    className="dropdown-manage-link"
                  >
                    <span>Manage all stores & domains</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-center">
          <div className="navbar-search">
            <Search size={16} className="search-icon" />
            <input
              placeholder="Search products, orders, customers..."
              aria-label="Global search"
            />
            <kbd className="search-kbd">⌘K</kbd>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            className="notification-button"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="notification-badge-dot"></span>
          </button>

          <div className="admin-profile-pill">
            <div className="admin-avatar">
              {(admin.name || "Admin").charAt(0).toUpperCase()}
            </div>
            <div className="admin-pill-text">
              <span className="pill-name">{admin.name || "Admin"}</span>
              <span className="pill-badge">
                <Sparkles size={10} /> Merchant
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modal for creating a new store */}
      {showCreateModal && (
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
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStoreSubmit} className="modal-form">
              {createError && (
                <div className="modal-error-banner">{createError}</div>
              )}

              <div className="form-group">
                <label htmlFor="modalStoreName">Store Name *</label>
                <input
                  id="modalStoreName"
                  type="text"
                  placeholder="e.g. Urban Style Apparel"
                  value={newStoreName}
                  onChange={(e) => {
                    setNewStoreName(e.target.value);
                    if (!newStoreSlug) {
                      setNewStoreSlug(
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
                <label htmlFor="modalStoreSlug">Store Handle / Slug</label>
                <div className="input-prefix-wrap">
                  <span className="input-prefix">shop/</span>
                  <input
                    id="modalStoreSlug"
                    type="text"
                    placeholder="urban-style"
                    value={newStoreSlug}
                    onChange={(e) => setNewStoreSlug(e.target.value.toLowerCase())}
                  />
                </div>
                <small className="form-help">
                  Will be used in your storefront URL and subdomain.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="modalStoreCurrency">Default Store Currency</label>
                <select
                  id="modalStoreCurrency"
                  value={newStoreCurrency}
                  onChange={(e) => setNewStoreCurrency(e.target.value)}
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingStore}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creatingStore}
                >
                  {creatingStore ? (
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
    </>
  );
}