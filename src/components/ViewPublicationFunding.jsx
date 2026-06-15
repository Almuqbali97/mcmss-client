import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPublicationFunding,
  submitPublicationFundingReview,
  updateCommitteeReview,
} from '../utils/api';
import { getDefaultRouteForRole } from '../utils/roleRoutes';
import { ELIGIBILITY_ITEMS, ATTACHMENT_ITEMS, FUNDING_ITEMS } from './publicationFunding/formData';
import { API_ORIGIN } from '../utils/apiConfig.js';
import UserMenu from './UserMenu';
import './ViewSubmission.css';
import './Dashboard.css';

function getFileName(file) {
  if (!file) return 'File';
  if (typeof file === 'string') return file;
  return file.name || file.originalName || file._fileMeta?.name || 'File';
}

function ViewField({ label, value }) {
  return <p><strong>{label}:</strong> {value || 'N/A'}</p>;
}

const EDITABLE_STATUSES = ['draft', 'revisions_required'];

function ViewPublicationFunding({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewDecision, setReviewDecision] = useState({ status: 'approved', comments: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [committeeReview, setCommitteeReview] = useState({});
  const [savingCommittee, setSavingCommittee] = useState(false);

  const isReviewer = user?.role === 'reviewer';
  const isAdmin = user?.role === 'admin';
  const fd = application?.formData || {};
  const backPath = getDefaultRouteForRole(user?.role);
  const canSubmitReview = (isReviewer || isAdmin) && application?.status === 'under_review';

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      const data = await getPublicationFunding(id);
      setApplication(data);
      setCommitteeReview(data.committeeReview || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewDecision.comments.trim()) {
      alert('Please provide review comments.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitPublicationFundingReview(id, reviewDecision.status, reviewDecision.comments);
      navigate(backPath);
    } catch {
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSaveCommitteeReview = async (e) => {
    e.preventDefault();
    setSavingCommittee(true);
    try {
      const updated = await updateCommitteeReview(id, committeeReview);
      setApplication(updated);
      alert('Committee review saved.');
    } catch {
      alert('Failed to save committee review.');
    } finally {
      setSavingCommittee(false);
    }
  };

  const header = (title, subtitle = 'Publication Funding Application') => (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1>{title}</h1>
          <span className="header-subtitle">{subtitle}</span>
        </div>
        <div className="header-user header-actions">
          {application && EDITABLE_STATUSES.includes(application.status) && user?.role === 'researcher' && (
            <button
              className="btn-header btn-header--primary"
              onClick={() => navigate(`/publication-funding/${id}/edit`)}
            >
              {application.status === 'revisions_required' ? 'Revise' : 'Edit'}
            </button>
          )}
          <button
            className="btn-header"
            onClick={() => navigate(backPath)}
          >
            Back
          </button>
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="app-page">
        {header('View Application')}
        <div className="container"><div className="loading">Loading...</div></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="app-page">
        {header('View Application')}
        <div className="container">
          <div className="card">
            <p>Application not found.</p>
            <button className="btn btn-primary" onClick={() => navigate(backPath)}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      {header('Publication Funding Application')}
      <div className="container">
        <div className="card">
          <h2>{application.manuscriptTitle}</h2>
          <p className="submission-meta">
            {application.applicationId} | Applicant: {application.applicantName} |
            Status: <span className={`status-badge status-${application.status}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
          </p>
        </div>

        <div className="card">
          <h3>Section 1: Applicant Information</h3>
          <ViewField label="Full name" value={fd.fullName} />
          <ViewField label="Department / Unit" value={fd.department} />
          <ViewField label="Position / Title" value={fd.position} />
          <ViewField label="Email" value={fd.email} />
          <ViewField label="Phone" value={fd.phone} />
          <ViewField label="Principal Investigator" value={fd.principalInvestigator} />
        </div>

        <div className="card">
          <h3>Section 2: Publication Information</h3>
          <ViewField label="Manuscript title" value={fd.manuscriptTitle} />
          <ViewField label="Journal name" value={fd.journalName} />
          <ViewField label="Date of acceptance" value={fd.dateOfAcceptance} />
          <ViewField label="Date of publication" value={fd.dateOfPublication} />
          <ViewField label="DOI / link" value={fd.doiOrLink} />
          <ViewField label="Scopus indexed" value={fd.scopusIndexed} />
          <ViewField label="Journal quartile" value={fd.journalQuartile} />
          <ViewField label="Impact factor" value={fd.impactFactor} />
          <ViewField label="Quartile source" value={fd.quartileSource} />
          {fd.quartileSource === 'Other' && (
            <ViewField label="Other quartile source" value={fd.quartileSourceOther} />
          )}
          {(fd.frontPageOrArticleFiles || []).length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <p><strong>Front page / article files</strong></p>
              <ul>
                {fd.frontPageOrArticleFiles.map((file, i) => (
                  <li key={i}>
                    {file.path ? (
                      <a href={`${API_ORIGIN}${file.path}`} target="_blank" rel="noreferrer">
                        {getFileName(file)}
                      </a>
                    ) : getFileName(file)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Section 3: Authorship and Affiliation</h3>
          <ViewField label="Applicant role" value={fd.applicantRole?.join(', ')} />
          <ViewField label="MCMSS affiliation stated" value={fd.mcmssAffiliationStated} />
        </div>

        <div className="card">
          <h3>Section 4: Type of Publication</h3>
          <ViewField label="Publication type" value={fd.publicationType} />
          {fd.publicationType === 'Other' && (
            <>
              <ViewField label="Other specification" value={fd.publicationTypeOther} />
              <ViewField label="Eligibility explanation" value={fd.publicationTypeOtherExplanation} />
            </>
          )}
        </div>

        <div className="card">
          <h3>Section 5: Ethical and Administrative Compliance</h3>
          <ViewField label="Prior ethical approval" value={fd.priorEthicalApproval} />
          <ViewField label="IRB number" value={fd.irbApprovalNumber} />
          <ViewField label="Approving institution" value={fd.approvingInstitution} />
          <ViewField label="Approval date" value={fd.ethicsApprovalDate} />
          <ViewField label="Reason if not required" value={fd.ethicsNotRequiredReason} />
          {fd.ethicsNotRequiredReason === 'Other' && (
            <ViewField label="Other reason" value={fd.ethicsNotRequiredOther} />
          )}
        </div>

        <div className="card">
          <h3>Section 6: Funding Request Details</h3>
          <table className="table">
            <thead>
              <tr><th>Item</th><th>Requested</th><th>Amount (OMR)</th></tr>
            </thead>
            <tbody>
              {FUNDING_ITEMS.map(({ key, label }) => (
                <tr key={key}>
                  <td>
                    {label}
                    {key === 'other' && fd.fundingItems?.other?.specify ? ` (${fd.fundingItems.other.specify})` : ''}
                  </td>
                  <td>{fd.fundingItems?.[key]?.requested || '—'}</td>
                  <td>{fd.fundingItems?.[key]?.amount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ViewField label="Total requested" value={fd.totalRequestedAmount} />
          <ViewField label="Date of payment" value={fd.dateOfPayment} />
          {(fd.proofOfPaymentFiles || []).length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <p><strong>Proof of payment files</strong></p>
              <ul>
                {fd.proofOfPaymentFiles.map((file, i) => (
                  <li key={i}>
                    {file.path ? (
                      <a href={`${API_ORIGIN}${file.path}`} target="_blank" rel="noreferrer">
                        {getFileName(file)}
                      </a>
                    ) : getFileName(file)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Section 7: Eligibility Checklist</h3>
          <ul>
            {ELIGIBILITY_ITEMS.map(({ key, label }) => (
              <li key={key}>{fd.eligibilityChecklist?.[key] ? '✓' : '○'} {label}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Section 8: Required Attachments</h3>
          {ATTACHMENT_ITEMS.map(({ key, label, files }) => (
            fd.attachmentChecklist?.[key] ? (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <p><strong>{label}</strong></p>
                <ul>
                  {(fd[files] || []).map((file, i) => (
                    <li key={i}>
                      {file.path ? (
                        <a href={`${API_ORIGIN}${file.path}`} target="_blank" rel="noreferrer">
                          {getFileName(file)}
                        </a>
                      ) : getFileName(file)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          ))}
        </div>

        <div className="card">
          <h3>Section 9: Applicant Declaration</h3>
          <ViewField label="Applicant name" value={fd.applicantDeclarationName} />
          <ViewField label="Signature" value={fd.applicantSignature} />
          <ViewField label="Date" value={fd.applicantDeclarationDate} />
        </div>

        {application.reviewComments && (
          <div className="card">
            <h3>Review Comments</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{application.reviewComments}</p>
          </div>
        )}

        {canSubmitReview && (
          <div className="card review-decision-card">
            <h3>Submit Review Decision</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label>Decision</label>
                <select
                  className="form-control"
                  value={reviewDecision.status}
                  onChange={(e) => setReviewDecision((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="approved">Approve</option>
                  <option value="revisions_required">Request Revisions</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comments *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={reviewDecision.comments}
                  onChange={(e) => setReviewDecision((p) => ({ ...p, comments: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}

        {isAdmin && (
          <div className="card">
            <h3>Section 10: Committee Review</h3>
            <p style={{ color: '#6c757d', marginBottom: '1rem' }}>For Research &amp; Studies Committee use only.</p>
            <form onSubmit={handleSaveCommitteeReview}>
              {[
                ['applicationReceivedOn', 'Application received on', 'date'],
                ['reviewedBy', 'Reviewed by', 'text'],
                ['approvedAmount', 'Approved amount (OMR)', 'text'],
                ['finalDecision', 'Final decision', 'text'],
                ['dateOfDecision', 'Date of decision', 'date'],
              ].map(([key, label, type]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <input
                    type={type}
                    className="form-control"
                    value={committeeReview[key] || ''}
                    onChange={(e) => setCommitteeReview((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </div>
              ))}
              {[
                ['journalQualityVerified', 'Journal quality verified'],
                ['authorshipEligibilityVerified', 'Authorship eligibility verified'],
                ['ethicalComplianceVerified', 'Ethical compliance verified'],
                ['recommendedForFunding', 'Recommended for funding'],
              ].map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label>{label}</label>
                  <select
                    className="form-control"
                    value={committeeReview[key] || ''}
                    onChange={(e) => setCommitteeReview((p) => ({ ...p, [key]: e.target.value }))}
                  >
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}
              <div className="form-group">
                <label>Comments</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={committeeReview.comments || ''}
                  onChange={(e) => setCommitteeReview((p) => ({ ...p, comments: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingCommittee}>
                {savingCommittee ? 'Saving...' : 'Save Committee Review'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewPublicationFunding;
