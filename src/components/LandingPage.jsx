import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './LandingPage.css';

const LANDING_FORMS = [
  {
    id: 'ethics',
    title: 'Research Ethics Approval',
    description: 'Apply for medical research ethics committee review before starting your study.',
    icon: '📋',
    accent: 'ethics',
  },
  {
    id: 'publication',
    title: 'Publication Funding',
    description: 'Request reimbursement for article processing charges and publication-related fees.',
    icon: '📄',
    accent: 'publication',
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Full Screen Hero Section */}
      <section className="hero-section hero-fullscreen">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-logo-container">
            <img src={logo} alt="Hospital Logo" className="hero-logo" />
            <p className="hero-hospital-name">
              Medical City for Military and Security Services
            </p>
          </div>
          <h1 className="hero-main-title">
            Research and Studies Committee
          </h1>
          <p className="hero-subtitle">
            Submit ethics applications and publication funding requests through our secure portal.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn-hero btn-hero-primary">
              Access Platform
            </Link>
          </div>
        </div>

        {/* Footer in same view */}
        <footer className="landing-footer-inline">
          <p>&copy; 2026 Research and Studies Committee at the Medical City for Military and Security Services. All rights reserved.</p>
        </footer>
      </section>

      <section className="landing-forms-section">
        <div className="landing-forms-inner">
          <h2 className="landing-forms-title">Available Application Forms</h2>
          <p className="landing-forms-subtitle">Select the form that matches your request after signing in.</p>
          <div className="landing-forms-grid">
            {LANDING_FORMS.map((form) => (
              <article key={form.id} className={`landing-form-card landing-form-card--${form.accent}`}>
                <span className="landing-form-card-icon" aria-hidden>{form.icon}</span>
                <h3>{form.title}</h3>
                <p>{form.description}</p>
                <Link to="/login" className="landing-form-card-link">
                  Sign in to apply →
                </Link>
              </article>
            ))}
          </div>
        
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
