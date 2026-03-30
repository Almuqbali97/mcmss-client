import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSubmission, updateSubmission, getSubmission, submitForReview } from '../utils/api';
import UserMenu from './UserMenu';
import './SubmissionForm.css';

const STEPS = [
  { id: 1, title: 'Terms & Conditions', section: 'section1' },
  { id: 2, title: 'Researcher Details', section: 'section2' },
  { id: 3, title: 'Project Description', section: 'section3' },
  { id: 4, title: 'Confidential Information', section: 'section4' },
  { id: 5, title: 'Ethical Considerations', section: 'section5' },
  { id: 6, title: 'Declaration', section: 'section6' },
  { id: 7, title: 'Research Proposal', section: 'section7' },
];

const RESEARCH_TYPES = [
  'Epidemiological Study',
  'Medical records',
  'Surgical Procedures',
  'Medical Imaging',
  'Social & Psychological',
  'Pharmaceutical',
  'Nutrition',
  'Biological Samples',
  'Medical Devices',
  'Other'
];

const FUNDING_SOURCES = [
  'Self-Funding',
  'MCMSS research grant',
  'MOH grant',
  'SQU research grant',
  'TRC research grant',
  'Industry',
  'Other'
];

const ETHICS_APPROVAL_MAX_FILE_BYTES = 100 * 1024 * 1024;

function countWords(text) {
  if (!text || !String(text).trim()) return 0;
  return String(text).trim().split(/\s+/).length;
}

function limitWords(text, maxWords) {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

function SubmissionForm({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [showMCMSSModal, setShowMCMSSModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [formData, setFormData] = useState({
    researchTitle: '',
    consentAcknowledged: false,
    principalInvestigator: {
      fullName: '',
      jobTitle: '',
      institution: '',
      hospital: '',
      department: '',
      qualifications: '',
      telephone: '',
      email: user?.email || '',
      isFromMCMSS: ''
    },
    coInvestigatorsCount: '1',
    coInvestigators: [{ name: '', post: '', institute: '' }],
    mastersOrPhd: '',
    researchStudent: '',
    supervisorName: '',
    supervisorSignature: '',
    researchType: [],
    dataCollectionType: '',
    informationSheet: '',
    researcherContactName: '',
    researcherContactDepartment: '',
    researcherContactTelephone: '',
    researcherContactEmail: '',
    informationSheetFiles: [],
    consentFormFiles: [],
    dataCapturingMethods: '',
    dataStorageMode: '',
    dataAccess: '',
    confidentialityMeasures: '',
    proposedStartDate: '',
    duration: '',
    multiCenterResearch: '',
    affiliatedCentersCount: '1',
    affiliatedCenters: [{ name: '', country: '' }],
    fundingSource: '',
    fundingOther: '',
    grantSum: '',
    grantStartDate: '',
    grantEndDate: '',
    grantDocuments: [],
    previousEthicsApproval: '',
    previousEthicsApplicationDate: '',
    previousEthicsProjectApproved: '',
    ethicsApprovalDocuments: [],
    collectingPersonalInfo: '',
    collectingFromOtherSource: '',
    intendPublishPersonalInfoFromOtherSource: '',
    publishPersonalInfoFromOtherSourceDetails: '',
    involvesDeception: '',
    deceptionDebriefingProcedures: '',
    intendToPublish: '',
    bloodTissueSamples: '',
    bloodTissueNumberOfSamples: '',
    bloodTissueSampleType: '',
    bloodTissueQuantityPerSubject: '',
    bloodTissueAnalyzedInOman: '',
    bloodTissueAbroadInstitution: '',
    bloodTissueAbroadCountry: '',
    bloodTissueDiscardExplanation: '',
    bloodTissueAbroadDocuments: [],
    piName: '',
    piSignature: '',
    declarationDate: '',
    introduction: '',
    objectives: '',
    targetPopulation: '',
    methodology: '',
    sampleSizeFiles: [],
    statisticalAnalysis: '',
    intervention: '',
    dataVariablesFiles: [],
    expectedOutcomes: '',
    references: '',
    researchProposalFiles: []
  });

  useEffect(() => {
    if (id) {
      loadSubmission();
    } else {
      // Load auto-saved data from localStorage for new submissions
      const autoSaved = localStorage.getItem('submissionFormAutoSave');
      if (autoSaved) {
        try {
          const savedData = JSON.parse(autoSaved);
          setFormData((prev) => ({
            ...prev,
            ...savedData,
            affiliatedCentersCount: savedData.affiliatedCentersCount || '1',
            affiliatedCenters:
              Array.isArray(savedData.affiliatedCenters) && savedData.affiliatedCenters.length > 0
                ? savedData.affiliatedCenters
                : [{ name: '', country: '' }],
            bloodTissueNumberOfSamples: savedData.bloodTissueNumberOfSamples ?? '',
            bloodTissueSampleType: savedData.bloodTissueSampleType ?? '',
            bloodTissueQuantityPerSubject: savedData.bloodTissueQuantityPerSubject ?? '',
            bloodTissueAnalyzedInOman: savedData.bloodTissueAnalyzedInOman ?? '',
            bloodTissueAbroadInstitution: savedData.bloodTissueAbroadInstitution ?? '',
            bloodTissueAbroadCountry: savedData.bloodTissueAbroadCountry ?? '',
            bloodTissueDiscardExplanation: savedData.bloodTissueDiscardExplanation ?? '',
            bloodTissueAbroadDocuments: Array.isArray(savedData.bloodTissueAbroadDocuments)
              ? savedData.bloodTissueAbroadDocuments
              : [],
            ethicsApprovalDocuments: Array.isArray(savedData.ethicsApprovalDocuments)
              ? savedData.ethicsApprovalDocuments
              : [],
            intendPublishPersonalInfoFromOtherSource:
              savedData.intendPublishPersonalInfoFromOtherSource ?? '',
            publishPersonalInfoFromOtherSourceDetails:
              savedData.publishPersonalInfoFromOtherSourceDetails ?? '',
            deceptionDebriefingProcedures: savedData.deceptionDebriefingProcedures ?? ''
          }));
        } catch (error) {
          console.error('Failed to load auto-saved data:', error);
        }
      }
    }
  }, [id]);

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    if (!id) { // Only auto-save for new submissions
      setAutoSaveStatus('Saving...');
      const timeoutId = setTimeout(() => {
        localStorage.setItem('submissionFormAutoSave', JSON.stringify(sanitizeFormData(formData)));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 1000); // Debounce: save 1 second after last change

      return () => clearTimeout(timeoutId);
    }
  }, [formData, id]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Section 6 declaration PI name mirrors Section 2 Principal Investigator full name
  useEffect(() => {
    const fullName = formData.principalInvestigator?.fullName ?? '';
    setFormData((prev) => {
      if (prev.piName === fullName) return prev;
      return { ...prev, piName: fullName };
    });
  }, [formData.principalInvestigator?.fullName]);

  // Clear auto-save when form is submitted
  const clearAutoSave = () => {
    localStorage.removeItem('submissionFormAutoSave');
  };

  const loadSubmission = async () => {
    try {
      const submission = await getSubmission(id);
      if (submission.formData) {
        const fd = submission.formData;
        setFormData({
          ...fd,
          affiliatedCentersCount: fd.affiliatedCentersCount || '1',
          affiliatedCenters:
            Array.isArray(fd.affiliatedCenters) && fd.affiliatedCenters.length > 0
              ? fd.affiliatedCenters
              : [{ name: '', country: '' }],
          bloodTissueNumberOfSamples: fd.bloodTissueNumberOfSamples ?? '',
          bloodTissueSampleType: fd.bloodTissueSampleType ?? '',
          bloodTissueQuantityPerSubject: fd.bloodTissueQuantityPerSubject ?? '',
          bloodTissueAnalyzedInOman: fd.bloodTissueAnalyzedInOman ?? '',
          bloodTissueAbroadInstitution: fd.bloodTissueAbroadInstitution ?? '',
          bloodTissueAbroadCountry: fd.bloodTissueAbroadCountry ?? '',
          bloodTissueDiscardExplanation: fd.bloodTissueDiscardExplanation ?? '',
          bloodTissueAbroadDocuments: Array.isArray(fd.bloodTissueAbroadDocuments)
            ? fd.bloodTissueAbroadDocuments
            : [],
          previousEthicsApplicationDate: fd.previousEthicsApplicationDate ?? '',
          previousEthicsProjectApproved: fd.previousEthicsProjectApproved ?? '',
          ethicsApprovalDocuments: Array.isArray(fd.ethicsApprovalDocuments)
            ? fd.ethicsApprovalDocuments
            : [],
          intendPublishPersonalInfoFromOtherSource:
            fd.intendPublishPersonalInfoFromOtherSource ?? '',
          publishPersonalInfoFromOtherSourceDetails:
            fd.publishPersonalInfoFromOtherSourceDetails ?? '',
          deceptionDebriefingProcedures: fd.deceptionDebriefingProcedures ?? ''
        });
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    }
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCheckboxChange = (field, value, checked) => {
    if (field === 'researchType') {
      setFormData(prev => ({
        ...prev,
        researchType: checked
          ? [...prev.researchType, value]
          : prev.researchType.filter(t => t !== value)
      }));
    }
  };

  const handleFileChange = (field, files) => {
    const fileArray = Array.from(files);
    const maxFiles = 5;
    setFormData(prev => {
      const existing = prev[field] || [];
      const combined = [...existing, ...fileArray].slice(0, maxFiles);
      return { ...prev, [field]: combined };
    });
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleEthicsApprovalFiles = (files) => {
    const fileArray = Array.from(files || []);
    const valid = [];
    for (const f of fileArray) {
      if (f.size > ETHICS_APPROVAL_MAX_FILE_BYTES) {
        alert(`File "${f.name}" exceeds 100 MB and was not added.`);
        continue;
      }
      valid.push(f);
    }
    setFormData((prev) => {
      const existing = prev.ethicsApprovalDocuments || [];
      return { ...prev, ethicsApprovalDocuments: [...existing, ...valid].slice(0, 5) };
    });
  };

  const addCoInvestigator = () => {
    setFormData(prev => ({
      ...prev,
      coInvestigators: [...prev.coInvestigators, { name: '', post: '', institute: '' }]
    }));
  };

  const updateCoInvestigator = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      coInvestigators: prev.coInvestigators.map((ci, i) =>
        i === index ? { ...ci, [field]: value } : ci
      )
    }));
  };

  const updateAffiliatedCenter = (index, field, value) => {
    setFormData(prev => {
      const list = prev.affiliatedCenters || [{ name: '', country: '' }];
      return {
        ...prev,
        affiliatedCenters: list.map((c, i) =>
          i === index ? { ...c, [field]: value } : c
        )
      };
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.researchTitle && formData.consentAcknowledged;
      case 2:
        const pi = formData.principalInvestigator;
        const baseValid = pi.fullName && pi.jobTitle && pi.hospital && pi.department &&
          pi.qualifications && pi.telephone && pi.email && pi.isFromMCMSS === 'Yes' &&
          formData.mastersOrPhd;
        if (formData.mastersOrPhd === 'Yes') {
          return baseValid && formData.researchStudent && formData.supervisorName && formData.supervisorSignature;
        }
        return baseValid;
      case 3: {
        const base = formData.researchType.length > 0 && formData.dataCollectionType;
        if (!base) return false;
        let project = formData.proposedStartDate && formData.duration && formData.multiCenterResearch && formData.fundingSource;
        if (project && formData.multiCenterResearch === 'Yes') {
          const num = formData.affiliatedCentersCount === '5 or more' ? 5 : parseInt(formData.affiliatedCentersCount || '1', 10);
          const list = formData.affiliatedCenters || [{ name: '', country: '' }];
          for (let i = 0; i < num; i++) {
            const c = list[i];
            if (!c?.name?.trim() || !c?.country?.trim()) {
              project = false;
              break;
            }
          }
        }
        if (formData.fundingSource === 'Other') {
          if (!formData.fundingOther) return false;
        }
        if (formData.fundingSource && formData.fundingSource !== 'Self-Funding') {
          if (!formData.grantSum || !formData.grantStartDate || !formData.grantEndDate || formData.grantDocuments.length === 0) return false;
        }
        if (formData.dataCollectionType === 'Prospective') {
          return project &&
            formData.researcherContactName && formData.researcherContactDepartment &&
            formData.researcherContactTelephone && formData.researcherContactEmail &&
            formData.informationSheetFiles.length > 0 && formData.consentFormFiles.length > 0;
        }
        return project;
      }
      case 4:
        return formData.dataCapturingMethods && formData.dataStorageMode &&
          formData.dataAccess && formData.confidentialityMeasures;
      case 5: {
        const base5 = formData.previousEthicsApproval && formData.collectingPersonalInfo &&
          formData.collectingFromOtherSource && formData.involvesDeception &&
          formData.intendToPublish && formData.bloodTissueSamples;
        if (!base5) return false;
        if (formData.previousEthicsApproval === 'Yes') {
          if (
            !formData.previousEthicsApplicationDate ||
            !formData.previousEthicsProjectApproved ||
            !formData.ethicsApprovalDocuments?.length
          ) {
            return false;
          }
        }
        if (formData.collectingFromOtherSource === 'Yes') {
          if (!formData.intendPublishPersonalInfoFromOtherSource) return false;
          if (
            formData.intendPublishPersonalInfoFromOtherSource === 'Yes' &&
            !formData.publishPersonalInfoFromOtherSourceDetails?.trim()
          ) {
            return false;
          }
        }
        if (formData.involvesDeception === 'Yes' && !formData.deceptionDebriefingProcedures?.trim()) {
          return false;
        }
        if (formData.bloodTissueSamples === 'Yes') {
          if (
            !formData.bloodTissueNumberOfSamples?.trim() ||
            !formData.bloodTissueSampleType?.trim() ||
            !formData.bloodTissueQuantityPerSubject?.trim()
          ) {
            return false;
          }
          if (!formData.bloodTissueAnalyzedInOman) return false;
          if (formData.bloodTissueAnalyzedInOman === 'No') {
            return !!(
              formData.bloodTissueAbroadInstitution?.trim() &&
              formData.bloodTissueAbroadCountry?.trim() &&
              formData.bloodTissueDiscardExplanation?.trim() &&
              (formData.bloodTissueAbroadDocuments?.length > 0)
            );
          }
        }
        return true;
      }
      case 6:
        return (
          !!formData.principalInvestigator?.fullName?.trim() &&
          formData.piSignature &&
          formData.declarationDate
        );
      case 7:
        return formData.introduction?.trim() &&
          countWords(formData.introduction) <= 500 &&
          formData.objectives && formData.targetPopulation &&
          formData.methodology && formData.statisticalAnalysis && formData.intervention &&
          formData.expectedOutcomes && formData.references;
      default:
        return true;
    }
  };

  const validateEntireForm = () => {
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2 && formData.principalInvestigator.isFromMCMSS === 'No') {
      setShowMCMSSModal(true);
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Please fill in all required fields before proceeding.');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId) => {
    // If trying to go to step 2 and MCMSS is No, show modal
    if (stepId === 2 && formData.principalInvestigator.isFromMCMSS === 'No') {
      setShowMCMSSModal(true);
      return;
    }
    // Allow navigation to any step
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFileName = (file) => file?.name || file?._fileMeta?.name || file?.originalName || 'File';

  // Sanitize formData for JSON serialization (File objects cannot be stringified)
  const sanitizeFormData = (data) => {
    if (!data) return data;
    if (data instanceof File) {
      return { _fileMeta: { name: data.name, size: data.size, type: data.type } };
    }
    if (Array.isArray(data)) {
      return data.map(sanitizeFormData);
    }
    if (typeof data === 'object' && data !== null) {
      const out = {};
      for (const [k, v] of Object.entries(data)) {
        out[k] = sanitizeFormData(v);
      }
      return out;
    }
    return data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const submissionData = {
        researchTitle: formData.researchTitle,
        principalInvestigator: formData.principalInvestigator?.fullName || formData.principalInvestigator || '',
        formData: formData,
        status: 'draft'
      };

      if (id) {
        await updateSubmission(id, submissionData);
      } else {
        const newSubmission = await createSubmission(submissionData);
        clearAutoSave(); // Clear auto-save when manually saved
        navigate(`/submission/${newSubmission._id || newSubmission.id}/edit`);
      }
      alert('Draft saved successfully!');
    } catch (error) {
      alert('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!validateEntireForm()) {
      alert('Please complete all required fields in every section before submitting.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!validateEntireForm()) {
      setShowConfirmModal(false);
      alert('Please complete all required fields in every section before submitting.');
      return;
    }
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const startTime = Date.now();
      const submissionData = {
        researchTitle: formData.researchTitle,
        principalInvestigator: formData.principalInvestigator?.fullName || formData.principalInvestigator || '',
        formData: formData,
      };

      if (id) {
        await updateSubmission(id, { ...submissionData, status: 'draft' });
        await submitForReview(id);
      } else {
        const newSubmission = await createSubmission({ ...submissionData, status: 'draft' });
        await submitForReview(newSubmission._id || newSubmission.id);
      }

      // Ensure minimum loading time of 1.8 seconds
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 1800 - elapsed);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      clearAutoSave(); // Clear auto-save when submitted
      setLoading(false);
      setShowSuccessView(true);
    } catch (error) {
      alert('Failed to submit. Please try again.');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3>Terms and Conditions for Approval of Data Protection</h3>
            <div className="terms-box">
              <ol>
                <li>Personal data shall only be collected and processed for the specific research purpose.</li>
                <li>The data shall be adequate, relevant and not exclusive in relation to the processing purpose.</li>
                <li>All reasonable measures shall be taken to ensure the correctness of personal data.</li>
                <li>Personal data shall not be disclosed to third parties. All necessary measures shall be implemented to ensure confidentiality and where possible, data shall be anonymous.</li>
                <li>Unless otherwise authorized by the MCMSS research committee, the researcher shall obtain the consent from the data subject and provide the subject with the following information: the researcher's identity, the purpose of processing and the recipients to whom personal data may be disclosed. The data subject shall also be informed about his/her rights, rectify, and where applicable erase his/her data.</li>
                <li>The data collected will be securely stored in such a way that only those mentioned below will be able to gain access to it. Data obtained as a result of the research will be retained for at least 5 years in secure storage. Any personal information held on the participants (such as contact details, audio or video tapes, after they have been transcribed etc.,) may be destroyed at the completion of the research even though the data derived from the research will, in most cases, be kept for much longer or possibly indefinitely.</li>
                <li><strong>The Principle Investigator should be from the MCMSS.</strong></li>
              </ol>
            </div>
            <div className="form-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consentAcknowledged}
                  onChange={(e) => handleChange('consentAcknowledged', e.target.checked)}
                />
                <label htmlFor="consent">
                  I acknowledge that I have read the above text and agree to what is stated. <span className="required">*</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="researchTitle">
                Research Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="researchTitle"
                className="form-control"
                value={formData.researchTitle}
                onChange={(e) => handleChange('researchTitle', e.target.value)}
                placeholder="Enter the title of your research"
              />
            </div>
          </div>
        );

      case 2:
        const isDisabled = formData.principalInvestigator.isFromMCMSS === 'No';
        return (
          <div className="step-content">
            <h3>Details of Principal Investigator</h3>
            <div className="form-group">
              <label htmlFor="piFullName">Full Name <span className="required">*</span></label>
              <input
                type="text"
                id="piFullName"
                className="form-control"
                value={formData.principalInvestigator.fullName}
                onChange={(e) => handleChange('principalInvestigator.fullName', e.target.value)}
                disabled={isDisabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="piJobTitle">Job Title / Academic Title <span className="required">*</span></label>
              <input
                type="text"
                id="piJobTitle"
                className="form-control"
                value={formData.principalInvestigator.jobTitle}
                onChange={(e) => handleChange('principalInvestigator.jobTitle', e.target.value)}
                disabled={isDisabled}
              />
            </div>
            <div className="form-group">
              <label>Is the Principal Investigator from MCMSS? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="isFromMCMSSYes"
                    name="isFromMCMSS"
                    value="Yes"
                    checked={formData.principalInvestigator.isFromMCMSS === 'Yes'}
                    onChange={(e) => {
                      handleChange('principalInvestigator.isFromMCMSS', e.target.value);
                    }}
                  />
                  <label htmlFor="isFromMCMSSYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="isFromMCMSSNo"
                    name="isFromMCMSS"
                    value="No"
                    checked={formData.principalInvestigator.isFromMCMSS === 'No'}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange('principalInvestigator.isFromMCMSS', value);
                      if (value === 'No') {
                        setShowMCMSSModal(true);
                      }
                    }}
                  />
                  <label htmlFor="isFromMCMSSNo">No</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="piHospital">Hospital <span className="required">*</span></label>
              <select
                id="piHospital"
                className="form-control"
                value={formData.principalInvestigator.hospital}
                onChange={(e) => handleChange('principalInvestigator.hospital', e.target.value)}
                disabled={isDisabled}
              >
                <option value="">Select Hospital</option>
                <option value="Al Qurum">Al Qurum</option>
                <option value="Al Khoudh">Al Khoudh</option>
                <option value="Muscat">Muscat</option>
                <option value="Salalah">Salalah</option>
                <option value="Samail">Samail</option>
                <option value="MAM">MAM</option>
                <option value="Medical City School">Medical City School</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="piDepartment">Department <span className="required">*</span></label>
              <input
                type="text"
                id="piDepartment"
                className="form-control"
                value={formData.principalInvestigator.department}
                onChange={(e) => handleChange('principalInvestigator.department', e.target.value)}
                disabled={isDisabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="piQualifications">Qualifications <span className="required">*</span></label>
              <input
                type="text"
                id="piQualifications"
                className="form-control"
                value={formData.principalInvestigator.qualifications}
                onChange={(e) => handleChange('principalInvestigator.qualifications', e.target.value)}
                disabled={isDisabled}
              />
            </div>
            <div className="form-group">
              <label htmlFor="piTelephone">Mobile <span className="required">*</span></label>
              <div className="phone-input-group">
                <span className="phone-prefix">+968</span>
                <input
                  type="tel"
                  id="piTelephone"
                  className="form-control"
                  placeholder="9XXXXXXX"
                  maxLength={8}
                  value={formData.principalInvestigator.telephone?.replace(/^\+968/, '') || ''}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, '');
                    if (raw.startsWith('968')) raw = raw.slice(3);
                    if (raw === '' || (raw.startsWith('9') && raw.length <= 8)) {
                      const value = raw ? `+968${raw}` : '';
                      handleChange('principalInvestigator.telephone', value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!/\d/.test(e.key)) e.preventDefault();
                    else if (raw.length >= 8) e.preventDefault();
                    else if (raw.length === 0 && e.key !== '9') e.preventDefault();
                  }}
                  disabled={isDisabled}
                />
              </div>
              <small className="form-text text-muted">Omani mobile only (8 digits, starts with 9)</small>
            </div>
            <div className="form-group">
              <label htmlFor="piEmail">Email <span className="required">*</span></label>
              <input
                type="email"
                id="piEmail"
                className="form-control"
                value={formData.principalInvestigator.email}
                onChange={(e) => handleChange('principalInvestigator.email', e.target.value)}
                disabled={isDisabled}
              />
            </div>

            <h3 style={{ marginTop: '2rem' }}>Co-Investigators</h3>
            <div className="form-group">
              <label>How many Co-Investigators are there in the project? <span className="required">*</span></label>
              <div className="radio-group">
                {['1', '2', '3', '4', '5 or more'].map((count) => (
                  <div key={count} className="radio-item">
                    <input
                      type="radio"
                      id={`coCount${count}`}
                      name="coInvestigatorsCount"
                      value={count}
                      checked={formData.coInvestigatorsCount === count}
                      onChange={(e) => {
                        handleChange('coInvestigatorsCount', e.target.value);
                        const num = count === '5 or more' ? 5 : parseInt(count);
                        if (num > formData.coInvestigators.length) {
                          const newCoInvestigators = Array(num - formData.coInvestigators.length)
                            .fill(null)
                            .map(() => ({ name: '', post: '', institute: '' }));
                          setFormData(prev => ({
                            ...prev,
                            coInvestigators: [...prev.coInvestigators, ...newCoInvestigators]
                          }));
                        } else if (num < formData.coInvestigators.length) {
                          setFormData(prev => ({
                            ...prev,
                            coInvestigators: prev.coInvestigators.slice(0, num)
                          }));
                        }
                      }}
                      disabled={isDisabled}
                    />
                    <label htmlFor={`coCount${count}`} style={{ opacity: isDisabled ? 0.5 : 1 }}>{count}</label>
                  </div>
                ))}
              </div>
            </div>

            {formData.coInvestigators.map((coInv, index) => (
              <div key={index} className="co-investigator-section" style={{ opacity: isDisabled ? 0.6 : 1 }}>
                <h4>Co-Investigator {index + 1}</h4>
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={coInv.name}
                    onChange={(e) => updateCoInvestigator(index, 'name', e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
                <div className="form-group">
                  <label>Professional Post</label>
                  <input
                    type="text"
                    className="form-control"
                    value={coInv.post}
                    onChange={(e) => updateCoInvestigator(index, 'post', e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
                <div className="form-group">
                  <label>Institute & Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={coInv.institute}
                    onChange={(e) => updateCoInvestigator(index, 'institute', e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            ))}

            <div className="form-group">
              <label>Is this research being submitted for Masters or PhD award? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="mastersYes"
                    name="mastersOrPhd"
                    value="Yes"
                    checked={formData.mastersOrPhd === 'Yes'}
                    onChange={(e) => handleChange('mastersOrPhd', e.target.value)}
                    disabled={isDisabled}
                  />
                  <label htmlFor="mastersYes" style={{ opacity: isDisabled ? 0.5 : 1 }}>Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="mastersNo"
                    name="mastersOrPhd"
                    value="No"
                    checked={formData.mastersOrPhd === 'No'}
                    onChange={(e) => handleChange('mastersOrPhd', e.target.value)}
                    disabled={isDisabled}
                  />
                  <label htmlFor="mastersNo" style={{ opacity: isDisabled ? 0.5 : 1 }}>No</label>
                </div>
              </div>
            </div>

            {formData.mastersOrPhd === 'Yes' && (
              <div className="award-details-section">
                <h3 style={{ marginTop: '2rem' }}>Award details</h3>
                <div className="form-group">
                  <label htmlFor="researchStudent">1- Research student (Masters/PhD) <span className="required">*</span></label>
                  <input
                    type="text"
                    id="researchStudent"
                    className="form-control"
                    value={formData.researchStudent}
                    onChange={(e) => handleChange('researchStudent', e.target.value)}
                    placeholder="e.g. Masters or PhD"
                    disabled={isDisabled}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="supervisorName">2- Supervisor's name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="supervisorName"
                    className="form-control"
                    value={formData.supervisorName}
                    onChange={(e) => handleChange('supervisorName', e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="supervisorSignature">Supervisor's signature <span className="required">*</span></label>
                  <input
                    type="text"
                    id="supervisorSignature"
                    className="form-control"
                    value={formData.supervisorSignature}
                    onChange={(e) => handleChange('supervisorSignature', e.target.value)}
                    placeholder="Enter supervisor's signature"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3>Project Description</h3>
            <div className="form-group">
              <label>Research Type <span className="required">*</span></label>
              <div className="checkbox-multi">
                {RESEARCH_TYPES.map((type) => (
                  <div key={type} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`researchType${type}`}
                      checked={formData.researchType.includes(type)}
                      onChange={(e) => handleCheckboxChange('researchType', type, e.target.checked)}
                    />
                    <label htmlFor={`researchType${type}`}>{type}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Type of Data Collection <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="prospective"
                    name="dataCollectionType"
                    value="Prospective"
                    checked={formData.dataCollectionType === 'Prospective'}
                    onChange={(e) => handleChange('dataCollectionType', e.target.value)}
                  />
                  <label htmlFor="prospective">Prospective</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="retrospective"
                    name="dataCollectionType"
                    value="Retrospective"
                    checked={formData.dataCollectionType === 'Retrospective'}
                    onChange={(e) => handleChange('dataCollectionType', e.target.value)}
                  />
                  <label htmlFor="retrospective">Retrospective</label>
                </div>
              </div>
            </div>

            {formData.dataCollectionType === 'Prospective' && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Information Sheet Requirements</h3>
                <div className="info-box">
                  <p>Information sheet is a clear and concise document that will be given to potential participants explaining the details of the study so that they can make an informed decision about participating.</p>
                  <p>At a minimum the Information Sheet must describe in lay terms:</p>
                  <ul>
                    <li>the nature and purpose of the research;</li>
                    <li>the procedure and how long it will take;</li>
                    <li>any risk or discomfort involved;</li>
                    <li>who will have access and under what conditions to any personal information;</li>
                    <li>the eventual disposal of data collected;</li>
                    <li>the name and contact details of the staff member responsible for the project and an invitation to contact that person over any matter associated with the project</li>
                  </ul>
                  <p><strong>What if Participants have any Questions?</strong></p>
                  <p>If you have any questions about our project, either now or in the future, please feel free to contact:</p>
                </div>
                <div className="form-group">
                  <label htmlFor="researcherContactName">1- Name of Researcher <span className="required">*</span></label>
                  <input
                    type="text"
                    id="researcherContactName"
                    className="form-control"
                    value={formData.researcherContactName}
                    onChange={(e) => handleChange('researcherContactName', e.target.value)}
                    placeholder="Enter researcher name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="researcherContactDepartment">2- Department of <span className="required">*</span></label>
                  <input
                    type="text"
                    id="researcherContactDepartment"
                    className="form-control"
                    value={formData.researcherContactDepartment}
                    onChange={(e) => handleChange('researcherContactDepartment', e.target.value)}
                    placeholder="Enter department"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="researcherContactTelephone">3- Telephone Number <span className="required">*</span></label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+968</span>
                    <input
                      type="tel"
                      id="researcherContactTelephone"
                      className="form-control"
                      placeholder="9XXXXXXX"
                      maxLength={8}
                      value={formData.researcherContactTelephone?.replace(/^\+968/, '') || ''}
                      onChange={(e) => {
                        let raw = e.target.value.replace(/\D/g, '');
                        if (raw.startsWith('968')) raw = raw.slice(3);
                        if (raw === '' || (raw.startsWith('9') && raw.length <= 8)) {
                          handleChange('researcherContactTelephone', raw ? `+968${raw}` : '');
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="researcherContactEmail">4- Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    id="researcherContactEmail"
                    className="form-control"
                    value={formData.researcherContactEmail}
                    onChange={(e) => handleChange('researcherContactEmail', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="info-box" style={{ marginTop: '0.5rem' }}>
                  <p><strong>The Information Sheet must conclude with the statement:</strong> "The Medical City For Military and Security Services Research Committee has reviewed and approved this project."</p>
                </div>
                <div className="form-group">
                  <label htmlFor="informationSheet">Information Sheet Content</label>
                  <textarea
                    id="informationSheet"
                    className="form-control"
                    value={formData.informationSheet}
                    onChange={(e) => handleChange('informationSheet', e.target.value)}
                    placeholder="Enter information sheet content or description"
                  />
                </div>
                <div className="form-group">
                  <label>Please upload the information sheet <span className="required">*</span></label>
                  <label htmlFor="file-informationSheetFiles" className="file-upload">
                    <input
                      id="file-informationSheetFiles"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange('informationSheetFiles', e.target.files)}
                    />
                    <p>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>Upload up to 5 supported files. Max 100 MB per file.</p>
                  </label>
                  {formData.informationSheetFiles.length > 0 && (
                    <div className="file-list">
                      {formData.informationSheetFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <span>{getFileName(file)}</span>
                          <button type="button" onClick={() => removeFile('informationSheetFiles', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <h3 style={{ marginTop: '2rem' }}>Consent Form Requirements</h3>
                <div className="info-box">
                  <p>The Consent Form must make it clear that a participant:</p>
                  <ol>
                    <li>understands the nature of the proposal;</li>
                    <li>has had all questions satisfactorily answered;</li>
                    <li>is aware of what will become of the data (including video or audio tapes and data held electronically) at the conclusion of the project;</li>
                    <li>knows that he or she is free to withdraw from the project at any time without disadvantage;</li>
                    <li>is aware of risks, remuneration and compensation;</li>
                    <li>is aware that the data may be published;</li>
                    <li>is aware that a third party (i.e. transcriber) may have access to the data;</li>
                    <li>is aware that every effort will be made to preserve the anonymity of the participant unless the participant gives an express waiver, which must be in addition to and separate from this consent form.</li>
                  </ol>
                </div>
                <div className="form-group">
                  <label>Please upload the consent form(s) in Arabic and English <span className="required">*</span></label>
                  <label htmlFor="file-consentFormFiles" className="file-upload">
                    <input
                      id="file-consentFormFiles"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange('consentFormFiles', e.target.files)}
                    />
                    <p>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>Upload up to 5 supported files. Max 1 GB per file.</p>
                  </label>
                  {formData.consentFormFiles.length > 0 && (
                    <div className="file-list">
                      {formData.consentFormFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <span>{getFileName(file)}</span>
                          <button type="button" onClick={() => removeFile('consentFormFiles', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <h3 style={{ marginTop: '2rem' }}>Project Details</h3>
            <div className="form-group">
              <label htmlFor="proposedStartDate">Proposed Date Of Commencement <span className="required">*</span></label>
              <input
                type="date"
                id="proposedStartDate"
                className="form-control"
                value={formData.proposedStartDate}
                onChange={(e) => handleChange('proposedStartDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (Months) <span className="required">*</span></label>
              <input
                type="number"
                id="duration"
                className="form-control"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Multi-center research <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="multiCenterYes"
                    name="multiCenterResearch"
                    value="Yes"
                    checked={formData.multiCenterResearch === 'Yes'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        multiCenterResearch: v
                      }));
                    }}
                  />
                  <label htmlFor="multiCenterYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="multiCenterNo"
                    name="multiCenterResearch"
                    value="No"
                    checked={formData.multiCenterResearch === 'No'}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        multiCenterResearch: e.target.value,
                        affiliatedCentersCount: '1',
                        affiliatedCenters: [{ name: '', country: '' }]
                      }));
                    }}
                  />
                  <label htmlFor="multiCenterNo">No</label>
                </div>
              </div>
            </div>

            {formData.multiCenterResearch === 'Yes' && (
              <>
                <div className="form-group">
                  <label>How many affiliated centers? <span className="required">*</span></label>
                  <div className="radio-group">
                    {['1', '2', '3', '4', '5 or more'].map((count) => (
                      <div key={count} className="radio-item">
                        <input
                          type="radio"
                          id={`affiliatedCentersCount${count}`}
                          name="affiliatedCentersCount"
                          value={count}
                          checked={formData.affiliatedCentersCount === count}
                          onChange={(e) => {
                            handleChange('affiliatedCentersCount', e.target.value);
                            const num = count === '5 or more' ? 5 : parseInt(count, 10);
                            const list = formData.affiliatedCenters || [{ name: '', country: '' }];
                            if (num > list.length) {
                              const added = Array(num - list.length)
                                .fill(null)
                                .map(() => ({ name: '', country: '' }));
                              setFormData(prev => ({
                                ...prev,
                                affiliatedCenters: [...(prev.affiliatedCenters || []), ...added]
                              }));
                            } else if (num < list.length) {
                              setFormData(prev => ({
                                ...prev,
                                affiliatedCenters: (prev.affiliatedCenters || []).slice(0, num)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`affiliatedCentersCount${count}`}>{count}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {(formData.affiliatedCenters || [{ name: '', country: '' }]).map((center, index) => (
                  <div key={index} className="co-investigator-section">
                    <h4>Affiliated Center {index + 1}</h4>
                    <div className="form-group">
                      <label htmlFor={`affiliatedCenterName${index}`}>Name <span className="required">*</span></label>
                      <input
                        type="text"
                        id={`affiliatedCenterName${index}`}
                        className="form-control"
                        value={center.name}
                        onChange={(e) => updateAffiliatedCenter(index, 'name', e.target.value)}
                        placeholder="Center name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`affiliatedCenterCountry${index}`}>Country of Affiliation <span className="required">*</span></label>
                      <input
                        type="text"
                        id={`affiliatedCenterCountry${index}`}
                        className="form-control"
                        value={center.country}
                        onChange={(e) => updateAffiliatedCenter(index, 'country', e.target.value)}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                ))}
              </>
            )}

            <h3 style={{ marginTop: '2rem' }}>Details of Funding Source</h3>
            <div className="form-group">
              <label>Funding Source <span className="required">*</span></label>
              <div className="radio-group">
                {FUNDING_SOURCES.map((source) => (
                  <div key={source} className="radio-item">
                    <input
                      type="radio"
                      id={`funding${source}`}
                      name="fundingSource"
                      value={source}
                      checked={formData.fundingSource === source}
                      onChange={(e) => handleChange('fundingSource', e.target.value)}
                    />
                    <label htmlFor={`funding${source}`}>{source}</label>
                  </div>
                ))}
              </div>
            </div>
            {formData.fundingSource === 'Other' && (
              <div className="form-group">
                <label htmlFor="fundingOther">Please specify <span className="required">*</span></label>
                <input
                  type="text"
                  id="fundingOther"
                  className="form-control"
                  value={formData.fundingOther}
                  onChange={(e) => handleChange('fundingOther', e.target.value)}
                />
              </div>
            )}

            {formData.fundingSource && formData.fundingSource !== 'Self-Funding' && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Grant Details</h3>
                <div className="form-group">
                  <label htmlFor="grantSum">Grant Sum <span className="required">*</span></label>
                  <input
                    type="text"
                    id="grantSum"
                    className="form-control"
                    value={formData.grantSum}
                    onChange={(e) => handleChange('grantSum', e.target.value)}
                    placeholder="Enter grant amount"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="grantStartDate">Validity Period: Start Date <span className="required">*</span></label>
                  <input
                    type="date"
                    id="grantStartDate"
                    className="form-control"
                    value={formData.grantStartDate}
                    onChange={(e) => handleChange('grantStartDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="grantEndDate">Validity Period: End Date <span className="required">*</span></label>
                  <input
                    type="date"
                    id="grantEndDate"
                    className="form-control"
                    value={formData.grantEndDate}
                    onChange={(e) => handleChange('grantEndDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Please upload documents confirming the details of the grant <span className="required">*</span></label>
                  <label htmlFor="file-grantDocuments" className="file-upload">
                    <input
                      id="file-grantDocuments"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange('grantDocuments', e.target.files)}
                    />
                    <p>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>Upload up to 5 supported files. Max 1 GB per file.</p>
                  </label>
                  {formData.grantDocuments.length > 0 && (
                    <div className="file-list">
                      {formData.grantDocuments.map((file, index) => (
                        <div key={index} className="file-item">
                          <span>{getFileName(file)}</span>
                          <button type="button" onClick={() => removeFile('grantDocuments', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h3>Handling of Confidential Information</h3>
            <div className="form-group">
              <label htmlFor="dataCapturingMethods">
                What form of data capturing method(s) used in your research? (e.g. typewritten records, audiotapes, videotapes, machine generated reports etc.) <span className="required">*</span>
              </label>
              <textarea
                id="dataCapturingMethods"
                className="form-control"
                value={formData.dataCapturingMethods}
                onChange={(e) => handleChange('dataCapturingMethods', e.target.value)}
                placeholder="Describe the data capturing methods used"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dataStorageMode">Mode of data Storage <span className="required">*</span></label>
              <textarea
                id="dataStorageMode"
                className="form-control"
                value={formData.dataStorageMode}
                onChange={(e) => handleChange('dataStorageMode', e.target.value)}
                placeholder="Describe how data will be stored"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dataAccess">Who will have access to data? <span className="required">*</span></label>
              <textarea
                id="dataAccess"
                className="form-control"
                value={formData.dataAccess}
                onChange={(e) => handleChange('dataAccess', e.target.value)}
                placeholder="List who will have access to the data"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confidentialityMeasures">How do you secure subjects confidentiality for this method? <span className="required">*</span></label>
              <textarea
                id="confidentialityMeasures"
                className="form-control"
                value={formData.confidentialityMeasures}
                onChange={(e) => handleChange('confidentialityMeasures', e.target.value)}
                placeholder="Describe confidentiality measures"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h3>Ethical Considerations</h3>
            <div className="form-group">
              <label>Have you applied for ethics approval for this research project before? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="previousEthicsYes"
                    name="previousEthicsApproval"
                    value="Yes"
                    checked={formData.previousEthicsApproval === 'Yes'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        previousEthicsApproval: v
                      }));
                    }}
                  />
                  <label htmlFor="previousEthicsYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="previousEthicsNo"
                    name="previousEthicsApproval"
                    value="No"
                    checked={formData.previousEthicsApproval === 'No'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        previousEthicsApproval: v,
                        ...(v === 'No'
                          ? {
                              previousEthicsApplicationDate: '',
                              previousEthicsProjectApproved: '',
                              ethicsApprovalDocuments: []
                            }
                          : {})
                      }));
                    }}
                  />
                  <label htmlFor="previousEthicsNo">No</label>
                </div>
              </div>
            </div>
            {formData.previousEthicsApproval === 'Yes' && (
              <>
                <div className="form-group">
                  <label htmlFor="previousEthicsApplicationDate">
                    When did you apply? <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="previousEthicsApplicationDate"
                    className="form-control"
                    value={formData.previousEthicsApplicationDate}
                    onChange={(e) => handleChange('previousEthicsApplicationDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Was the research project approved? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input
                        type="radio"
                        id="previousEthicsProjectApprovedYes"
                        name="previousEthicsProjectApproved"
                        value="Yes"
                        checked={formData.previousEthicsProjectApproved === 'Yes'}
                        onChange={(e) => handleChange('previousEthicsProjectApproved', e.target.value)}
                      />
                      <label htmlFor="previousEthicsProjectApprovedYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        id="previousEthicsProjectApprovedNo"
                        name="previousEthicsProjectApproved"
                        value="No"
                        checked={formData.previousEthicsProjectApproved === 'No'}
                        onChange={(e) => handleChange('previousEthicsProjectApproved', e.target.value)}
                      />
                      <label htmlFor="previousEthicsProjectApprovedNo">No</label>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    Please attach a copy of ethics approval(s) obtained. <span className="required">*</span>
                  </label>
                  <label htmlFor="file-ethicsApprovalDocuments" className="file-upload">
                    <input
                      id="file-ethicsApprovalDocuments"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleEthicsApprovalFiles(e.target.files)}
                    />
                    <p>Click to upload or drag and drop</p>
                    <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                      Upload up to 5 supported files. Max 100 MB per file.
                    </p>
                  </label>
                  {formData.ethicsApprovalDocuments.length > 0 && (
                    <div className="file-list">
                      {formData.ethicsApprovalDocuments.map((file, index) => (
                        <div key={index} className="file-item">
                          <span>{getFileName(file)}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('ethicsApprovalDocuments', index)}
                            className="btn btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="form-group">
              <label>Are you collecting and storing personal information directly from the individual concerned that could identify the individual? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="collectingPersonalYes"
                    name="collectingPersonalInfo"
                    value="Yes"
                    checked={formData.collectingPersonalInfo === 'Yes'}
                    onChange={(e) => handleChange('collectingPersonalInfo', e.target.value)}
                  />
                  <label htmlFor="collectingPersonalYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="collectingPersonalNo"
                    name="collectingPersonalInfo"
                    value="No"
                    checked={formData.collectingPersonalInfo === 'No'}
                    onChange={(e) => handleChange('collectingPersonalInfo', e.target.value)}
                  />
                  <label htmlFor="collectingPersonalNo">No</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Are you collecting information about individuals from another source? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="collectingOtherYes"
                    name="collectingFromOtherSource"
                    value="Yes"
                    checked={formData.collectingFromOtherSource === 'Yes'}
                    onChange={(e) => handleChange('collectingFromOtherSource', e.target.value)}
                  />
                  <label htmlFor="collectingOtherYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="collectingOtherNo"
                    name="collectingFromOtherSource"
                    value="No"
                    checked={formData.collectingFromOtherSource === 'No'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        collectingFromOtherSource: v,
                        ...(v === 'No'
                          ? {
                              intendPublishPersonalInfoFromOtherSource: '',
                              publishPersonalInfoFromOtherSourceDetails: ''
                            }
                          : {})
                      }));
                    }}
                  />
                  <label htmlFor="collectingOtherNo">No</label>
                </div>
              </div>
            </div>
            {formData.collectingFromOtherSource === 'Yes' && (
              <div className="form-group">
                <label>
                  Do you intend to publish any personal information they have provided?{' '}
                  <span className="required">*</span>
                </label>
                <div className="radio-group">
                  <div className="radio-item">
                    <input
                      type="radio"
                      id="intendPublishPersonalInfoOtherYes"
                      name="intendPublishPersonalInfoFromOtherSource"
                      value="Yes"
                      checked={formData.intendPublishPersonalInfoFromOtherSource === 'Yes'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          intendPublishPersonalInfoFromOtherSource: v,
                          ...(v === 'No' ? { publishPersonalInfoFromOtherSourceDetails: '' } : {})
                        }));
                      }}
                    />
                    <label htmlFor="intendPublishPersonalInfoOtherYes">Yes</label>
                  </div>
                  <div className="radio-item">
                    <input
                      type="radio"
                      id="intendPublishPersonalInfoOtherNo"
                      name="intendPublishPersonalInfoFromOtherSource"
                      value="No"
                      checked={formData.intendPublishPersonalInfoFromOtherSource === 'No'}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          intendPublishPersonalInfoFromOtherSource: v,
                          ...(v === 'No' ? { publishPersonalInfoFromOtherSourceDetails: '' } : {})
                        }));
                      }}
                    />
                    <label htmlFor="intendPublishPersonalInfoOtherNo">No</label>
                  </div>
                </div>
              </div>
            )}
            {formData.collectingFromOtherSource === 'Yes' &&
              formData.intendPublishPersonalInfoFromOtherSource === 'Yes' && (
                <div className="form-group">
                  <label htmlFor="publishPersonalInfoFromOtherSourceDetails">
                    Please specify in what form you intend to do this? <span className="required">*</span>
                  </label>
                  <textarea
                    id="publishPersonalInfoFromOtherSourceDetails"
                    className="form-control"
                    rows={4}
                    value={formData.publishPersonalInfoFromOtherSourceDetails}
                    onChange={(e) =>
                      handleChange('publishPersonalInfoFromOtherSourceDetails', e.target.value)
                    }
                    placeholder="Describe the form in which you intend to publish this information"
                  />
                </div>
              )}
            <div className="form-group">
              <label>Does the research involve any form of deception? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="deceptionYes"
                    name="involvesDeception"
                    value="Yes"
                    checked={formData.involvesDeception === 'Yes'}
                    onChange={(e) => handleChange('involvesDeception', e.target.value)}
                  />
                  <label htmlFor="deceptionYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="deceptionNo"
                    name="involvesDeception"
                    value="No"
                    checked={formData.involvesDeception === 'No'}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        involvesDeception: v,
                        ...(v === 'No' ? { deceptionDebriefingProcedures: '' } : {})
                      }));
                    }}
                  />
                  <label htmlFor="deceptionNo">No</label>
                </div>
              </div>
            </div>
            {formData.involvesDeception === 'Yes' && (
              <div className="form-group">
                <label htmlFor="deceptionDebriefingProcedures">
                  Please explain all debriefing procedures. <span className="required">*</span>
                </label>
                <textarea
                  id="deceptionDebriefingProcedures"
                  className="form-control"
                  rows={5}
                  value={formData.deceptionDebriefingProcedures}
                  onChange={(e) => handleChange('deceptionDebriefingProcedures', e.target.value)}
                  placeholder="Describe how and when participants will be debriefed"
                />
              </div>
            )}
            <div className="form-group">
              <label>Do you intend to publish or disseminate the findings? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="publishYes"
                    name="intendToPublish"
                    value="Yes"
                    checked={formData.intendToPublish === 'Yes'}
                    onChange={(e) => handleChange('intendToPublish', e.target.value)}
                  />
                  <label htmlFor="publishYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="publishNo"
                    name="intendToPublish"
                    value="No"
                    checked={formData.intendToPublish === 'No'}
                    onChange={(e) => handleChange('intendToPublish', e.target.value)}
                  />
                  <label htmlFor="publishNo">No</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Are blood and/or tissue samples used for analysis? <span className="required">*</span></label>
              <div className="radio-group">
                <div className="radio-item">
                  <input
                    type="radio"
                    id="bloodTissueYes"
                    name="bloodTissueSamples"
                    value="Yes"
                    checked={formData.bloodTissueSamples === 'Yes'}
                    onChange={(e) => handleChange('bloodTissueSamples', e.target.value)}
                  />
                  <label htmlFor="bloodTissueYes">Yes</label>
                </div>
                <div className="radio-item">
                  <input
                    type="radio"
                    id="bloodTissueNo"
                    name="bloodTissueSamples"
                    value="No"
                    checked={formData.bloodTissueSamples === 'No'}
                    onChange={() => {
                      setFormData((prev) => ({
                        ...prev,
                        bloodTissueSamples: 'No',
                        bloodTissueNumberOfSamples: '',
                        bloodTissueSampleType: '',
                        bloodTissueQuantityPerSubject: '',
                        bloodTissueAnalyzedInOman: '',
                        bloodTissueAbroadInstitution: '',
                        bloodTissueAbroadCountry: '',
                        bloodTissueDiscardExplanation: '',
                        bloodTissueAbroadDocuments: []
                      }));
                    }}
                  />
                  <label htmlFor="bloodTissueNo">No</label>
                </div>
              </div>
            </div>
            {formData.bloodTissueSamples === 'Yes' && (
              <div className="award-details-section">
                <div className="form-group">
                  <label htmlFor="bloodTissueNumberOfSamples">
                    Please specify: Number of samples <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="bloodTissueNumberOfSamples"
                    className="form-control"
                    value={formData.bloodTissueNumberOfSamples}
                    onChange={(e) => handleChange('bloodTissueNumberOfSamples', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bloodTissueSampleType">
                    Please specify: Type of sample <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="bloodTissueSampleType"
                    className="form-control"
                    value={formData.bloodTissueSampleType}
                    onChange={(e) => handleChange('bloodTissueSampleType', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bloodTissueQuantityPerSubject">
                    Please specify: Quantity of sample from each subject <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="bloodTissueQuantityPerSubject"
                    className="form-control"
                    value={formData.bloodTissueQuantityPerSubject}
                    onChange={(e) => handleChange('bloodTissueQuantityPerSubject', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Will blood/tissue samples be analyzed in Oman? <span className="required">*</span></label>
                  <div className="radio-group">
                    <div className="radio-item">
                      <input
                        type="radio"
                        id="bloodTissueOmanYes"
                        name="bloodTissueAnalyzedInOman"
                        value="Yes"
                        checked={formData.bloodTissueAnalyzedInOman === 'Yes'}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            bloodTissueAnalyzedInOman: 'Yes',
                            bloodTissueAbroadInstitution: '',
                            bloodTissueAbroadCountry: '',
                            bloodTissueDiscardExplanation: '',
                            bloodTissueAbroadDocuments: []
                          }));
                        }}
                      />
                      <label htmlFor="bloodTissueOmanYes">Yes</label>
                    </div>
                    <div className="radio-item">
                      <input
                        type="radio"
                        id="bloodTissueOmanNo"
                        name="bloodTissueAnalyzedInOman"
                        value="No"
                        checked={formData.bloodTissueAnalyzedInOman === 'No'}
                        onChange={(e) => handleChange('bloodTissueAnalyzedInOman', e.target.value)}
                      />
                      <label htmlFor="bloodTissueOmanNo">No</label>
                    </div>
                  </div>
                </div>

                {formData.bloodTissueAnalyzedInOman === 'No' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="bloodTissueAbroadInstitution">
                        Name of institution (where samples will be analyzed) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="bloodTissueAbroadInstitution"
                        className="form-control"
                        value={formData.bloodTissueAbroadInstitution}
                        onChange={(e) => handleChange('bloodTissueAbroadInstitution', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bloodTissueAbroadCountry">
                        Country <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="bloodTissueAbroadCountry"
                        className="form-control"
                        value={formData.bloodTissueAbroadCountry}
                        onChange={(e) => handleChange('bloodTissueAbroadCountry', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="bloodTissueDiscardExplanation">
                        Explain how you will discard the samples after analysis <span className="required">*</span>
                      </label>
                      <textarea
                        id="bloodTissueDiscardExplanation"
                        className="form-control"
                        rows={4}
                        value={formData.bloodTissueDiscardExplanation}
                        onChange={(e) => handleChange('bloodTissueDiscardExplanation', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Please upload all supporting documents <span className="required">*</span></label>
                      <label htmlFor="file-bloodTissueAbroadDocuments" className="file-upload">
                        <input
                          id="file-bloodTissueAbroadDocuments"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange('bloodTissueAbroadDocuments', e.target.files)}
                        />
                        <p>Click to upload or drag and drop</p>
                        <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Upload up to 5 supported files. Max 100 MB per file.
                        </p>
                      </label>
                      {formData.bloodTissueAbroadDocuments.length > 0 && (
                        <div className="file-list">
                          {formData.bloodTissueAbroadDocuments.map((file, index) => (
                            <div key={index} className="file-item">
                              <span>{getFileName(file)}</span>
                              <button
                                type="button"
                                onClick={() => removeFile('bloodTissueAbroadDocuments', index)}
                                className="btn btn-danger"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="step-content">
            <h3>Declaration of Investigator</h3>
            <div className="info-box">
              <p>I (we) certify to the best of my (our) knowledge, the information given in this application is correct and the details of this application are true representation of the research to be undertaken. I (we) agree to inform the MCMSS research committee of any variations to the research during the application period or during the conduct of my (our) research.</p>
              <p>I (we) will ensure that patient's samples sent abroad will be used only for the research purposes described in the application of ethics committee approval.</p>
            </div>
            <div className="form-group">
              <label htmlFor="piName">Name of Principal Investigator (PI) <span className="required">*</span></label>
              <input
                type="text"
                id="piName"
                className="form-control"
                readOnly
                value={formData.principalInvestigator?.fullName || ''}
                style={{ backgroundColor: '#f8f9fa', cursor: 'default' }}
              />
              <p style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.35rem' }}>
                Taken from the Principal Investigator details in Section 2. Update the name there if needed.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="piSignature">Signature <span className="required">*</span></label>
              <input
                type="text"
                id="piSignature"
                className="form-control"
                value={formData.piSignature}
                onChange={(e) => handleChange('piSignature', e.target.value)}
                placeholder="Enter your signature"
              />
            </div>
            <div className="form-group">
              <label htmlFor="declarationDate">Date <span className="required">*</span></label>
              <input
                type="date"
                id="declarationDate"
                className="form-control"
                value={formData.declarationDate}
                onChange={(e) => handleChange('declarationDate', e.target.value)}
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="step-content">
            <h3>Research Proposal</h3>
            <div className="form-group">
              <label htmlFor="introduction">Introduction (Max 500 words) <span className="required">*</span></label>
              <textarea
                id="introduction"
                className="form-control"
                value={formData.introduction}
                onChange={(e) => handleChange('introduction', limitWords(e.target.value, 500))}
                placeholder="Provide an introduction to your research"
                rows="6"
              />
              <small style={{ color: '#6c757d' }}>{countWords(formData.introduction)} / 500 words</small>
            </div>
            <div className="form-group">
              <label htmlFor="objectives">Objectives (Primary & Secondary) <span className="required">*</span></label>
              <textarea
                id="objectives"
                className="form-control"
                value={formData.objectives}
                onChange={(e) => handleChange('objectives', e.target.value)}
                placeholder="List your primary and secondary objectives"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label htmlFor="targetPopulation">Target Population <span className="required">*</span></label>
              <textarea
                id="targetPopulation"
                className="form-control"
                value={formData.targetPopulation}
                onChange={(e) => handleChange('targetPopulation', e.target.value)}
                placeholder="Describe your target population"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label htmlFor="methodology">Methodology <span className="required">*</span></label>
              <textarea
                id="methodology"
                className="form-control"
                value={formData.methodology}
                onChange={(e) => handleChange('methodology', e.target.value)}
                placeholder="Describe your research methodology"
                rows="6"
              />
            </div>
            <div className="form-group">
              <label>Sample Size Calculation <span className="required">*</span></label>
              <label htmlFor="file-sampleSizeFiles" className="file-upload">
                <input
                  id="file-sampleSizeFiles"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange('sampleSizeFiles', e.target.files)}
                />
                <p>Click to upload or drag and drop</p>
                <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>PDF or DOCX, Max 100 MB per file</p>
              </label>
              {formData.sampleSizeFiles.length > 0 && (
                <div className="file-list">
                  {formData.sampleSizeFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span>{getFileName(file)}</span>
                      <button type="button" onClick={() => removeFile('sampleSizeFiles', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="statisticalAnalysis">Statistical Analysis <span className="required">*</span></label>
              <textarea
                id="statisticalAnalysis"
                className="form-control"
                value={formData.statisticalAnalysis}
                onChange={(e) => handleChange('statisticalAnalysis', e.target.value)}
                placeholder="Describe your statistical analysis methods"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label htmlFor="intervention">Intervention <span className="required">*</span></label>
              <textarea
                id="intervention"
                className="form-control"
                value={formData.intervention}
                onChange={(e) => handleChange('intervention', e.target.value)}
                placeholder="Describe any interventions"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Data and Research Variables</label>
              <label htmlFor="file-dataVariablesFiles" className="file-upload">
                <input
                  id="file-dataVariablesFiles"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange('dataVariablesFiles', e.target.files)}
                />
                <p>Click to upload or drag and drop</p>
                <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>PDF or DOCX, Max 100 MB per file</p>
              </label>
              {formData.dataVariablesFiles.length > 0 && (
                <div className="file-list">
                  {formData.dataVariablesFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span>{getFileName(file)}</span>
                      <button type="button" onClick={() => removeFile('dataVariablesFiles', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="expectedOutcomes">Expected Outcomes <span className="required">*</span></label>
              <textarea
                id="expectedOutcomes"
                className="form-control"
                value={formData.expectedOutcomes}
                onChange={(e) => handleChange('expectedOutcomes', e.target.value)}
                placeholder="Describe expected outcomes"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label htmlFor="references">References <span className="required">*</span></label>
              <textarea
                id="references"
                className="form-control"
                value={formData.references}
                onChange={(e) => handleChange('references', e.target.value)}
                placeholder="List your references"
                rows="6"
              />
            </div>
            <div className="form-group">
              <label>Upload Research Proposal <span className="required">*</span></label>
              <label htmlFor="file-researchProposalFiles" className="file-upload">
                <input
                  id="file-researchProposalFiles"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange('researchProposalFiles', e.target.files)}
                />
                <p>Click to upload or drag and drop</p>
                <p style={{ fontSize: '0.85rem', color: '#6c757d' }}>PDF or DOCX, Max 1 GB per file</p>
              </label>
              {formData.researchProposalFiles.length > 0 && (
                <div className="file-list">
                  {formData.researchProposalFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span>{getFileName(file)}</span>
                      <button type="button" onClick={() => removeFile('researchProposalFiles', index)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show success view if submission was successful
  if (showSuccessView) {
    return (
      <div className="submission-success-container">
        <div className="submission-success-card">
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" />
              <path d="M8 12l2 2 4-4" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>Submission Successful!</h2>
          <p className="success-message">
            Your research has been submitted for review.
          </p>
          <p className="success-submessage">
            You will be notified once the review process is complete.
          </p>
          <button
            className="btn btn-primary btn-success-home"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>Research Ethics Submission Form</h1>
          <div className="header-user">
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="card">
          <div className="step-indicator">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
              >
                <div
                  className="step-number"
                  onClick={() => handleStepClick(step.id)}
                  style={{ cursor: 'pointer' }}
                  title={`Go to ${step.title}`}
                >
                  {step.id}
                </div>
                <div className="step-label">{step.title}</div>
              </div>
            ))}
          </div>

          {renderStepContent()}

          <div className="form-navigation">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {currentStep > 1 && (
                <button type="button" className="btn btn-secondary" onClick={handleBack}>
                  ← Back
                </button>
              )}
              {!id && autoSaveStatus && (
                <span style={{
                  fontSize: '0.875rem',
                  color: autoSaveStatus === 'Saving...' ? '#8b6700' : '#28a745',
                  fontStyle: 'italic'
                }}>
                  {autoSaveStatus}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              {currentStep < STEPS.length ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span className="spinner"></span>
                      Submitting...
                    </span>
                  ) : (
                    'Submit for Review'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MCMSS Requirement Modal */}
      {showMCMSSModal && (
        <div className="modal-overlay" onClick={() => setShowMCMSSModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>MCMSS Requirement</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              The Principle Investigator should be from the MCMSS.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowMCMSSModal(false);
                  // Reset to empty or keep as No but prevent proceeding
                  handleChange('principalInvestigator.isFromMCMSS', '');
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Submission</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Are you sure you want to submit this form for review?
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner"></span>
                    Submitting...
                  </span>
                ) : (
                  'Confirm Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionForm;
