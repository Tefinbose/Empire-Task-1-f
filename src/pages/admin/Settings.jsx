import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Store,
  ShieldCheck,
  Lock,
  Mail,
  Check,
  RotateCw,
  LogOut,
  Sliders,
  DollarSign,
  Bell,
  Save,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import {
  getAdminProfile,
  updateAdminProfile,
  adminLogout,
} from "../../services/adminAuthService";

const initialStoreSettings = {
  storeName: "Empire Main Store",
  contactEmail: "contact@empire.com",
  supportPhone: "+91 98765 43210",
  currency: "INR",
  currencySymbol: "₹",
  timezone: "Asia/Kolkata (IST)",
  shippingFee: 50,
  freeShippingThreshold: 500,
  taxRate: 18,
  emailNotifications: true,
  stockAlerts: true,
};

export default function Settings() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("storeSettings");
      return saved ? { ...initialStoreSettings, ...JSON.parse(saved) } : initialStoreSettings;
    } catch {
      return initialStoreSettings;
    }
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!localStorage.getItem("adminToken")) {
      navigate("/admin/login", { replace: true });
      return;
    }

    async function fetchProfile() {
      setLoadingProfile(true);
      try {
        const admin = await getAdminProfile();
        setProfile(admin);
        setName(admin.name || "");
        setEmail(admin.email || "");
      } catch (err) {
        setProfileMessage({
          type: "error",
          text: err.response?.data?.message || err.message || "Failed to load admin profile.",
        });
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [navigate]);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileMessage({ type: "", text: "" });

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword && !currentPassword) {
      setProfileMessage({
        type: "error",
        text: "Please enter your current password to set a new password.",
      });
      return;
    }

    setSavingProfile(true);
    try {
      const payload = { name, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await updateAdminProfile(payload);
      setProfile(res.admin);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setProfileMessage({
        type: "success",
        text: "Profile updated successfully! New details are now active.",
      });
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  function handleStoreSettingsSubmit(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      localStorage.setItem("storeSettings", JSON.stringify(storeSettings));
      setSettingsMessage({
        type: "success",
        text: "Store preferences and checkout configuration saved successfully.",
      });
    } catch (err) {
      setSettingsMessage({
        type: "error",
        text: "Failed to persist store settings.",
      });
    } finally {
      setSavingSettings(false);
    }
  }

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <AdminLayout>
      <div className="settings-page-container">
        {/* Header */}
        <div className="page-heading page-heading-row">
          <div>
            <span className="eyebrow">STORE CONFIGURATION & ADMIN IDENTITY</span>
            <h1>Settings</h1>
            <p>Manage merchant credentials, store identity, and fulfillment policies.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
            title="Sign out of administration"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-nav-tabs">
          {[
            { id: "profile", label: "Admin Profile & Access", icon: User },
            { id: "store", label: "Store Identity & Regional", icon: Store },
            { id: "checkout", label: "Taxes & Shipping", icon: DollarSign },
            { id: "notifications", label: "Alerts & Security", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Profile & Identity (Who is logged in) */}
        {activeTab === "profile" && (
          <div className="settings-tab-content">
            {/* Identity Card: "Who is Logged in" */}
            <section className="admin-panel identity-overview-card">
              <div className="identity-card-inner">
                <div className="identity-avatar-large">
                  {(profile?.name || "A").charAt(0).toUpperCase()}
                </div>

                <div className="identity-details">
                  <div className="identity-title-row">
                    <h2>{profile?.name || "Administrator"}</h2>
                    <span className="identity-badge-pill">
                      <ShieldCheck size={13} />
                      Store Owner (Role: {profile?.role || "admin"})
                    </span>
                  </div>

                  <p className="identity-email">
                    <Mail size={14} />
                    <span>{profile?.email || "admin@example.com"}</span>
                  </p>

                  <div className="identity-meta-chips">
                    <span className="meta-chip">
                      <Sparkles size={12} /> Authenticated Active Session
                    </span>
                    <span className="meta-chip">
                      ID: #{profile?.id ? String(profile.id).slice(-8).toUpperCase() : "ROOT"}
                    </span>
                    <span className="meta-chip">
                      JWT 24-Hour Token Valid
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile Edit Form */}
            <section className="admin-panel form-panel">
              <div className="panel-heading">
                <div>
                  <h3>Edit Profile Details</h3>
                  <p>Update your administrator contact information and password</p>
                </div>
              </div>

              {profileMessage.text && (
                <div
                  className={`message-banner ${
                    profileMessage.type === "success" ? "success-message" : "error-message"
                  }`}
                  style={{ margin: "20px 24px 0" }}
                >
                  {profileMessage.type === "success" ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {loadingProfile ? (
                <div className="loading-state-card" style={{ padding: "40px" }}>
                  <div className="loading-spinner"></div>
                  <p>Loading administrator profile...</p>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="settings-form">
                  <div className="form-grid-two">
                    <label className="form-field">
                      <span className="field-label">Administrator Full Name</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Store Owner"
                      />
                    </label>

                    <label className="form-field">
                      <span className="field-label">Administrator Email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="e.g. admin@empire.com"
                      />
                    </label>
                  </div>

                  <div className="settings-divider">
                    <span>SECURITY & PASSWORD (OPTIONAL)</span>
                  </div>

                  <div className="form-grid-three">
                    <label className="form-field">
                      <span className="field-label">Current Password</span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                    </label>

                    <label className="form-field">
                      <span className="field-label">New Password</span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        autoComplete="new-password"
                      />
                    </label>

                    <label className="form-field">
                      <span className="field-label">Confirm New Password</span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        autoComplete="new-password"
                      />
                    </label>
                  </div>

                  <div className="form-sticky-footer" style={{ marginTop: "24px" }}>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={savingProfile}
                    >
                      <Save size={16} />
                      <span>{savingProfile ? "Saving Profile..." : "Save Profile Details"}</span>
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: Store Identity & Regional */}
        {activeTab === "store" && (
          <section className="admin-panel form-panel">
            <div className="panel-heading">
              <div>
                <h3>Store Identity & Regional Defaults</h3>
                <p>Public store metadata displayed to customer touchpoints</p>
              </div>
            </div>

            {settingsMessage.text && (
              <div
                className={`message-banner ${
                  settingsMessage.type === "success" ? "success-message" : "error-message"
                }`}
                style={{ margin: "20px 24px 0" }}
              >
                <Check size={16} />
                <span>{settingsMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleStoreSettingsSubmit} className="settings-form">
              <div className="form-grid-two">
                <label className="form-field">
                  <span className="field-label">Online Store Name</span>
                  <input
                    type="text"
                    value={storeSettings.storeName}
                    onChange={(e) =>
                      setStoreSettings({ ...storeSettings, storeName: e.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Customer Support Email</span>
                  <input
                    type="email"
                    value={storeSettings.contactEmail}
                    onChange={(e) =>
                      setStoreSettings({ ...storeSettings, contactEmail: e.target.value })
                    }
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Customer Service Phone</span>
                  <input
                    type="tel"
                    value={storeSettings.supportPhone}
                    onChange={(e) =>
                      setStoreSettings({ ...storeSettings, supportPhone: e.target.value })
                    }
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Store Operating Currency</span>
                  <select
                    value={storeSettings.currency}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        currency: e.target.value,
                        currencySymbol: e.target.value === "USD" ? "$" : e.target.value === "EUR" ? "€" : "₹",
                      })
                    }
                  >
                    <option value="INR">Indian Rupee (INR - ₹)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                  </select>
                </label>

                <label className="form-field full-width">
                  <span className="field-label">Primary Timezone</span>
                  <input
                    type="text"
                    value={storeSettings.timezone}
                    onChange={(e) =>
                      setStoreSettings({ ...storeSettings, timezone: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="form-sticky-footer" style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingSettings}
                >
                  <Save size={16} />
                  <span>{savingSettings ? "Saving Settings..." : "Save Store Details"}</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 3: Taxes & Shipping */}
        {activeTab === "checkout" && (
          <section className="admin-panel form-panel">
            <div className="panel-heading">
              <div>
                <h3>Shipping & Tax Policies</h3>
                <p>Standard fulfillment costs and tax rates calculated at checkout</p>
              </div>
            </div>

            {settingsMessage.text && (
              <div
                className={`message-banner ${
                  settingsMessage.type === "success" ? "success-message" : "error-message"
                }`}
                style={{ margin: "20px 24px 0" }}
              >
                <Check size={16} />
                <span>{settingsMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleStoreSettingsSubmit} className="settings-form">
              <div className="form-grid-three">
                <label className="form-field">
                  <span className="field-label">Standard Shipping Fee (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={storeSettings.shippingFee}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        shippingFee: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Free Shipping Minimum Threshold (₹)</span>
                  <input
                    type="number"
                    min="0"
                    value={storeSettings.freeShippingThreshold}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        freeShippingThreshold: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label className="form-field">
                  <span className="field-label">Estimated GST / Tax Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={storeSettings.taxRate}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        taxRate: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <div className="form-sticky-footer" style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingSettings}
                >
                  <Save size={16} />
                  <span>Save Shipping & Taxes</span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 4: Alerts & Security */}
        {activeTab === "notifications" && (
          <section className="admin-panel form-panel">
            <div className="panel-heading">
              <div>
                <h3>Alerts & Operational Toggles</h3>
                <p>Automated merchant notification triggers</p>
              </div>
            </div>

            <form onSubmit={handleStoreSettingsSubmit} className="settings-form">
              <div className="toggle-list">
                <div className="toggle-row">
                  <div>
                    <strong>Order Placement Notifications</strong>
                    <p>Receive notifications whenever a customer completes checkout</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSettings.emailNotifications}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="checkbox-toggle"
                  />
                </div>

                <div className="toggle-row">
                  <div>
                    <strong>Low Stock Inventory Alerts</strong>
                    <p>Trigger alerts when product quantity drops below 5 units</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={storeSettings.stockAlerts}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        stockAlerts: e.target.checked,
                      })
                    }
                    className="checkbox-toggle"
                  />
                </div>
              </div>

              <div className="form-sticky-footer" style={{ marginTop: "24px" }}>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingSettings}
                >
                  <Save size={16} />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
