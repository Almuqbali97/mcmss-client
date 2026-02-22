import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissions, assignReviewer, submitReview, getReviewers, createReviewer, updateReviewer, deleteReviewer, exportSubmission } from '../utils/api';
import './AdminPanel.css';

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: 'approved', comments: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeSection, setActiveSection] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddReviewerModal, setShowAddReviewerModal] = useState(false);
  const [showEditReviewerModal, setShowEditReviewerModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [reviewerForm, setReviewerForm] = useState({ name: '', email: '', specialization: '' });
  const [reviewerFormError, setReviewerFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsData, revsData] = await Promise.all([
        getSubmissions(),
        getReviewers()
      ]);
      setSubmissions(subsData);
      setReviewers(revsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReviewer = async (submissionId, reviewerId) => {
    try {
      await assignReviewer(submissionId, reviewerId);
      await loadData();
      setShowAssignModal(false);
      setSelectedSubmission(null);
      alert('Reviewer assigned successfully!');
    } catch (error) {
      alert('Failed to assign reviewer. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comments.trim()) {
      alert('Please provide review comments.');
      return;
    }

    try {
      await submitReview(selectedSubmission._id || selectedSubmission.id, reviewData.status, reviewData.comments);
      await loadData();
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewData({ status: 'approved', comments: '' });
      alert('Review submitted successfully!');
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    }
  };

  const handleExport = async (submissionId) => {
    try {
      const data = await exportSubmission(submissionId);
      const submission = data.submission || data;
      const json = JSON.stringify(submission, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission-${submission.submissionId || submissionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export. Please try again.');
    }
  };

  const openAddReviewerModal = () => {
    setReviewerForm({ name: '', email: '', specialization: '' });
    setReviewerFormError('');
    setShowAddReviewerModal(true);
  };

  const openEditReviewerModal = (reviewer) => {
    setSelectedReviewer(reviewer);
    setReviewerForm({
      name: reviewer.name || '',
      email: reviewer.email || '',
      specialization: reviewer.specialization || ''
    });
    setReviewerFormError('');
    setShowEditReviewerModal(true);
  };

  const handleAddReviewer = async (e) => {
    e.preventDefault();
    if (!reviewerForm.name.trim()) {
      setReviewerFormError('Name is required.');
      return;
    }
    if (!reviewerForm.email.trim()) {
      setReviewerFormError('Email is required.');
      return;
    }
    setReviewerFormError('');
    try {
      await createReviewer(reviewerForm);
      await loadData();
      setShowAddReviewerModal(false);
    } catch (error) {
      setReviewerFormError(error.response?.data?.message || 'Failed to add reviewer. Please try again.');
    }
  };

  const handleEditReviewer = async (e) => {
    e.preventDefault();
    if (!selectedReviewer) return;
    if (!reviewerForm.name.trim()) {
      setReviewerFormError('Name is required.');
      return;
    }
    if (!reviewerForm.email.trim()) {
      setReviewerFormError('Email is required.');
      return;
    }
    setReviewerFormError('');
    try {
      await updateReviewer(selectedReviewer._id || selectedReviewer.id, reviewerForm);
      await loadData();
      setShowEditReviewerModal(false);
      setSelectedReviewer(null);
    } catch (error) {
      setReviewerFormError(error.response?.data?.message || 'Failed to update reviewer. Please try again.');
    }
  };

  const handleDeleteReviewer = async (reviewer) => {
    if (!confirm(`Deactivate reviewer "${reviewer.name}"? They will no longer appear in the reviewers list.`)) return;
    try {
      await deleteReviewer(reviewer._id || reviewer.id);
      await loadData();
    } catch (error) {
      alert('Failed to deactivate reviewer. Please try again.');
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get available years from submissions
  const getAvailableYears = () => {
    const years = new Set();
    submissions.forEach(s => {
      if (s.submittedDate) {
        const year = new Date(s.submittedDate).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const filteredSubmissions = (filterStatus === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filterStatus))
    .filter(s => s.status !== 'draft') // Exclude drafts
    .filter(s => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.principalInvestigator?.toLowerCase().includes(query);
        const email = s.formData?.principalInvestigator?.email || '';
        const matchesEmail = email.toLowerCase().includes(query);
        const matchesTitle = s.researchTitle?.toLowerCase().includes(query);
        const matchesId = (s.submissionId || `#${s.id}`).toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTitle && !matchesId) return false;
      }
      // Year filter
      if (filterYear) {
        const submissionYear = s.submittedDate ? new Date(s.submittedDate).getFullYear() : null;
        if (submissionYear !== parseInt(filterYear)) return false;
      }
      // Time period filter
      if (filterPeriod !== 'all' && s.submittedDate) {
        const submissionDate = new Date(s.submittedDate);
        const now = new Date();
        const daysDiff = Math.floor((now - submissionDate) / (1000 * 60 * 60 * 24));
        
        if (filterPeriod === 'today' && daysDiff !== 0) return false;
        if (filterPeriod === 'week' && daysDiff > 7) return false;
        if (filterPeriod === 'month' && daysDiff > 30) return false;
        if (filterPeriod === 'quarter' && daysDiff > 90) return false;
        if (filterPeriod === 'year' && daysDiff > 365) return false;
      }
      return true;
    });

  const stats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === 'draft').length,
    under_review: submissions.filter(s => s.status === 'under_review').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    revisions_required: submissions.filter(s => s.status === 'revisions_required').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  };

  const renderApplicationsView = () => (
    <>
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total - stats.draft}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.under_review}</div>
          <div className="stat-label">Under Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.revisions_required}</div>
          <div className="stat-label">Revisions Required</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="card">
        <div className="admin-header">
          <h2>All Applications</h2>
        </div>

        {/* Enhanced Filters */}
        <div className="filters-container">
          <div className="filter-row">
            <div className="filter-item">
              <label>Search</label>
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search by ID, name, email, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>Status</label>
              <select
                className="form-control"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="revisions_required">Revisions Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Year</label>
              <select
                className="form-control"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label>Time Period</label>
              <select
                className="form-control"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <h3>No submissions found</h3>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Research Title</th>
                <th>Principal Investigator</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Assigned Reviewer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => (
                  <tr key={submission._id || submission.id}>
                    <td>{submission.submissionId || `MCMSS-MREC ${submission.id}/${new Date(submission.submittedDate || Date.now()).getFullYear()}`}</td>
                  <td>{submission.researchTitle || 'Untitled Research'}</td>
                  <td>{submission.principalInvestigator}</td>
                  <td>
                    <span className={getStatusClass(submission.status)}>
                      {submission.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{formatDate(submission.submittedDate)}</td>
                  <td>{submission.assignedReviewer || <span style={{ color: '#6c757d' }}>Not assigned</span>}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline"
                        onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
                      >
                        View
                      </button>
                      {submission.status === 'under_review' && !submission.assignedReviewer && (
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign Reviewer
                        </button>
                      )}
                      {submission.status === 'under_review' && submission.assignedReviewer && (
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowReviewModal(true);
                          }}
                        >
                          Review
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleExport(submission._id || submission.id)}
                      >
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderUsersView = () => (
    <div className="card">
      <h2>Users Management</h2>
      <div className="empty-state">
        <h3>Users Management</h3>
        <p>Manage users, roles, and permissions from here.</p>
        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '1rem' }}>
          This feature will be implemented to manage all platform users, their roles, and access permissions.
        </p>
      </div>
    </div>
  );

  const renderAdministrationView = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Administration</h2>
          <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
            Manage reviewer assignments and administrative tasks.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={openAddReviewerModal}
        >
          + Add Reviewer
        </button>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#3d283a' }}>Reviewer Assignment</h3>
        <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
          Assign reviewers to submissions that are under review. You can also manage reviewer assignments directly from the Applications view.
        </p>
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p>Use the "Assign Reviewer" button in the Applications view to assign reviewers to specific submissions.</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: '#3d283a' }}>Available Reviewers</h3>
        {reviewers.length === 0 ? (
          <div className="empty-state">
            <p>No reviewers available</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map((reviewer) => (
                <tr key={reviewer._id || reviewer.id}>
                  <td>{reviewer.name}</td>
                  <td>{reviewer.specialization || '—'}</td>
                  <td>{reviewer.email || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditReviewerModal(reviewer)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm btn-danger"
                        onClick={() => handleDeleteReviewer(reviewer)}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderReportsView = () => (
    <div className="card">
      <h2>Reports & Analytics</h2>
      <div className="empty-state">
        <h3>Reports & Analytics</h3>
        <p>View detailed reports and analytics about submissions, reviews, and platform usage.</p>
        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '1rem' }}>
          This section will provide comprehensive reports, statistics, and analytics for administrative insights.
        </p>
      </div>
    </div>
  );

  return (
    <div className="admin-panel-wrapper">
      <header className="header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="toggle-icon">{sidebarCollapsed ? '☰' : '←'}</span>
            </button>
            <h1>Admin Panel - Research and Studies Committee</h1>
          </div>
          <div className="header-user">
            <span>Welcome, {user.name}</span>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')} style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              User Dashboard
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/change-password')} style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              Change Password
            </button>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className={`admin-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Side Navigation */}
        <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${activeSection === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveSection('applications')}
              title="All Applications"
            >
              <span className="nav-icon">📋</span>
              {!sidebarCollapsed && <span>All Applications</span>}
            </button>
            <button
              className={`sidebar-nav-item ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
              title="Users"
            >
              <span className="nav-icon">👥</span>
              {!sidebarCollapsed && <span>Users</span>}
            </button>
            <button
              className={`sidebar-nav-item ${activeSection === 'administration' ? 'active' : ''}`}
              onClick={() => setActiveSection('administration')}
              title="Administration"
            >
              <span className="nav-icon">⚙️</span>
              {!sidebarCollapsed && <span>Administration</span>}
            </button>
            <button
              className={`sidebar-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveSection('reports')}
              title="Reports & Analytics"
            >
              <span className="nav-icon">📊</span>
              {!sidebarCollapsed && <span>Reports & Analytics</span>}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-main-content">
          {activeSection === 'applications' && renderApplicationsView()}
          {activeSection === 'users' && renderUsersView()}
          {activeSection === 'administration' && renderAdministrationView()}
          {activeSection === 'reports' && renderReportsView()}
        </main>
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign Reviewer</h3>
            <p><strong>Research:</strong> {selectedSubmission.researchTitle}</p>
            <div className="form-group">
              <label>Select Reviewer</label>
              <select
                className="form-control"
                onChange={(e) => {
                  if (e.target.value) {
                    handleAssignReviewer(selectedSubmission._id || selectedSubmission.id, e.target.value);
                  }
                }}
              >
                <option value="">Select a reviewer...</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer._id || reviewer.id} value={reviewer._id || reviewer.id}>
                    {reviewer.name} - {reviewer.specialization}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Submit Review</h3>
            <p><strong>Research:</strong> {selectedSubmission.researchTitle}</p>
            <div className="form-group">
              <label>Review Status <span className="required">*</span></label>
              <select
                className="form-control"
                value={reviewData.status}
                onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
              >
                <option value="approved">Approve</option>
                <option value="revisions_required">Revisions Required</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            <div className="form-group">
              <label>Review Comments <span className="required">*</span></label>
              <textarea
                className="form-control"
                value={reviewData.comments}
                onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                rows="6"
                placeholder="Enter your review comments and feedback..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowReviewModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmitReview}>
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {showAddReviewerModal && (
        <div className="modal-overlay" onClick={() => setShowAddReviewerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Reviewer</h3>
            <form onSubmit={handleAddReviewer}>
              {reviewerFormError && (
                <div className="form-error" style={{ color: '#dc3545', marginBottom: '1rem' }}>{reviewerFormError}</div>
              )}
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewerForm.name}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                  placeholder="Reviewer full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  value={reviewerForm.email}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, email: e.target.value })}
                  placeholder="reviewer@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewerForm.specialization}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, specialization: e.target.value })}
                  placeholder="e.g. Clinical Research, Ethics"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddReviewerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Reviewer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reviewer Modal */}
      {showEditReviewerModal && selectedReviewer && (
        <div className="modal-overlay" onClick={() => setShowEditReviewerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Reviewer</h3>
            <form onSubmit={handleEditReviewer}>
              {reviewerFormError && (
                <div className="form-error" style={{ color: '#dc3545', marginBottom: '1rem' }}>{reviewerFormError}</div>
              )}
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewerForm.name}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
                  placeholder="Reviewer full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  value={reviewerForm.email}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, email: e.target.value })}
                  placeholder="reviewer@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  className="form-control"
                  value={reviewerForm.specialization}
                  onChange={(e) => setReviewerForm({ ...reviewerForm, specialization: e.target.value })}
                  placeholder="e.g. Clinical Research, Ethics"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditReviewerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
