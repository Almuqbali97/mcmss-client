import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './LandingPage.css';

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
    </div>
  );
}

export default LandingPage;
