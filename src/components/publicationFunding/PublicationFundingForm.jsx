import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createPublicationFunding,
  updatePublicationFunding,
  getPublicationFunding,
  submitPublicationFundingForReview,
} from '../../utils/api';
import UserMenu from '../UserMenu';
import '../SubmissionForm.css';
import {
  PF_STEPS,
  createInitialFormData,
  ELIGIBILITY_ITEMS,
  ATTACHMENT_ITEMS,
  FUNDING_ITEMS,
} from './formData.js';
import {
  sanitizeFormData,
  getFileName,
  validateStep,
  validateEntireForm,
} from './formHelpers.js';

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="radio-group">
      {options.map((opt) => (
        <label key={opt} className="radio-label">
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function FileUploadField({ field, files, onAdd, onRemove, accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png' }) {
  return (
    <div className="form-group">
      <div
        className="file-upload"
        onClick={() => document.getElementById(`file-${field}`)?.click()}
      >
        <input
          id={`file-${field}`}
          type="file"
          multiple
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => onAdd(field, e.target.files)}
        />
        <p>Click to upload or drag files here</p>
        <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>PDF, DOC, DOCX, JPG, PNG (max 5 files)</p>
      </div>
      {files?.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={index}>
              {getFileName(file)}
              <button type="button" className="btn-remove-file" onClick={() => onRemove(field, index)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PublicationFundingForm({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData(user));

  useEffect(() => {
    if (id) {
      loadApplication();
    } else {
      const saved = localStorage.getItem('publicationFundingFormAutoSave');
      if (saved) {
        try {
          setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setAutoSaveStatus('Saving...');
      const t = setTimeout(() => {
        localStorage.setItem('publicationFundingFormAutoSave', JSON.stringify(sanitizeFormData(formData)));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [formData, id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const loadApplication = async () => {
    try {
      const app = await getPublicationFunding(id);
      if (app.formData) {
        setFormData((prev) => ({
          ...prev,
          ...app.formData,
          fundingItems: app.formData.fundingItems || prev.fundingItems,
          eligibilityChecklist: app.formData.eligibilityChecklist || prev.eligibilityChecklist,
          attachmentChecklist: app.formData.attachmentChecklist || prev.attachmentChecklist,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFundingItemChange = (key, subField, value) => {
    setFormData((prev) => ({
      ...prev,
      fundingItems: {
        ...prev.fundingItems,
        [key]: { ...prev.fundingItems[key], [subField]: value },
      },
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => ({
      ...prev,
      applicantRole: prev.applicantRole.includes(role)
        ? prev.applicantRole.filter((r) => r !== role)
        : [...prev.applicantRole, role],
    }));
  };

  const handleChecklistToggle = (group, key) => {
    setFormData((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] },
    }));
  };

  const handleFileChange = (field, fileList) => {
    const arr = Array.from(fileList || []);
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ...arr].slice(0, 5),
    }));
  };

  const removeFile = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const buildPayload = (status = 'draft') => ({
    manuscriptTitle: formData.manuscriptTitle,
    applicantName: formData.fullName,
    formData,
    status,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await updatePublicationFunding(id, buildPayload());
      } else {
        const created = await createPublicationFunding(buildPayload());
        localStorage.removeItem('publicationFundingFormAutoSave');
        navigate(`/publication-funding/${created._id || created.id}/edit`);
      }
      alert('Draft saved successfully!');
    } catch {
      alert('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      if (id) {
        await updatePublicationFunding(id, buildPayload());
        await submitPublicationFundingForReview(id);
      } else {
        const created = await createPublicationFunding(buildPayload());
        await submitPublicationFundingForReview(created._id || created.id);
      }
      localStorage.removeItem('publicationFundingFormAutoSave');
      navigate('/dashboard');
    } catch {
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep, formData)) {
      setCurrentStep((s) => Math.min(s + 1, PF_STEPS.length));
    } else {
      alert('Please fill in all required fields before proceeding.');
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Section 1: Applicant Information</h3>
      <p className="form-intro">Please complete all applicable sections and attach required supporting documents.</p>
      {[
        ['fullName', 'Full name', 'text'],
        ['department', 'Department / Unit', 'text'],
        ['position', 'Position / Title', 'text'],
        ['email', 'Email address', 'email'],
        ['phone', 'Phone number', 'tel'],
        ['principalInvestigator', 'Principal Investigator (if different from applicant)', 'text'],
      ].map(([key, label, type]) => (
        <div className="form-group" key={key}>
          <label htmlFor={key}>{label}{key !== 'principalInvestigator' && <span className="required"> *</span>}</label>
          <input
            id={key}
            type={type}
            className="form-control"
            value={formData[key]}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>Section 2: Publication Information</h3>
      {[
        ['manuscriptTitle', 'Manuscript title'],
        ['journalName', 'Journal name'],
      ].map(([key, label]) => (
        <div className="form-group" key={key}>
          <label htmlFor={key}>{label} <span className="required">*</span></label>
          <input id={key} className="form-control" value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
        </div>
      ))}
      <div className="form-row">
        <div className="form-group">
          <label>Date of acceptance <span className="required">*</span></label>
          <input type="date" className="form-control" value={formData.dateOfAcceptance} onChange={(e) => handleChange('dateOfAcceptance', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date of publication (if already published)</label>
          <input type="date" className="form-control" value={formData.dateOfPublication} onChange={(e) => handleChange('dateOfPublication', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>DOI / article link</label>
        <input className="form-control" value={formData.doiOrLink} onChange={(e) => handleChange('doiOrLink', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Front page or research article (attachment)</label>
        <FileUploadField field="frontPageOrArticleFiles" files={formData.frontPageOrArticleFiles} onAdd={handleFileChange} onRemove={removeFile} />
      </div>
      <div className="form-group">
        <label>Scopus indexed <span className="required">*</span></label>
        <RadioGroup name="scopus" value={formData.scopusIndexed} onChange={(v) => handleChange('scopusIndexed', v)} options={['Yes', 'No']} />
      </div>
      <div className="form-group">
        <label>Journal quartile <span className="required">*</span></label>
        <RadioGroup name="quartile" value={formData.journalQuartile} onChange={(v) => handleChange('journalQuartile', v)} options={['Q1', 'Q2', 'Other']} />
      </div>
      <div className="form-group">
        <label>Impact factor</label>
        <input className="form-control" value={formData.impactFactor} onChange={(e) => handleChange('impactFactor', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Source of quartile / impact factor data <span className="required">*</span></label>
        <RadioGroup
          name="quartileSource"
          value={formData.quartileSource}
          onChange={(v) => handleChange('quartileSource', v)}
          options={['Scimago Journal Rank', 'Journal Citation Reports', 'Other']}
        />
        {formData.quartileSource === 'Other' && (
          <input className="form-control" style={{ marginTop: '0.5rem' }} placeholder="Specify" value={formData.quartileSourceOther} onChange={(e) => handleChange('quartileSourceOther', e.target.value)} />
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Section 3: Authorship and Affiliation</h3>
      <div className="form-group">
        <label>Applicant role in the manuscript <span className="required">*</span></label>
        {['First author', 'Corresponding author'].map((role) => (
          <label key={role} className="checkbox-label">
            <input type="checkbox" checked={formData.applicantRole.includes(role)} onChange={() => handleRoleToggle(role)} />
            {role}
          </label>
        ))}
      </div>
      <div className="form-group">
        <label>Is Medical City for Military &amp; Security Services clearly stated as an institutional affiliation? <span className="required">*</span></label>
        <RadioGroup name="mcmss" value={formData.mcmssAffiliationStated} onChange={(v) => handleChange('mcmssAffiliationStated', v)} options={['Yes', 'No']} />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h3>Section 4: Type of Publication</h3>
      <p>Please select one:</p>
      {[
        'Original research article',
        'Systematic review / meta-analysis',
        'Clinical trial',
        'Large observational or registry study',
        'Translational or experimental study with human relevance',
        'Other',
      ].map((type) => (
        <label key={type} className="radio-label">
          <input type="radio" name="pubType" checked={formData.publicationType === type} onChange={() => handleChange('publicationType', type)} />
          {type}
        </label>
      ))}
      {formData.publicationType === 'Other' && (
        <>
          <div className="form-group">
            <label>Please specify <span className="required">*</span></label>
            <input className="form-control" value={formData.publicationTypeOther} onChange={(e) => handleChange('publicationTypeOther', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Explain why the publication should be considered eligible <span className="required">*</span></label>
            <textarea className="form-control" rows={4} value={formData.publicationTypeOtherExplanation} onChange={(e) => handleChange('publicationTypeOtherExplanation', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content">
      <h3>Section 5: Ethical and Administrative Compliance</h3>
      <div className="form-group">
        <label>Does the study have prior ethical approval? <span className="required">*</span></label>
        <RadioGroup name="ethics" value={formData.priorEthicalApproval} onChange={(v) => handleChange('priorEthicalApproval', v)} options={['Yes', 'No', 'Not applicable']} />
      </div>
      {formData.priorEthicalApproval === 'Yes' && (
        <>
          <div className="form-group">
            <label>IRB / ethics approval number <span className="required">*</span></label>
            <input className="form-control" value={formData.irbApprovalNumber} onChange={(e) => handleChange('irbApprovalNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Approving institution / committee <span className="required">*</span></label>
            <input className="form-control" value={formData.approvingInstitution} onChange={(e) => handleChange('approvingInstitution', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date of approval <span className="required">*</span></label>
            <input type="date" className="form-control" value={formData.ethicsApprovalDate} onChange={(e) => handleChange('ethicsApprovalDate', e.target.value)} />
          </div>
        </>
      )}
      {formData.priorEthicalApproval === 'No' && (
        <div className="form-group">
          <label>If ethical approval was not required, state the reason <span className="required">*</span></label>
          <RadioGroup
            name="ethicsReason"
            value={formData.ethicsNotRequiredReason}
            onChange={(v) => handleChange('ethicsNotRequiredReason', v)}
            options={['Systematic review', 'Publicly available registry data', 'Other']}
          />
          {formData.ethicsNotRequiredReason === 'Other' && (
            <input className="form-control" style={{ marginTop: '0.5rem' }} value={formData.ethicsNotRequiredOther} onChange={(e) => handleChange('ethicsNotRequiredOther', e.target.value)} />
          )}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="step-content">
      <h3>Section 6: Funding Request Details</h3>
      <table className="table funding-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Requested (Yes/No)</th>
            <th>Amount (OMR)</th>
          </tr>
        </thead>
        <tbody>
          {FUNDING_ITEMS.map(({ key, label, hasSpecify }) => (
            <tr key={key}>
              <td>
                {label}
                {hasSpecify && (
                  <input
                    className="form-control"
                    style={{ marginTop: '0.5rem' }}
                    placeholder="Specify"
                    value={formData.fundingItems[key].specify || ''}
                    onChange={(e) => handleFundingItemChange(key, 'specify', e.target.value)}
                  />
                )}
              </td>
              <td>
                <select
                  className="form-control"
                  value={formData.fundingItems[key].requested}
                  onChange={(e) => handleFundingItemChange(key, 'requested', e.target.value)}
                >
                  <option value="">—</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.fundingItems[key].amount}
                  onChange={(e) => handleFundingItemChange(key, 'amount', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-group">
        <label>Total requested amount (OMR) <span className="required">*</span></label>
        <input className="form-control" value={formData.totalRequestedAmount} onChange={(e) => handleChange('totalRequestedAmount', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Date of payment <span className="required">*</span></label>
        <input type="date" className="form-control" value={formData.dateOfPayment} onChange={(e) => handleChange('dateOfPayment', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Proof of payment (attachment)</label>
        <FileUploadField field="proofOfPaymentFiles" files={formData.proofOfPaymentFiles} onAdd={handleFileChange} onRemove={removeFile} />
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="step-content">
      <h3>Section 7: Eligibility Checklist</h3>
      <p>Please confirm the following (all required):</p>
      {ELIGIBILITY_ITEMS.map(({ key, label }) => (
        <label key={key} className="checkbox-label block">
          <input
            type="checkbox"
            checked={!!formData.eligibilityChecklist[key]}
            onChange={() => handleChecklistToggle('eligibilityChecklist', key)}
          />
          {label}
        </label>
      ))}
    </div>
  );

  const renderStep8 = () => (
    <div className="step-content">
      <h3>Section 8: Required Attachments</h3>
      {ATTACHMENT_ITEMS.map(({ key, label, files }) => (
        <div key={key} className="attachment-block">
          <label className="checkbox-label block">
            <input
              type="checkbox"
              checked={!!formData.attachmentChecklist[key]}
              onChange={() => handleChecklistToggle('attachmentChecklist', key)}
            />
            {label}
          </label>
          {formData.attachmentChecklist[key] && (
            <FileUploadField field={files} files={formData[files]} onAdd={handleFileChange} onRemove={removeFile} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep9 = () => (
    <div className="step-content">
      <h3>Section 9: Applicant Declaration</h3>
      <div className="terms-box">
        <p>
          The undersigned confirms that the information provided in this application is accurate and complete,
          that the publication meets the institutional criteria for research publication funding, and that all
          supporting documents submitted are valid. The applicant understands that funding is considered only after
          manuscript acceptance, reimbursement is subject to approval, and additional post-publication requirements may apply.
        </p>
      </div>
      {[
        ['applicantDeclarationName', 'Applicant name'],
        ['applicantSignature', 'Signature'],
      ].map(([key, label]) => (
        <div className="form-group" key={key}>
          <label>{label} <span className="required">*</span></label>
          <input className="form-control" value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
        </div>
      ))}
      <div className="form-group">
        <label>Date <span className="required">*</span></label>
        <input type="date" className="form-control" value={formData.applicantDeclarationDate} onChange={(e) => handleChange('applicantDeclarationDate', e.target.value)} />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      case 9: return renderStep9();
      default: return null;
    }
  };

  return (
    <div className="app-page">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <h1>Publication Funding Application</h1>
            <span className="header-subtitle">Research publication reimbursement</span>
          </div>
          <div className="header-user">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <p className="form-subtitle">Please complete all applicable sections and attach the required supporting documents.</p>

          <div className="step-indicator">
            {PF_STEPS.map((step) => (
              <div
                key={step.id}
                className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              >
                <div className="step-number">{step.id}</div>
                <div className="step-label">{step.title}</div>
              </div>
            ))}
          </div>

          {renderStepContent()}

          <div className="form-navigation">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {currentStep > 1 && (
                <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep((s) => s - 1)}>
                  ← Back
                </button>
              )}
              {!id && autoSaveStatus && (
                <span style={{ fontSize: '0.875rem', color: '#28a745', fontStyle: 'italic' }}>{autoSaveStatus}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              {currentStep < PF_STEPS.length ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>Next →</button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={loading}
                  onClick={() => {
                    if (!validateEntireForm(formData, PF_STEPS.length)) {
                      alert('Please complete all required fields in every section.');
                      return;
                    }
                    setShowConfirmModal(true);
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Submission</h3>
            <p>Submit this publication funding application for committee review?</p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSubmit} disabled={loading}>Confirm Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicationFundingForm;
