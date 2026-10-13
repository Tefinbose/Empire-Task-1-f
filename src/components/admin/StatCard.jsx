import { TrendingUp } from "lucide-react";

export default function StatCard({
  title,
  value,
  Icon,
  color = "indigo",
  description,
  trend = "+12%",
  trendText = "vs last month",
}) {
  return (
    <article className={`stat-card stat-card-${color}`}>
      <div className="stat-card-header">
        <div className={`stat-icon-wrap ${color}`}>
          <Icon size={22} strokeWidth={2.2} />
        </div>
        {trend && (
          <div className="stat-trend-badge positive">
            <TrendingUp size={12} strokeWidth={2.5} />
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>

      <div className="stat-card-footer">
        <span className="stat-description">{description}</span>
        {trendText && <span className="stat-trend-subtext">{trendText}</span>}
      </div>
    </article>
  );
}