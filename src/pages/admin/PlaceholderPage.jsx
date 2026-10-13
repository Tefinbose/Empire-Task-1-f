import { Sparkles } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";

export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <AdminLayout>
      <div className="placeholder-page-container">
        <div className="page-heading">
          <span className="eyebrow">SHOPIFY MODULE</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <section className="admin-panel">
          <div className="empty-state" style={{ padding: "80px 24px" }}>
            <div className="stat-icon-wrap indigo" style={{ width: "56px", height: "56px", margin: "0 auto 16px" }}>
              {Icon && <Icon size={28} strokeWidth={2} />}
            </div>
            <h3>{title} Dashboard</h3>
            <p style={{ maxWidth: "460px", margin: "8px auto 20px" }}>
              {description}. This section is prepared in the navigation and ready for full backend integration.
            </p>
            <span className="live-pill-sm">
              <Sparkles size={12} />
              Navigation Ready
            </span>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
