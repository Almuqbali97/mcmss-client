import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubmissions } from '../utils/api';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const loadSubmissions = async () => {
    try {
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
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

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>Research and Studies Committee</h1>
          <div className="header-user">
            <span>Welcome, {user.name}</span>
            {user.role === 'admin' && (
              <button className="btn btn-outline" onClick={() => navigate('/admin')} style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                Admin Panel
              </button>
            )}
            <button className="btn btn-outline" onClick={() => navigate('/change-password')} style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              Change Password
            </button>
            <button className="btn-logout" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="dashboard-header">
          <h2>My Submissions</h2>
          <button className="btn btn-primary" onClick={() => navigate('/submission/new')}>
            + New Submission
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No submissions yet</h3>
              <p>Start by creating a new research ethics approval submission.</p>
              <button className="btn btn-primary" onClick={() => navigate('/submission/new')} style={{ marginTop: '1rem' }}>
                Create New Submission
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Research Title</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  {user.role === 'admin' && <th>Principal Investigator</th>}
                  {user.role === 'admin' && <th>Assigned Reviewer</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission._id || submission.id}>
                    <td>
                      <div>
                        <strong>{submission.researchTitle || 'Untitled Research'}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.25rem' }}>
                          {submission.submissionId || `MCMSS-MREC ${submission._id || submission.id}/${new Date(submission.submittedDate || Date.now()).getFullYear()}`}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusClass(submission.status)}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(submission.submittedDate)}</td>
                    {user.role === 'admin' && (
                      <>
                        <td>{submission.principalInvestigator}</td>
                        <td>{submission.assignedReviewer || 'Not assigned'}</td>
                      </>
                    )}
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-outline" 
                          onClick={() => navigate(`/submission/${submission._id || submission.id}`)}
                        >
                          View
                        </button>
                        {submission.status === 'draft' && (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate(`/submission/${submission._id || submission.id}/edit`)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
