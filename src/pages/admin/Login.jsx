import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { adminLogin } from "../../services/adminAuthService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminLogin({ email, password });
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Authentication failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-ambient-glow-1"></div>
      <div className="login-ambient-glow-2"></div>

      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo-glow">
            <div className="login-logo">
              <Store size={26} strokeWidth={2.2} />
            </div>
          </div>
          <h1>EMPIRE</h1>
          <span className="login-badge-pill">Merchant Core v2.0</span>
        </div>

        <div className="login-header-text">
          <h2>Welcome back</h2>
          <p className="login-description">
            Sign in to manage your inventory, orders, and sales analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label">
            <span>Email address</span>
            <div className="login-input-wrap">
              <Mail size={17} className="input-icon" />
              <input
                type="email"
                autoComplete="username"
                placeholder="admin@empire.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label className="login-label">
            <span>Password</span>
            <div className="login-input-wrap">
              <LockKeyhole size={17} className="input-icon" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-flex">
                <span className="btn-spinner"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="btn-flex">
                <span>Sign in to Dashboard</span>
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div className="login-security-notice">
          <ShieldCheck size={14} />
          <span>256-bit Encrypted • Authorized Admin Gateway</span>
        </div>
      </section>
    </main>
  );
}
