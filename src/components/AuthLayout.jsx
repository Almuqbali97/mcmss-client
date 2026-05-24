import { Link } from 'react-router-dom';
import './Login.css';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-brand-panel" aria-hidden="true">
        <div className="auth-brand-content">
          <p className="auth-brand-label">Medical City for Military and Security Services</p>
          <h2 className="auth-brand-title">Research and Studies Committee</h2>
          <p className="auth-brand-tagline">
            Secure portal for ethics applications and publication funding requests.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <Link to="/" className="auth-back-link">
          ← Back to home
        </Link>
        <div className="login-card">
          <div className="login-header">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
