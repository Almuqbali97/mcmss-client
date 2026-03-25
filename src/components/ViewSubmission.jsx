import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmission, updateFieldComments } from '../utils/api';
import UserMenu from './UserMenu';
import './ViewSubmission.css';

const SECTION7_FIELDS = [
  { key: 'introduction', label: 'Introduction' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'targetPopulation', label: 'Target Population' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'statisticalAnalysis', label: 'Statistical Analysis' },
  { key: 'intervention', label: 'Intervention' },
  { key: 'expectedOutcomes', label: 'Expected Outcomes' },
  { key: 'references', label: 'References' },
];

function ViewSubmission({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldComments, setFieldComments] = useState({});
  const [savingComments, setSavingComments] = useState(false);
  const [commentsSaved, setCommentsSaved] = useState(false);

  const canComment = (user?.role === 'reviewer' || user?.role === 'admin') && submission?.status === 'under_review';

  useEffect(() => {
    loadSubmission();
  }, [id]);

  useEffect(() => {
    if (submission?.fieldComments) {
      setFieldComments(submission.fieldComments);
    } else {
      setFieldComments({});
    }
  }, [submission?.fieldComments]);

  const loadSubmission = async () => {
    try {
      const data = await getSubmission(id);
      setSubmission(data);
    } catch (error) {
      console.error('Failed to load submission:', error);
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
      month: 'long',
      day: 'numeric'
    });
  };

  const handleSaveFieldComments = async () => {
    setSavingComments(true);
    setCommentsSaved(false);
    try {
      const updated = await updateFieldComments(id, fieldComments);
      setSubmission(updated);
      setCommentsSaved(true);
      setTimeout(() => setCommentsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save field comments:', error);
    } finally {
      setSavingComments(false);
    }
  };

  if (loading) {
    return (
      <div>
        <header className="header">
          <div className="header-content">
            <h1>View Submission</h1>
            <div className="header-user">
              <UserMenu user={user} onLogout={onLogout} />
            </div>
          </div>
        </header>
        <div className="container">
          <div className="loading">Loading submission...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div>
        <header className="header">
          <div className="header-content">
            <h1>View Submission</h1>
            <div className="header-user">
              <UserMenu user={user} onLogout={onLogout} />
            </div>
          </div>
        </header>
        <div className="container">
          <div className="card">
            <div className="empty-state">
              <h3>Submission not found</h3>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formData = submission.formData || {};

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>View Submission</h1>
          <div className="header-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {submission.status === 'draft' && (
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/submission/${id}/edit`)}
                style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
              >
                Edit
              </button>
            )}
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <div className="submission-header">
            <div>
              <h2>{submission.researchTitle || 'Untitled Research'}</h2>
              <p className="submission-meta">
                Submitted: {formatDate(submission.submittedDate)} |
                Status: <span className={getStatusClass(submission.status)}>
                  {submission.status.replace('_', ' ').toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Section 1: Terms and Conditions</h3>
          <div className="section-content">
            <p><strong>Research Title:</strong> {formData.researchTitle || 'N/A'}</p>
            <p><strong>Consent Acknowledged:</strong> {formData.consentAcknowledged ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="card">
          <h3>Section 2: Researcher Details</h3>
          <div className="section-content">
            <h4>Principal Investigator</h4>
            <div className="info-grid">
              <div><strong>Full Name:</strong> {formData.principalInvestigator?.fullName || 'N/A'}</div>
              <div><strong>Job Title:</strong> {formData.principalInvestigator?.jobTitle || 'N/A'}</div>
              <div><strong>Institution:</strong> {formData.principalInvestigator?.institution || 'N/A'}</div>
              <div><strong>Department:</strong> {formData.principalInvestigator?.department || 'N/A'}</div>
              <div><strong>Qualifications:</strong> {formData.principalInvestigator?.qualifications || 'N/A'}</div>
              <div><strong>Telephone:</strong> {formData.principalInvestigator?.telephone || 'N/A'}</div>
              <div><strong>Email:</strong> {formData.principalInvestigator?.email || 'N/A'}</div>
            </div>
            {formData.coInvestigators && formData.coInvestigators.length > 0 && (
              <>
                <h4 style={{ marginTop: '1.5rem' }}>Co-Investigators</h4>
                {formData.coInvestigators.map((coInv, index) => (
                  <div key={index} className="co-investigator-box">
                    <p><strong>Name:</strong> {coInv.name || 'N/A'}</p>
                    <p><strong>Professional Post:</strong> {coInv.post || 'N/A'}</p>
                    <p><strong>Institute & Department:</strong> {coInv.institute || 'N/A'}</p>
                  </div>
                ))}
              </>
            )}
            <p><strong>Masters/PhD Award:</strong> {formData.mastersOrPhd || 'N/A'}</p>
            {formData.mastersOrPhd === 'Yes' && (
              <div className="award-details-view">
                <h4>Award details</h4>
                <p><strong>Research student (Masters/PhD):</strong> {formData.researchStudent || 'N/A'}</p>
                <p><strong>Supervisor's name:</strong> {formData.supervisorName || 'N/A'}</p>
                <p><strong>Supervisor's signature:</strong> {formData.supervisorSignature || 'N/A'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Section 3: Project Description</h3>
          <div className="section-content">
            <p><strong>Research Type:</strong> {formData.researchType?.join(', ') || 'N/A'}</p>
            <p><strong>Data Collection Type:</strong> {formData.dataCollectionType || 'N/A'}</p>
            <p><strong>Information Sheet:</strong> {formData.informationSheet || 'N/A'}</p>
            {formData.informationSheetFiles && formData.informationSheetFiles.length > 0 && (
              <div>
                <strong>Information Sheet Files:</strong>
                <ul>
                  {formData.informationSheetFiles.map((file, index) => (
                    <li key={index}>{file?.name || file?._fileMeta?.name || file}</li>
                  ))}
                </ul>
              </div>
            )}
            {formData.consentFormFiles && formData.consentFormFiles.length > 0 && (
              <div>
                <strong>Consent Form Files:</strong>
                <ul>
                  {formData.consentFormFiles.map((file, index) => (
                    <li key={index}>{file?.name || file?._fileMeta?.name || file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Section 4: Confidential Information & Project Details</h3>
          <div className="section-content">
            <p><strong>Data Capturing Methods:</strong> {formData.dataCapturingMethods || 'N/A'}</p>
            <p><strong>Data Storage Mode:</strong> {formData.dataStorageMode || 'N/A'}</p>
            <p><strong>Data Access:</strong> {formData.dataAccess || 'N/A'}</p>
            <p><strong>Confidentiality Measures:</strong> {formData.confidentialityMeasures || 'N/A'}</p>
            <p><strong>Proposed Start Date:</strong> {formData.proposedStartDate || 'N/A'}</p>
            <p><strong>Duration:</strong> {formData.duration ? `${formData.duration} months` : 'N/A'}</p>
            <p><strong>Multi-center Research:</strong> {formData.multiCenterResearch || 'N/A'}</p>
            {formData.multiCenterResearch === 'Yes' &&
              formData.affiliatedCenters &&
              formData.affiliatedCenters.length > 0 && (
                <>
                  <h4 style={{ marginTop: '1rem' }}>Affiliated Centers</h4>
                  {formData.affiliatedCenters.map((center, index) => (
                    <div key={index} className="co-investigator-box">
                      <p><strong>Center {index + 1} — Name:</strong> {center.name || 'N/A'}</p>
                      <p><strong>Country of Affiliation:</strong> {center.country || 'N/A'}</p>
                    </div>
                  ))}
                </>
              )}
            <p><strong>Funding Source:</strong> {formData.fundingSource || 'N/A'}</p>
            {formData.fundingSource === 'Other' && (
              <p><strong>Other Funding Source:</strong> {formData.fundingOther || 'N/A'}</p>
            )}
            {formData.grantSum && (
              <>
                <p><strong>Grant Sum:</strong> {formData.grantSum}</p>
                <p><strong>Grant Start Date:</strong> {formData.grantStartDate || 'N/A'}</p>
                <p><strong>Grant End Date:</strong> {formData.grantEndDate || 'N/A'}</p>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Section 5: Ethical Considerations</h3>
          <div className="section-content">
            <p><strong>Previous Ethics Approval:</strong> {formData.previousEthicsApproval || 'N/A'}</p>
            <p><strong>Collecting Personal Info:</strong> {formData.collectingPersonalInfo || 'N/A'}</p>
            <p><strong>Collecting from Other Source:</strong> {formData.collectingFromOtherSource || 'N/A'}</p>
            <p><strong>Involves Deception:</strong> {formData.involvesDeception || 'N/A'}</p>
            <p><strong>Intend to Publish:</strong> {formData.intendToPublish || 'N/A'}</p>
            <p><strong>Blood/Tissue Samples:</strong> {formData.bloodTissueSamples || 'N/A'}</p>
            {formData.bloodTissueSamples === 'Yes' && (
              <div className="award-details-view" style={{ marginTop: '0.75rem' }}>
                <p><strong>Number of samples:</strong> {formData.bloodTissueNumberOfSamples || 'N/A'}</p>
                <p><strong>Type of sample:</strong> {formData.bloodTissueSampleType || 'N/A'}</p>
                <p><strong>Quantity of sample from each subject:</strong> {formData.bloodTissueQuantityPerSubject || 'N/A'}</p>
                <p><strong>Samples analyzed in Oman:</strong> {formData.bloodTissueAnalyzedInOman || 'N/A'}</p>
                {formData.bloodTissueAnalyzedInOman === 'No' && (
                  <>
                    <p><strong>Institution (analysis abroad):</strong> {formData.bloodTissueAbroadInstitution || 'N/A'}</p>
                    <p><strong>Country:</strong> {formData.bloodTissueAbroadCountry || 'N/A'}</p>
                    <p><strong>Discard of samples after analysis:</strong></p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{formData.bloodTissueDiscardExplanation || 'N/A'}</p>
                    {formData.bloodTissueAbroadDocuments && formData.bloodTissueAbroadDocuments.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>Supporting documents:</strong>
                        <ul>
                          {formData.bloodTissueAbroadDocuments.map((file, index) => (
                            <li key={index}>{file?.name || file?._fileMeta?.name || file}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Section 6: Declaration</h3>
          <div className="section-content">
            <p><strong>PI Name:</strong> {formData.piName || 'N/A'}</p>
            <p><strong>Signature:</strong> {formData.piSignature || 'N/A'}</p>
            <p><strong>Date:</strong> {formData.declarationDate || 'N/A'}</p>
          </div>
        </div>

        <div className="card">
          <h3>Section 7: Research Proposal</h3>
          <div className="section-content">
            {SECTION7_FIELDS.map(({ key, label }) => (
              <div key={key} className="field-with-comment">
                <div><strong>{label}:</strong></div>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>{formData[key] || 'N/A'}</p>
                {canComment && (
                  <div className="field-comment-input">
                    <label>Your comment on {label}</label>
                    <textarea
                      className="form-control"
                      value={fieldComments[key] || ''}
                      onChange={(e) => setFieldComments(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Add comment for ${label}...`}
                      rows={2}
                    />
                  </div>
                )}
                {!canComment && fieldComments[key] && (
                  <div className="field-comment-display">
                    <strong>Reviewer comment:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', marginBottom: '1rem' }}>{fieldComments[key]}</p>
                  </div>
                )}
                {!canComment && !fieldComments[key] && <div style={{ marginBottom: '1rem' }} />}
              </div>
            ))}
            {canComment && (
              <div className="field-comments-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveFieldComments}
                  disabled={savingComments}
                >
                  {savingComments ? 'Saving...' : commentsSaved ? 'Saved' : 'Save field comments'}
                </button>
              </div>
            )}
            {formData.sampleSizeFiles && formData.sampleSizeFiles.length > 0 && (
              <div>
                <strong>Sample Size Calculation Files:</strong>
                <ul>
                  {formData.sampleSizeFiles.map((file, index) => (
                    <li key={index}>{file?.name || file?._fileMeta?.name || file}</li>
                  ))}
                </ul>
              </div>
            )}
            {formData.researchProposalFiles && formData.researchProposalFiles.length > 0 && (
              <div>
                <strong>Research Proposal Files:</strong>
                <ul>
                  {formData.researchProposalFiles.map((file, index) => (
                    <li key={index}>{file?.name || file?._fileMeta?.name || file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {submission.reviewComments && (
          <div className="card">
            <h3>Review Comments</h3>
            <div className="section-content">
              <p style={{ whiteSpace: 'pre-wrap' }}>{submission.reviewComments}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewSubmission;
