import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissions, getPublicationFundingApplications } from '../utils/api';
import UserMenu from './UserMenu';
import './Dashboard.css';

const FORM_TYPES = [
  {
    id: 'ethics',
    title: 'Research Ethics Approval',
    description: 'Submit a new application for medical research ethics committee review. Covers study design, ethical considerations, and research proposals.',
    icon: '📋',
    accent: 'ethics',
    newRoute: '/submission/new',
    countLabel: 'submission',
  },
  {
    id: 'publication-funding',
    title: 'Publication Funding',
    description: 'Apply for reimbursement of article processing charges, open-access fees, and related publication costs after manuscript acceptance.',
    icon: '📄',
    accent: 'publication',
    newRoute: '/publication-funding/new',
    countLabel: 'application',
  },
];

function FormTypeCard({ form, count, onStart, onViewApplications }) {
  return (
    <article className={`form-type-card form-type-card--${form.accent}`}>
      <span className="form-type-card-icon" aria-hidden>{form.icon}</span>
      <div className="form-type-card-body">
        <h3 className="form-type-card-title">{form.title}</h3>
        <p className="form-type-card-description">{form.description}</p>
        <p className="form-type-card-meta">
          {count} {count === 1 ? form.countLabel : `${form.countLabel}s`}
        </p>
      </div>
      <div className="form-type-card-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start New
        </button>
        <button type="button" className="btn btn-outline" onClick={onViewApplications} disabled={count === 0}>
          View All
        </button>
      
      </div>
    </article>
  );
}

function Dashboard({ user, onLogout }) {
  const [ethicsSubmissions, setEthicsSubmissions] = useState([]);
  const [publicationApps, setPublicationApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ethics');
  const navigate = useNavigate();
  const isReviewer = user.role === 'reviewer';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [ethics, publication] = await Promise.all([
        getSubmissions(),
        getPublicationFundingApplications(),
      ]);
      setEthicsSubmissions(ethics);
      setPublicationApps(publication);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => `status-badge status-${status}`;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInvestigatorName = (item, isPublication = false) => {
    if (isPublication) return item.applicantName || 'N/A';
    if (item.principalInvestigator) return item.principalInvestigator;
    const submittedBy = item.submittedBy;
    if (!submittedBy) return 'N/A';
    if (typeof submittedBy === 'string') return submittedBy;
    const name = `${submittedBy.firstName || ''} ${submittedBy.lastName || ''}`.trim();
    return name || submittedBy.email || 'N/A';
  };

  const counts = {
    ethics: ethicsSubmissions.length,
    'publication-funding': publicationApps.length,
  };

  const renderEthicsTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Research Title</th>
          {isReviewer && <th>Principal Investigator</th>}
          <th>Status</th>
          <th>Submitted Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {ethicsSubmissions.map((submission) => (
          <tr key={submission._id || submission.id}>
            <td>
              <div>
                <strong>{submission.researchTitle || 'Untitled Research'}</strong>
                <div className="table-subtext">
                  {submission.submissionId || `MCMSS-MREC ${submission._id || submission.id}`}
                </div>
              </div>
            </td>
            {isReviewer && <td>{getInvestigatorName(submission)}</td>}
            <td>
              <span className={getStatusClass(submission.status)}>
                {submission.status.replace('_', ' ').toUpperCase()}
              </span>
            </td>
            <td>{formatDate(submission.submittedDate)}</td>
            <td>
              <div className="action-buttons">
                <button className="btn btn-outline" onClick={() => navigate(`/submission/${submission._id || submission.id}`)}>View</button>
                {isReviewer && submission.status === 'under_review' && (
                  <button className="btn btn-primary" onClick={() => navigate(`/submission/${submission._id || submission.id}`)}>Review</button>
                )}
                {!isReviewer && submission.status === 'draft' && (
                  <button className="btn btn-secondary" onClick={() => navigate(`/submission/${submission._id || submission.id}/edit`)}>Edit</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPublicationTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Manuscript Title</th>
          {isReviewer && <th>Applicant</th>}
          <th>Status</th>
          <th>Submitted Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {publicationApps.map((app) => (
          <tr key={app._id || app.id}>
            <td>
              <div>
                <strong>{app.manuscriptTitle || 'Untitled'}</strong>
                <div className="table-subtext">{app.applicationId}</div>
              </div>
            </td>
            {isReviewer && <td>{getInvestigatorName(app, true)}</td>}
            <td>
              <span className={getStatusClass(app.status)}>{app.status.replace('_', ' ').toUpperCase()}</span>
            </td>
            <td>{formatDate(app.submittedDate)}</td>
            <td>
              <div className="action-buttons">
                <button className="btn btn-outline" onClick={() => navigate(`/publication-funding/${app._id || app.id}`)}>View</button>
                {isReviewer && app.status === 'under_review' && (
                  <button className="btn btn-primary" onClick={() => navigate(`/publication-funding/${app._id || app.id}`)}>Review</button>
                )}
                {!isReviewer && app.status === 'draft' && (
                  <button className="btn btn-secondary" onClick={() => navigate(`/publication-funding/${app._id || app.id}/edit`)}>Edit</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const currentList = activeTab === 'ethics' ? ethicsSubmissions : publicationApps;
  const activeForm = FORM_TYPES.find((f) => f.id === activeTab);

  return (
    <div className="dashboard-page app-page app-page--dashboard">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <h1>Research and Studies Committee</h1>
            <span className="header-subtitle">Medical City for Military and Security Services</span>
          </div>
          <div className="header-user">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="container">
        <section className="dashboard-intro">
          <h2>{isReviewer ? 'Assigned Reviews' : 'Application Portal'}</h2>
          <p>
            {isReviewer
              ? 'Review submissions and publication funding applications assigned to you by the committee.'
              : 'Choose a form below to start a new application, or view your existing submissions.'}
          </p>
        </section>

        {!isReviewer && (
          <section className="form-cards-section" aria-label="Available forms">
            <div className="form-cards-grid">
              {FORM_TYPES.map((form) => (
                <FormTypeCard
                  key={form.id}
                  form={form}
                  count={counts[form.id]}
                  onStart={() => navigate(form.newRoute)}
                  onViewApplications={() => setActiveTab(form.id)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="applications-section">
          <div className="applications-section-header">
            <h3>{isReviewer ? 'Your assignments' : 'My applications'}</h3>
            <div className="dashboard-tabs">
              {FORM_TYPES.map((form) => (
                <button
                  key={form.id}
                  type="button"
                  className={`dashboard-tab ${activeTab === form.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(form.id)}
                >
                  {form.id === 'ethics' ? 'Ethics' : 'Publication Funding'} ({counts[form.id]})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="card applications-card">
              <div className="loading">Loading applications...</div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="card applications-card applications-empty">
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden>{activeForm?.icon}</span>
                <h3>
                  {isReviewer
                    ? 'No assigned items'
                    : activeTab === 'ethics'
                      ? 'No ethics submissions yet'
                      : 'No publication funding applications yet'}
                </h3>
                <p>
                  {isReviewer
                    ? 'Assigned items will appear here once an administrator assigns them to you.'
                    : 'Your submitted applications will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="card applications-card">
              {activeTab === 'ethics' ? renderEthicsTable() : renderPublicationTable()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
