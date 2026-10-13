import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Megaphone,
  Tag,
  Settings,
  LogOut,
  Store,
  X,
  ShieldCheck,
} from "lucide-react";
import { adminLogout } from "../../services/adminAuthService";

const navGroups = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", path: "/admin", Icon: LayoutDashboard, exact: true },
      { label: "Orders", path: "/admin/orders", Icon: ShoppingCart },
      { label: "Products", path: "/admin/products", Icon: Package },
      { label: "Customers", path: "/admin/customers", Icon: Users },
    ],
  },
  {
    title: "SALES & MARKETING",
    items: [
      { label: "Analytics", path: "/admin/analytics", Icon: BarChart3 },
      { label: "Marketing", path: "/admin/marketing", Icon: Megaphone },
      { label: "Discounts", path: "/admin/discounts", Icon: Tag },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", path: "/admin/settings", Icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setAdmin(JSON.parse(localStorage.getItem("admin") || "{}"));
      } catch {
        setAdmin({});
      }
    };

    window.addEventListener("adminProfileUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("adminProfileUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <div className="brand-icon">
            <Store size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="brand-title">EMPIRE</h2>
            <p className="brand-subtitle">Shopify Merchant Core</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-nav-container">
        {navGroups.map((group) => (
          <div key={group.title} className="sidebar-section">
            <span className="sidebar-section-title">{group.title}</span>
            <nav className="sidebar-nav">
              {group.items.map(({ label, path, Icon, exact }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <div className="link-icon-wrap">
                    <Icon size={18} strokeWidth={2} />
                  </div>
                  <span className="link-text">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom Profile & Sign out */}
      <div className="sidebar-footer">
        <div className="admin-profile-card">
          <div className="admin-profile-avatar">
            {(admin.name || "Admin").charAt(0).toUpperCase()}
          </div>
          <div className="admin-profile-meta">
            <strong className="admin-name">{admin.name || "Administrator"}</strong>
            <span className="admin-role">
              <ShieldCheck size={12} />
              Owner Store
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          title="Sign out of Admin"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
