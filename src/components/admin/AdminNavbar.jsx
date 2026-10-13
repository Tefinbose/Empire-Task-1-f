import { useState, useEffect } from "react";
import { Bell, Menu, Search, Sparkles } from "lucide-react";

export default function AdminNavbar({ onMenuClick }) {
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

  return (
    <header className="admin-navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open mobile navigation"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-store-info">
          <div className="store-badge">
            <span className="store-name">Empire Main Store</span>
          </div>
          <span className="store-subtext">Production Environment</span>
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
        <button className="notification-button" aria-label="Notifications" title="Notifications">
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
  );
}