import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Save, CheckCircle2, X } from 'lucide-react';
import { createSubmission, updateSubmission, getSubmission, submitForReview } from '../utils/api';
import AppHeader from './AppHeader';
import {
  Field,
  FileUpload,
  OptionRadioGroup,
  CheckboxField,
  StepIndicator,
  StepHeading,
  CountrySelect,
} from './form/FormPrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, REVISION_STATUSES } from '@/lib/utils';

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
  'Other',
];

const FUNDING_SOURCES = [
  'Self-Funding',
  'MCMSS research grant',
  'MOH grant',
  'SQU research grant',
  'TRC research grant',
  'Industry',
  'Other',
];

const HOSPITALS = ['Al Qurum', 'Al Khoudh', 'Muscat', 'Salalah', 'Samail', 'MAM', 'Medical City School'];

const STUDY_INVOLVES_OPTIONS = [
  'Direct interaction with patients or caregivers specifically for research (e.g., questionnaires, interviews, extra examinations)',
  'Collection of new biological samples for research (e.g., extra blood, tissue, saliva)',
  'Use of identifiable patient information from medical records specifically for research (not just fully anonymized data)',
  'None of the above',
];

const ETHICS_APPROVAL_MAX_FILE_BYTES = 100 * 1024 * 1024;

const SUBMISSION_FIELD_LABELS = {
  researchTitle: 'Research Title',
  consentAcknowledged: 'Terms acknowledgement',
  'principalInvestigator.fullName': 'PI Full Name',
  'principalInvestigator.jobTitle': 'PI Job Title',
  'principalInvestigator.isFromMCMSS': 'PI from MCMSS',
  'principalInvestigator.hospital': 'Hospital',
  'principalInvestigator.department': 'Department',
  'principalInvestigator.qualifications': 'Qualifications',
  'principalInvestigator.telephone': 'PI Mobile',
  'principalInvestigator.email': 'PI Email',
  mastersOrPhd: 'Masters/PhD',
  researchStudent: 'Research student',
  supervisorName: "Supervisor's name",
  supervisorEmail: "Supervisor's email",
  researchType: 'Research Type',
  researchTypeOther: 'Research type (specify)',
  studyInvolves: 'Study involvement',
  proposedStartDate: 'Proposed start date',
  duration: 'Duration',
  multiCenterResearch: 'Multi-center research',
  fundingSource: 'Funding source',
  fundingOther: 'Funding source (specify)',
  grantSum: 'Grant sum',
  grantStartDate: 'Grant start date',
  grantEndDate: 'Grant end date',
  grantDocuments: 'Grant documents',
  researcherContactName: 'Researcher name',
  researcherContactDepartment: 'Researcher department',
  researcherContactTelephone: 'Researcher telephone',
  researcherContactEmail: 'Researcher email',
  informationSheetFiles: 'Information sheet',
  consentFormFiles: 'Consent form',
  dataCapturingMethods: 'Data capturing methods',
  dataStorageMode: 'Data storage mode',
  dataAccess: 'Data access',
  confidentialityMeasures: 'Confidentiality measures',
  previousEthicsApproval: 'Previous ethics approval',
  previousEthicsApplicationDate: 'Ethics application date',
  previousEthicsProjectApproved: 'Project approved',
  ethicsApprovalDocuments: 'Ethics approval documents',
  collectingPersonalInfo: 'Collecting personal info',
  collectingFromOtherSource: 'Collecting from other source',
  intendPublishPersonalInfoFromOtherSource: 'Publish personal info',
  publishPersonalInfoFromOtherSourceDetails: 'Publication details',
  involvesDeception: 'Involves deception',
  deceptionDebriefingProcedures: 'Debriefing procedures',
  intendToPublish: 'Intend to publish',
  bloodTissueSamples: 'Blood/tissue samples',
  bloodTissueNumberOfSamples: 'Number of samples',
  bloodTissueSampleType: 'Sample type',
  bloodTissueQuantityPerSubject: 'Quantity per subject',
  bloodTissueAnalyzedInOman: 'Analyzed in Oman',
  bloodTissueAbroadInstitution: 'Institution abroad',
  bloodTissueAbroadCountry: 'Country abroad',
  bloodTissueDiscardExplanation: 'Sample disposal',
  bloodTissueAbroadDocuments: 'Supporting documents',
  piSignature: 'Signature',
  declarationDate: 'Declaration date',
  introduction: 'Introduction',
  objectives: 'Objectives',
  targetPopulation: 'Target population',
  methodology: 'Methodology',
  statisticalAnalysis: 'Statistical analysis',
  intervention: 'Intervention',
  expectedOutcomes: 'Expected outcomes',
  references: 'References',
};

const describeSubmissionErrorKey = (key) => {
  if (SUBMISSION_FIELD_LABELS[key]) return SUBMISSION_FIELD_LABELS[key];
  if (key.startsWith('affiliatedCenters.')) return 'Affiliated center details';
  return key;
};

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

/* +968 prefixed Omani mobile input */
function PhoneInput({ value, onChange, disabled, id, onKeyDown }) {
  return (
    <div className="flex">
      <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
        +968
      </span>
      <Input
        id={id}
        type="tel"
        className="rounded-l-none"
        placeholder="9XXXXXXX"
        maxLength={8}
        disabled={disabled}
        value={value?.replace(/^\+968/, '') || ''}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
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
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
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
      email: '',
      isFromMCMSS: '',
    },
    coInvestigatorsCount: '1',
    coInvestigators: [{ name: '', post: '', institute: '' }],
    mastersOrPhd: '',
    researchStudent: '',
    supervisorName: '',
    supervisorEmail: '',
    researchType: [],
    researchTypeOther: '',
    studyInvolves: [],
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
    researchProposalFiles: [],
  });

  useEffect(() => {
    if (id) {
      loadSubmission();
    } else {
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
            deceptionDebriefingProcedures: savedData.deceptionDebriefingProcedures ?? '',
          }));
        } catch (error) {
          console.error('Failed to load auto-saved data:', error);
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setAutoSaveStatus('Saving...');
      const timeoutId = setTimeout(() => {
        localStorage.setItem('submissionFormAutoSave', JSON.stringify(sanitizeFormData(formData)));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    const fullName = formData.principalInvestigator?.fullName ?? '';
    setFormData((prev) => {
      if (prev.piName === fullName) return prev;
      return { ...prev, piName: fullName };
    });
  }, [formData.principalInvestigator?.fullName]);

  const clearAutoSave = () => {
    localStorage.removeItem('submissionFormAutoSave');
  };

  const loadSubmission = async () => {
    try {
      const submission = await getSubmission(id);
      setSubmissionStatus(submission.status);
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
          studyInvolves: Array.isArray(fd.studyInvolves) ? fd.studyInvolves : [],
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
          deceptionDebriefingProcedures: fd.deceptionDebriefingProcedures ?? '',
        });
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    }
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleCheckboxChange = (field, value, checked) => {
    if (field === 'researchType') {
      setFormData((prev) => ({
        ...prev,
        researchType: checked
          ? [...prev.researchType, value]
          : prev.researchType.filter((t) => t !== value),
      }));
    } else if (field === 'studyInvolves') {
      setFormData((prev) => {
        if (value === 'None of the above') {
          return { ...prev, studyInvolves: checked ? ['None of the above'] : [] };
        }
        const withoutNone = prev.studyInvolves.filter((v) => v !== 'None of the above');
        return {
          ...prev,
          studyInvolves: checked
            ? [...withoutNone, value]
            : withoutNone.filter((v) => v !== value),
        };
      });
    }
  };

  // On a revision, previously uploaded files must be kept for the record. Researchers
  // may add new files but cannot delete existing ones.
  const isRevision = REVISION_STATUSES.includes(submissionStatus);

  const FILE_LIMITS = { informationSheetFiles: 2 };

  const handleFileChange = (field, files) => {
    const fileArray = Array.from(files);
    const maxFiles = FILE_LIMITS[field] ?? 5;
    setFormData((prev) => {
      const existing = prev[field] || [];
      const combined = [...existing, ...fileArray].slice(0, maxFiles);
      return { ...prev, [field]: combined };
    });
  };

  const removeFile = (field, index) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const target = current[index];
      // Guard: on a revision, existing (already-uploaded) files cannot be removed.
      if (isRevision && target && !(target instanceof File)) {
        return prev;
      }
      return { ...prev, [field]: current.filter((_, i) => i !== index) };
    });
  };

  const handleEthicsApprovalFiles = (files) => {
    const fileArray = Array.from(files || []);
    const valid = [];
    for (const f of fileArray) {
      if (f.size > ETHICS_APPROVAL_MAX_FILE_BYTES) {
        toast.error(`File "${f.name}" exceeds 100 MB and was not added.`);
        continue;
      }
      valid.push(f);
    }
    setFormData((prev) => {
      const existing = prev.ethicsApprovalDocuments || [];
      return { ...prev, ethicsApprovalDocuments: [...existing, ...valid].slice(0, 1) };
    });
  };

  const updateCoInvestigator = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      coInvestigators: prev.coInvestigators.map((ci, i) =>
        i === index ? { ...ci, [field]: value } : ci
      ),
    }));
  };

  const updateAffiliatedCenter = (index, field, value) => {
    setFormData((prev) => {
      const list = prev.affiliatedCenters || [{ name: '', country: '' }];
      return {
        ...prev,
        affiliatedCenters: list.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
      };
    });
  };

  const setCountWithList = (countField, listField, makeItem, count) => {
    handleChange(countField, count);
    const num = count === '5 or more' ? 5 : parseInt(count, 10);
    setFormData((prev) => {
      const list = prev[listField] || [];
      if (num > list.length) {
        const added = Array(num - list.length).fill(null).map(makeItem);
        return { ...prev, [listField]: [...list, ...added] };
      }
      if (num < list.length) {
        return { ...prev, [listField]: list.slice(0, num) };
      }
      return prev;
    });
  };

  const getStepErrors = (step) => {
    const e = {};
    const req = (key, ok, msg = 'This field is required.') => {
      if (!ok) e[key] = msg;
    };
    const pi = formData.principalInvestigator || {};
    switch (step) {
      case 1:
        req('researchTitle', formData.researchTitle?.trim());
        req('consentAcknowledged', formData.consentAcknowledged, 'You must acknowledge the terms.');
        break;
      case 2:
        req('principalInvestigator.fullName', pi.fullName?.trim());
        req('principalInvestigator.jobTitle', pi.jobTitle?.trim());
        req('principalInvestigator.isFromMCMSS', pi.isFromMCMSS === 'Yes', 'The Principal Investigator must be from MCMSS.');
        req('principalInvestigator.hospital', pi.hospital);
        req('principalInvestigator.department', pi.department?.trim());
        req('principalInvestigator.qualifications', pi.qualifications?.trim());
        req('principalInvestigator.telephone', pi.telephone?.trim());
        req('principalInvestigator.email', pi.email?.trim());
        req('mastersOrPhd', formData.mastersOrPhd);
        if (formData.mastersOrPhd === 'Yes') {
          req('researchStudent', formData.researchStudent?.trim());
          req('supervisorName', formData.supervisorName?.trim());
          const email = formData.supervisorEmail?.trim();
          if (!email) {
            e.supervisorEmail = 'This field is required.';
          } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            e.supervisorEmail = 'Enter a valid email address.';
          }
        }
        break;
      case 3: {
        req('researchType', formData.researchType.length > 0, 'Select at least one research type.');
        if (formData.researchType.includes('Other')) {
          req('researchTypeOther', formData.researchTypeOther?.trim(), 'Specify the other research type(s).');
        }
        req('studyInvolves', formData.studyInvolves.length > 0, 'Select at least one option.');
        req('proposedStartDate', formData.proposedStartDate);
        req('duration', formData.duration);
        req('multiCenterResearch', formData.multiCenterResearch);
        req('fundingSource', formData.fundingSource);
        if (formData.multiCenterResearch === 'Yes') {
          const num = formData.affiliatedCentersCount === '5 or more' ? 5 : parseInt(formData.affiliatedCentersCount || '1', 10);
          const list = formData.affiliatedCenters || [{ name: '', country: '' }];
          for (let i = 0; i < num; i++) {
            const c = list[i];
            req(`affiliatedCenters.${i}.name`, c?.name?.trim(), 'Center name is required.');
            req(`affiliatedCenters.${i}.country`, c?.country?.trim(), 'Country is required.');
          }
        }
        if (formData.fundingSource === 'Other') {
          req('fundingOther', formData.fundingOther?.trim());
        }
        if (formData.fundingSource && formData.fundingSource !== 'Self-Funding') {
          req('grantSum', formData.grantSum?.trim?.() ?? formData.grantSum);
          req('grantStartDate', formData.grantStartDate);
          req('grantEndDate', formData.grantEndDate);
          req('grantDocuments', formData.grantDocuments.length > 0, 'Upload grant documents.');
        }
        const requiresParticipantDocs = formData.studyInvolves.some((v) => v !== 'None of the above');
        if (requiresParticipantDocs) {
          req('researcherContactName', formData.researcherContactName?.trim());
          req('researcherContactDepartment', formData.researcherContactDepartment?.trim());
          req('researcherContactTelephone', formData.researcherContactTelephone?.trim());
          req('researcherContactEmail', formData.researcherContactEmail?.trim());
          req('informationSheetFiles', formData.informationSheetFiles.length > 0, 'Upload the information sheet.');
          req('consentFormFiles', formData.consentFormFiles.length > 0, 'Upload the consent form(s).');
        }
        break;
      }
      case 4:
        req('dataCapturingMethods', formData.dataCapturingMethods?.trim());
        req('dataStorageMode', formData.dataStorageMode?.trim());
        req('dataAccess', formData.dataAccess?.trim());
        req('confidentialityMeasures', formData.confidentialityMeasures?.trim());
        break;
      case 5:
        req('previousEthicsApproval', formData.previousEthicsApproval);
        req('collectingPersonalInfo', formData.collectingPersonalInfo);
        req('collectingFromOtherSource', formData.collectingFromOtherSource);
        req('involvesDeception', formData.involvesDeception);
        req('intendToPublish', formData.intendToPublish);
        req('bloodTissueSamples', formData.bloodTissueSamples);
        if (formData.previousEthicsApproval === 'Yes') {
          req('previousEthicsApplicationDate', formData.previousEthicsApplicationDate);
          req('previousEthicsProjectApproved', formData.previousEthicsProjectApproved);
          if (formData.previousEthicsProjectApproved === 'Yes') {
            req('ethicsApprovalDocuments', formData.ethicsApprovalDocuments?.length > 0, 'Attach the ethics approval.');
          }
        }
        if (formData.collectingFromOtherSource === 'Yes') {
          req('intendPublishPersonalInfoFromOtherSource', formData.intendPublishPersonalInfoFromOtherSource);
          if (formData.intendPublishPersonalInfoFromOtherSource === 'Yes') {
            req('publishPersonalInfoFromOtherSourceDetails', formData.publishPersonalInfoFromOtherSourceDetails?.trim());
          }
        }
        if (formData.involvesDeception === 'Yes') {
          req('deceptionDebriefingProcedures', formData.deceptionDebriefingProcedures?.trim());
        }
        if (formData.bloodTissueSamples === 'Yes') {
          req('bloodTissueNumberOfSamples', formData.bloodTissueNumberOfSamples?.trim());
          req('bloodTissueSampleType', formData.bloodTissueSampleType?.trim());
          req('bloodTissueQuantityPerSubject', formData.bloodTissueQuantityPerSubject?.trim());
          req('bloodTissueAnalyzedInOman', formData.bloodTissueAnalyzedInOman);
          if (formData.bloodTissueAnalyzedInOman === 'No') {
            req('bloodTissueAbroadInstitution', formData.bloodTissueAbroadInstitution?.trim());
            req('bloodTissueAbroadCountry', formData.bloodTissueAbroadCountry?.trim());
            req('bloodTissueDiscardExplanation', formData.bloodTissueDiscardExplanation?.trim());
            req('bloodTissueAbroadDocuments', formData.bloodTissueAbroadDocuments?.length > 0, 'Upload supporting documents.');
          }
        }
        break;
      case 6:
        req('principalInvestigator.fullName', pi.fullName?.trim(), 'Set the PI name in Section 2.');
        req('principalInvestigator.email', pi.email?.trim(), 'Set the PI email in Section 2.');
        break;
      case 7:
        req('introduction', formData.introduction?.trim());
        if (formData.introduction?.trim() && countWords(formData.introduction) > 500) {
          e.introduction = 'Introduction must be 500 words or fewer.';
        }
        req('objectives', formData.objectives?.trim());
        req('targetPopulation', formData.targetPopulation?.trim());
        req('methodology', formData.methodology?.trim());
        req('statisticalAnalysis', formData.statisticalAnalysis?.trim());
        req('intervention', formData.intervention?.trim());
        req('expectedOutcomes', formData.expectedOutcomes?.trim());
        req('references', formData.references?.trim());
        break;
      default:
        break;
    }
    return e;
  };

  const validateStep = (step) => Object.keys(getStepErrors(step)).length === 0;

  const validateEntireForm = () => {
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) return false;
    }
    return true;
  };

  const getFirstInvalidStep = () => {
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) return step;
    }
    return null;
  };

  const showMissingToast = (errors) => {
    const labels = [...new Set(Object.keys(errors).map(describeSubmissionErrorKey))];
    const preview = labels.slice(0, 4).join(', ');
    const extra = labels.length > 4 ? ` and ${labels.length - 4} more` : '';
    toast.error(`Missing or invalid: ${preview}${extra}.`);
  };

  const handleNext = () => {
    if (currentStep === 2 && formData.principalInvestigator.isFromMCMSS === 'No') {
      setShowMCMSSModal(true);
      return;
    }
    const errors = getStepErrors(currentStep);
    if (Object.keys(errors).length === 0) {
      setFieldErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFieldErrors(errors);
      showMissingToast(errors);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId) => {
    if (stepId === 2 && formData.principalInvestigator.isFromMCMSS === 'No') {
      setShowMCMSSModal(true);
      return;
    }
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getFileName = (file) => file?.name || file?._fileMeta?.name || file?.originalName || 'File';

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
        status: 'draft',
      };

      if (id) {
        await updateSubmission(id, submissionData);
      } else {
        const newSubmission = await createSubmission(submissionData);
        clearAutoSave();
        navigate(`/submission/${newSubmission._id || newSubmission.id}/edit`);
      }
      toast.success('Draft saved successfully!');
    } catch {
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!validateEntireForm()) {
      const invalidStep = getFirstInvalidStep();
      const errors = getStepErrors(invalidStep);
      setFieldErrors(errors);
      setCurrentStep(invalidStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showMissingToast(errors);
      return;
    }
    setFieldErrors({});
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    if (!validateEntireForm()) {
      setShowConfirmModal(false);
      const invalidStep = getFirstInvalidStep();
      const errors = getStepErrors(invalidStep);
      setFieldErrors(errors);
      setCurrentStep(invalidStep);
      showMissingToast(errors);
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

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 1800 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));

      clearAutoSave();
      setLoading(false);
      setShowSuccessView(true);
    } catch {
      toast.error('Failed to submit. Please try again.');
      setLoading(false);
    }
  };

  const isDisabled = formData.principalInvestigator.isFromMCMSS === 'No';

  const renderStep1 = () => (
    <div className="space-y-5">
      <StepHeading title="Terms and Conditions for Approval of Data Protection" />
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Personal data shall only be collected and processed for the specific research purpose.</li>
          <li>The data shall be adequate, relevant and not exclusive in relation to the processing purpose.</li>
          <li>All reasonable measures shall be taken to ensure the correctness of personal data.</li>
          <li>Personal data shall not be disclosed to third parties. All necessary measures shall be implemented to ensure confidentiality and where possible, data shall be anonymous.</li>
          <li>Unless otherwise authorized by the MCMSS research committee, the researcher shall obtain the consent from the data subject and provide the subject with the following information: the researcher's identity, the purpose of processing and the recipients to whom personal data may be disclosed. The data subject shall also be informed about his/her rights, rectify, and where applicable erase his/her data.</li>
          <li>The data collected will be securely stored in such a way that only those mentioned below will be able to gain access to it. Data obtained as a result of the research will be retained for at least 5 years in secure storage. Any personal information held on the participants (such as contact details, audio or video tapes, after they have been transcribed etc.,) may be destroyed at the completion of the research even though the data derived from the research will, in most cases, be kept for much longer or possibly indefinitely.</li>
          <li><strong className="text-foreground">The Principle Investigator should be from the MCMSS.</strong></li>
        </ol>
      </div>
      <CheckboxField
        className={cn(fieldErrors.consentAcknowledged && 'text-destructive')}
        checked={formData.consentAcknowledged}
        onChange={(c) => handleChange('consentAcknowledged', c)}
      >
        I acknowledge that I have read the above text and agree to what is stated. <span className="text-destructive">*</span>
      </CheckboxField>
      {fieldErrors.consentAcknowledged && (
        <p className="text-xs font-medium text-destructive">{fieldErrors.consentAcknowledged}</p>
      )}
      <Field label="Research Title" required htmlFor="researchTitle" error={fieldErrors.researchTitle}>
        <Input
          id="researchTitle"
          value={formData.researchTitle}
          onChange={(e) => handleChange('researchTitle', e.target.value)}
          placeholder="Enter the title of your research"
        />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <StepHeading title="Details of Principal Investigator" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" required htmlFor="piFullName" error={fieldErrors['principalInvestigator.fullName']}>
          <Input id="piFullName" value={formData.principalInvestigator.fullName} onChange={(e) => handleChange('principalInvestigator.fullName', e.target.value)} disabled={isDisabled} />
        </Field>
        <Field label="Job Title / Academic Title" required htmlFor="piJobTitle" error={fieldErrors['principalInvestigator.jobTitle']}>
          <Input id="piJobTitle" value={formData.principalInvestigator.jobTitle} onChange={(e) => handleChange('principalInvestigator.jobTitle', e.target.value)} disabled={isDisabled} />
        </Field>
      </div>
      <Field label="Is the Principal Investigator from MCMSS?" required error={fieldErrors['principalInvestigator.isFromMCMSS']}>
        <OptionRadioGroup
          value={formData.principalInvestigator.isFromMCMSS}
          onChange={(v) => {
            handleChange('principalInvestigator.isFromMCMSS', v);
            if (v === 'No') setShowMCMSSModal(true);
          }}
          options={['Yes', 'No']}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Hospital" required htmlFor="piHospital" error={fieldErrors['principalInvestigator.hospital']}>
          <Select value={formData.principalInvestigator.hospital || ''} onValueChange={(v) => handleChange('principalInvestigator.hospital', v)} disabled={isDisabled}>
            <SelectTrigger id="piHospital" className="w-full"><SelectValue placeholder="Select Hospital" /></SelectTrigger>
            <SelectContent>
              {HOSPITALS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Department" required htmlFor="piDepartment" error={fieldErrors['principalInvestigator.department']}>
          <Input id="piDepartment" value={formData.principalInvestigator.department} onChange={(e) => handleChange('principalInvestigator.department', e.target.value)} disabled={isDisabled} />
        </Field>
        <Field label="Qualifications" required htmlFor="piQualifications" error={fieldErrors['principalInvestigator.qualifications']}>
          <Input id="piQualifications" value={formData.principalInvestigator.qualifications} onChange={(e) => handleChange('principalInvestigator.qualifications', e.target.value)} disabled={isDisabled} />
        </Field>
        <Field label="Mobile" required htmlFor="piTelephone" hint="Omani mobile only (8 digits, starts with 9)" error={fieldErrors['principalInvestigator.telephone']}>
          <PhoneInput
            id="piTelephone"
            disabled={isDisabled}
            value={formData.principalInvestigator.telephone}
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
          />
        </Field>
        <Field label="Email" required htmlFor="piEmail" error={fieldErrors['principalInvestigator.email']}>
          <Input id="piEmail" type="email" value={formData.principalInvestigator.email} onChange={(e) => handleChange('principalInvestigator.email', e.target.value)} disabled={isDisabled} />
        </Field>
      </div>

      <StepHeading title="Co-Investigators" />
      <Field label="How many Co-Investigators are there in the project?" required>
        <OptionRadioGroup
          disabled={isDisabled}
          value={formData.coInvestigatorsCount}
          onChange={(v) => setCountWithList('coInvestigatorsCount', 'coInvestigators', () => ({ name: '', post: '', institute: '' }), v)}
          options={['1', '2', '3', '4', '5 or more']}
        />
      </Field>

      {formData.coInvestigators.map((coInv, index) => (
        <div key={index} className={cn('space-y-4 rounded-lg border border-border p-4', isDisabled && 'opacity-60')}>
          <h4 className="font-medium text-foreground">Co-Investigator {index + 1}</h4>
          <Field label="Name" required>
            <Input value={coInv.name} onChange={(e) => updateCoInvestigator(index, 'name', e.target.value)} disabled={isDisabled} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Professional Post">
              <Input value={coInv.post} onChange={(e) => updateCoInvestigator(index, 'post', e.target.value)} disabled={isDisabled} />
            </Field>
            <Field label="Institute & Department">
              <Input value={coInv.institute} onChange={(e) => updateCoInvestigator(index, 'institute', e.target.value)} disabled={isDisabled} />
            </Field>
          </div>
        </div>
      ))}

      <Field label="Is this research being submitted for Masters or PhD award?" required error={fieldErrors.mastersOrPhd}>
        <OptionRadioGroup disabled={isDisabled} value={formData.mastersOrPhd} onChange={(v) => handleChange('mastersOrPhd', v)} options={['Yes', 'No']} />
      </Field>

      {formData.mastersOrPhd === 'Yes' && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h4 className="font-medium text-foreground">Award details</h4>
          <Field label="1- Research student (Masters/PhD)" required htmlFor="researchStudent" error={fieldErrors.researchStudent}>
            <Input id="researchStudent" value={formData.researchStudent} onChange={(e) => handleChange('researchStudent', e.target.value)} placeholder="e.g. Masters or PhD" disabled={isDisabled} />
          </Field>
          <Field label="2- Supervisor's name" required htmlFor="supervisorName" error={fieldErrors.supervisorName}>
            <Input id="supervisorName" value={formData.supervisorName} onChange={(e) => handleChange('supervisorName', e.target.value)} disabled={isDisabled} />
          </Field>
          <Field label="Supervisor's email" required htmlFor="supervisorEmail" error={fieldErrors.supervisorEmail} hint="The supervisor will receive an email to approve or reject this submission.">
            <Input id="supervisorEmail" type="email" value={formData.supervisorEmail} onChange={(e) => handleChange('supervisorEmail', e.target.value)} placeholder="supervisor@example.com" disabled={isDisabled} />
          </Field>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <StepHeading title="Project Description" />
      <Field label="Research Type" required error={fieldErrors.researchType}>
        <div className="grid gap-2 sm:grid-cols-2">
          {RESEARCH_TYPES.map((type) => (
            <CheckboxField key={type} checked={formData.researchType.includes(type)} onChange={(c) => handleCheckboxChange('researchType', type, c)}>
              {type}
            </CheckboxField>
          ))}
        </div>
      </Field>
      {formData.researchType.includes('Other') && (
        <Field label="Please specify other research type(s)" required htmlFor="researchTypeOther" hint="Separate multiple types with commas" error={fieldErrors.researchTypeOther}>
          <Input id="researchTypeOther" value={formData.researchTypeOther} onChange={(e) => handleChange('researchTypeOther', e.target.value)} placeholder="e.g. Genomics, Health economics" />
        </Field>
      )}
      <Field label="Will this study involve any of the following, beyond routine clinical care?" required hint="(tick all that apply)" error={fieldErrors.studyInvolves}>
        <div className="space-y-2">
          {STUDY_INVOLVES_OPTIONS.map((option) => (
            <CheckboxField key={option} checked={formData.studyInvolves.includes(option)} onChange={(c) => handleCheckboxChange('studyInvolves', option, c)}>
              {option}
            </CheckboxField>
          ))}
        </div>
      </Field>

      {formData.studyInvolves.some((v) => v !== 'None of the above') && (
        <>
          <StepHeading title="Information Sheet Requirements" />
          <div className="rounded-lg border border-info/30 bg-info-muted/40 p-4 text-sm leading-relaxed text-foreground/80">
            <p>Information sheet is a clear and concise document that will be given to potential participants explaining the details of the study so that they can make an informed decision about participating.</p>
            <p className="mt-2">At a minimum the Information Sheet must describe in lay terms:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>the nature and purpose of the research;</li>
              <li>the procedure and how long it will take;</li>
              <li>any risk or discomfort involved;</li>
              <li>who will have access and under what conditions to any personal information;</li>
              <li>the eventual disposal of data collected;</li>
              <li>the name and contact details of the staff member responsible for the project and an invitation to contact that person over any matter associated with the project</li>
            </ul>
            <p className="mt-2"><strong>What if Participants have any Questions?</strong></p>
            <p>If you have any questions about our project, either now or in the future, please feel free to contact:</p>
          </div>
          <Field label="1- Name of Researcher" required htmlFor="researcherContactName" error={fieldErrors.researcherContactName}>
            <Input id="researcherContactName" value={formData.researcherContactName} onChange={(e) => handleChange('researcherContactName', e.target.value)} placeholder="Enter researcher name" />
          </Field>
          <Field label="2- Department of" required htmlFor="researcherContactDepartment" error={fieldErrors.researcherContactDepartment}>
            <Input id="researcherContactDepartment" value={formData.researcherContactDepartment} onChange={(e) => handleChange('researcherContactDepartment', e.target.value)} placeholder="Enter department" />
          </Field>
          <Field label="3- Telephone Number" required htmlFor="researcherContactTelephone" error={fieldErrors.researcherContactTelephone}>
            <PhoneInput
              id="researcherContactTelephone"
              value={formData.researcherContactTelephone}
              onChange={(e) => {
                let raw = e.target.value.replace(/\D/g, '');
                if (raw.startsWith('968')) raw = raw.slice(3);
                if (raw === '' || (raw.startsWith('9') && raw.length <= 8)) {
                  handleChange('researcherContactTelephone', raw ? `+968${raw}` : '');
                }
              }}
            />
          </Field>
          <Field label="4- Email Address" required htmlFor="researcherContactEmail" error={fieldErrors.researcherContactEmail}>
            <Input id="researcherContactEmail" type="email" value={formData.researcherContactEmail} onChange={(e) => handleChange('researcherContactEmail', e.target.value)} placeholder="Enter email address" />
          </Field>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">The Information Sheet must conclude with the statement:</strong> "The Medical City For Military and Security Services Research Committee has reviewed and approved this project."
          </div>
          <Field label="Please upload the information sheet" required hint="Please upload both the English and Arabic versions (maximum 2 files)." error={fieldErrors.informationSheetFiles}>
            <FileUpload field="informationSheetFiles" files={formData.informationSheetFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" maxFiles={2} error={fieldErrors.informationSheetFiles} />
          </Field>

          <StepHeading title="Consent Form Requirements" />
          <div className="rounded-lg border border-info/30 bg-info-muted/40 p-4 text-sm leading-relaxed text-foreground/80">
            <p>The Consent Form must make it clear that a participant:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
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
          <Field label="Please upload the consent form(s) in Arabic and English" required error={fieldErrors.consentFormFiles}>
            <FileUpload field="consentFormFiles" files={formData.consentFormFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" error={fieldErrors.consentFormFiles} />
          </Field>
        </>
      )}

      <StepHeading title="Project Details" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Proposed Date Of Commencement" required htmlFor="proposedStartDate" error={fieldErrors.proposedStartDate}>
          <Input id="proposedStartDate" type="date" value={formData.proposedStartDate} onChange={(e) => handleChange('proposedStartDate', e.target.value)} />
        </Field>
        <Field label="Duration (Months)" required htmlFor="duration" error={fieldErrors.duration}>
          <Input id="duration" type="number" min="1" value={formData.duration} onChange={(e) => handleChange('duration', e.target.value)} />
        </Field>
      </div>
      <Field label="Multi-center research" required error={fieldErrors.multiCenterResearch}>
        <OptionRadioGroup
          value={formData.multiCenterResearch}
          onChange={(v) => {
            if (v === 'No') {
              setFormData((prev) => ({ ...prev, multiCenterResearch: v, affiliatedCentersCount: '1', affiliatedCenters: [{ name: '', country: '' }] }));
            } else {
              setFormData((prev) => ({ ...prev, multiCenterResearch: v }));
            }
          }}
          options={['Yes', 'No']}
        />
      </Field>

      {formData.multiCenterResearch === 'Yes' && (
        <>
          <Field label="How many affiliated centers?" required>
            <OptionRadioGroup
              value={formData.affiliatedCentersCount}
              onChange={(v) => setCountWithList('affiliatedCentersCount', 'affiliatedCenters', () => ({ name: '', country: '' }), v)}
              options={['1', '2', '3', '4', '5 or more']}
            />
          </Field>
          {(formData.affiliatedCenters || [{ name: '', country: '' }]).map((center, index) => (
            <div key={index} className="space-y-4 rounded-lg border border-border p-4">
              <h4 className="font-medium text-foreground">Affiliated Center {index + 1}</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={fieldErrors[`affiliatedCenters.${index}.name`]}>
                  <Input value={center.name} onChange={(e) => updateAffiliatedCenter(index, 'name', e.target.value)} placeholder="Center name" />
                </Field>
                <Field label="Country of Affiliation" required error={fieldErrors[`affiliatedCenters.${index}.country`]}>
                  <CountrySelect value={center.country} onChange={(v) => updateAffiliatedCenter(index, 'country', v)} error={fieldErrors[`affiliatedCenters.${index}.country`]} />
                </Field>
              </div>
            </div>
          ))}
        </>
      )}

      <StepHeading title="Details of Funding Source" />
      <Field label="Funding Source" required error={fieldErrors.fundingSource}>
        <OptionRadioGroup className="flex-col gap-2" value={formData.fundingSource} onChange={(v) => handleChange('fundingSource', v)} options={FUNDING_SOURCES} />
      </Field>
      {formData.fundingSource === 'Other' && (
        <Field label="Please specify" required htmlFor="fundingOther" error={fieldErrors.fundingOther}>
          <Input id="fundingOther" value={formData.fundingOther} onChange={(e) => handleChange('fundingOther', e.target.value)} />
        </Field>
      )}

      {formData.fundingSource && formData.fundingSource !== 'Self-Funding' && (
        <>
          <StepHeading title="Grant Details" />
          <Field label="Grant Sum" required htmlFor="grantSum" error={fieldErrors.grantSum}>
            <Input id="grantSum" value={formData.grantSum} onChange={(e) => handleChange('grantSum', e.target.value)} placeholder="Enter grant amount" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Validity Period: Start Date" required htmlFor="grantStartDate" error={fieldErrors.grantStartDate}>
              <Input id="grantStartDate" type="date" value={formData.grantStartDate} onChange={(e) => handleChange('grantStartDate', e.target.value)} />
            </Field>
            <Field label="Validity Period: End Date" required htmlFor="grantEndDate" error={fieldErrors.grantEndDate}>
              <Input id="grantEndDate" type="date" value={formData.grantEndDate} onChange={(e) => handleChange('grantEndDate', e.target.value)} />
            </Field>
          </div>
          <Field label="Please upload documents confirming the details of the grant" required error={fieldErrors.grantDocuments}>
            <FileUpload field="grantDocuments" files={formData.grantDocuments} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" error={fieldErrors.grantDocuments} />
          </Field>
        </>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <StepHeading title="Handling of Confidential Information" />
      <Field label="What form of data capturing method(s) used in your research? (e.g. typewritten records, audiotapes, videotapes, machine generated reports etc.)" required htmlFor="dataCapturingMethods" error={fieldErrors.dataCapturingMethods}>
        <Textarea id="dataCapturingMethods" value={formData.dataCapturingMethods} onChange={(e) => handleChange('dataCapturingMethods', e.target.value)} placeholder="Describe the data capturing methods used" />
      </Field>
      <Field label="Mode of data Storage" required htmlFor="dataStorageMode" error={fieldErrors.dataStorageMode}>
        <Textarea id="dataStorageMode" value={formData.dataStorageMode} onChange={(e) => handleChange('dataStorageMode', e.target.value)} placeholder="Describe how data will be stored" />
      </Field>
      <Field label="Who will have access to data?" required htmlFor="dataAccess" error={fieldErrors.dataAccess}>
        <Textarea id="dataAccess" value={formData.dataAccess} onChange={(e) => handleChange('dataAccess', e.target.value)} placeholder="List who will have access to the data" />
      </Field>
      <Field label="How do you secure subjects confidentiality for this method?" required htmlFor="confidentialityMeasures" error={fieldErrors.confidentialityMeasures}>
        <Textarea id="confidentialityMeasures" value={formData.confidentialityMeasures} onChange={(e) => handleChange('confidentialityMeasures', e.target.value)} placeholder="Describe confidentiality measures" />
      </Field>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <StepHeading title="Ethical Considerations" />
      <Field label="Have you applied for ethics approval for this research project before?" required error={fieldErrors.previousEthicsApproval}>
        <OptionRadioGroup
          value={formData.previousEthicsApproval}
          onChange={(v) => {
            if (v === 'No') {
              setFormData((prev) => ({ ...prev, previousEthicsApproval: v, previousEthicsApplicationDate: '', previousEthicsProjectApproved: '', ethicsApprovalDocuments: [] }));
            } else {
              setFormData((prev) => ({ ...prev, previousEthicsApproval: v }));
            }
          }}
          options={['Yes', 'No']}
        />
      </Field>
      {formData.previousEthicsApproval === 'Yes' && (
        <>
          <Field label="When did you apply?" required htmlFor="previousEthicsApplicationDate" error={fieldErrors.previousEthicsApplicationDate}>
            <Input id="previousEthicsApplicationDate" type="date" value={formData.previousEthicsApplicationDate} onChange={(e) => handleChange('previousEthicsApplicationDate', e.target.value)} />
          </Field>
          <Field label="Was the research project approved?" required error={fieldErrors.previousEthicsProjectApproved}>
            <OptionRadioGroup
              value={formData.previousEthicsProjectApproved}
              onChange={(v) => {
                if (v === 'No') {
                  setFormData((prev) => ({ ...prev, previousEthicsProjectApproved: 'No', ethicsApprovalDocuments: [] }));
                } else {
                  handleChange('previousEthicsProjectApproved', v);
                }
              }}
              options={['Yes', 'No']}
            />
          </Field>
          {formData.previousEthicsProjectApproved === 'Yes' && (
            <Field label="Please attach a copy of ethics approval(s) obtained." required error={fieldErrors.ethicsApprovalDocuments}>
              <FileUpload field="ethicsApprovalDocuments" files={formData.ethicsApprovalDocuments} onAdd={(_, files) => handleEthicsApprovalFiles(files)} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" maxFiles={1} error={fieldErrors.ethicsApprovalDocuments} />
            </Field>
          )}
        </>
      )}
      <Field label="Are you collecting and storing personal information directly from the individual concerned that could identify the individual?" required error={fieldErrors.collectingPersonalInfo}>
        <OptionRadioGroup value={formData.collectingPersonalInfo} onChange={(v) => handleChange('collectingPersonalInfo', v)} options={['Yes', 'No']} />
      </Field>
      <Field label="Are you collecting information about individuals from another source?" required error={fieldErrors.collectingFromOtherSource}>
        <OptionRadioGroup
          value={formData.collectingFromOtherSource}
          onChange={(v) => {
            if (v === 'No') {
              setFormData((prev) => ({ ...prev, collectingFromOtherSource: v, intendPublishPersonalInfoFromOtherSource: '', publishPersonalInfoFromOtherSourceDetails: '' }));
            } else {
              setFormData((prev) => ({ ...prev, collectingFromOtherSource: v }));
            }
          }}
          options={['Yes', 'No']}
        />
      </Field>
      {formData.collectingFromOtherSource === 'Yes' && (
        <Field label="Do you intend to publish any personal information they have provided?" required error={fieldErrors.intendPublishPersonalInfoFromOtherSource}>
          <OptionRadioGroup
            value={formData.intendPublishPersonalInfoFromOtherSource}
            onChange={(v) => {
              if (v === 'No') {
                setFormData((prev) => ({ ...prev, intendPublishPersonalInfoFromOtherSource: v, publishPersonalInfoFromOtherSourceDetails: '' }));
              } else {
                setFormData((prev) => ({ ...prev, intendPublishPersonalInfoFromOtherSource: v }));
              }
            }}
            options={['Yes', 'No']}
          />
        </Field>
      )}
      {formData.collectingFromOtherSource === 'Yes' && formData.intendPublishPersonalInfoFromOtherSource === 'Yes' && (
        <Field label="Please specify in what form you intend to do this?" required htmlFor="publishPersonalInfoFromOtherSourceDetails" error={fieldErrors.publishPersonalInfoFromOtherSourceDetails}>
          <Textarea id="publishPersonalInfoFromOtherSourceDetails" rows={4} value={formData.publishPersonalInfoFromOtherSourceDetails} onChange={(e) => handleChange('publishPersonalInfoFromOtherSourceDetails', e.target.value)} placeholder="Describe the form in which you intend to publish this information" />
        </Field>
      )}
      <Field label="Does the research involve any form of deception?" required error={fieldErrors.involvesDeception}>
        <OptionRadioGroup
          value={formData.involvesDeception}
          onChange={(v) => {
            if (v === 'No') {
              setFormData((prev) => ({ ...prev, involvesDeception: v, deceptionDebriefingProcedures: '' }));
            } else {
              setFormData((prev) => ({ ...prev, involvesDeception: v }));
            }
          }}
          options={['Yes', 'No']}
        />
      </Field>
      {formData.involvesDeception === 'Yes' && (
        <Field label="Please explain all debriefing procedures." required htmlFor="deceptionDebriefingProcedures" error={fieldErrors.deceptionDebriefingProcedures}>
          <Textarea id="deceptionDebriefingProcedures" rows={5} value={formData.deceptionDebriefingProcedures} onChange={(e) => handleChange('deceptionDebriefingProcedures', e.target.value)} placeholder="Describe how and when participants will be debriefed" />
        </Field>
      )}
      <Field label="Do you intend to publish or disseminate the findings?" required error={fieldErrors.intendToPublish}>
        <OptionRadioGroup value={formData.intendToPublish} onChange={(v) => handleChange('intendToPublish', v)} options={['Yes', 'No']} />
      </Field>
      <Field label="Are blood and/or tissue samples used for analysis?" required error={fieldErrors.bloodTissueSamples}>
        <OptionRadioGroup
          value={formData.bloodTissueSamples}
          onChange={(v) => {
            if (v === 'No') {
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
                bloodTissueAbroadDocuments: [],
              }));
            } else {
              setFormData((prev) => ({ ...prev, bloodTissueSamples: v }));
            }
          }}
          options={['Yes', 'No']}
        />
      </Field>
      {formData.bloodTissueSamples === 'Yes' && (
        <div className="space-y-5 rounded-lg border border-border p-4">
          <Field label="Please specify: Number of samples" required htmlFor="bloodTissueNumberOfSamples" error={fieldErrors.bloodTissueNumberOfSamples}>
            <Input id="bloodTissueNumberOfSamples" value={formData.bloodTissueNumberOfSamples} onChange={(e) => handleChange('bloodTissueNumberOfSamples', e.target.value)} />
          </Field>
          <Field label="Please specify: Type of sample" required htmlFor="bloodTissueSampleType" error={fieldErrors.bloodTissueSampleType}>
            <Input id="bloodTissueSampleType" value={formData.bloodTissueSampleType} onChange={(e) => handleChange('bloodTissueSampleType', e.target.value)} />
          </Field>
          <Field label="Please specify: Quantity of sample from each subject" required htmlFor="bloodTissueQuantityPerSubject" error={fieldErrors.bloodTissueQuantityPerSubject}>
            <Input id="bloodTissueQuantityPerSubject" value={formData.bloodTissueQuantityPerSubject} onChange={(e) => handleChange('bloodTissueQuantityPerSubject', e.target.value)} />
          </Field>
          <Field label="Will blood/tissue samples be analyzed in Oman?" required error={fieldErrors.bloodTissueAnalyzedInOman}>
            <OptionRadioGroup
              value={formData.bloodTissueAnalyzedInOman}
              onChange={(v) => {
                if (v === 'Yes') {
                  setFormData((prev) => ({ ...prev, bloodTissueAnalyzedInOman: 'Yes', bloodTissueAbroadInstitution: '', bloodTissueAbroadCountry: '', bloodTissueDiscardExplanation: '', bloodTissueAbroadDocuments: [] }));
                } else {
                  handleChange('bloodTissueAnalyzedInOman', v);
                }
              }}
              options={['Yes', 'No']}
            />
          </Field>
          {formData.bloodTissueAnalyzedInOman === 'No' && (
            <>
              <Field label="Name of institution (where samples will be analyzed)" required htmlFor="bloodTissueAbroadInstitution" error={fieldErrors.bloodTissueAbroadInstitution}>
                <Input id="bloodTissueAbroadInstitution" value={formData.bloodTissueAbroadInstitution} onChange={(e) => handleChange('bloodTissueAbroadInstitution', e.target.value)} />
              </Field>
              <Field label="Country" required htmlFor="bloodTissueAbroadCountry" error={fieldErrors.bloodTissueAbroadCountry}>
                <CountrySelect id="bloodTissueAbroadCountry" value={formData.bloodTissueAbroadCountry} onChange={(v) => handleChange('bloodTissueAbroadCountry', v)} error={fieldErrors.bloodTissueAbroadCountry} />
              </Field>
              <Field label="Explain how you will discard the samples after analysis" required htmlFor="bloodTissueDiscardExplanation" error={fieldErrors.bloodTissueDiscardExplanation}>
                <Textarea id="bloodTissueDiscardExplanation" rows={4} value={formData.bloodTissueDiscardExplanation} onChange={(e) => handleChange('bloodTissueDiscardExplanation', e.target.value)} />
              </Field>
              <Field label="Please upload all supporting documents" required error={fieldErrors.bloodTissueAbroadDocuments}>
                <FileUpload field="bloodTissueAbroadDocuments" files={formData.bloodTissueAbroadDocuments} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" maxFiles={5} error={fieldErrors.bloodTissueAbroadDocuments} />
              </Field>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <StepHeading title="Declaration of Investigator" />
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>I (we) certify to the best of my (our) knowledge, the information given in this application is correct and the details of this application are true representation of the research to be undertaken. I (we) agree to inform the MCMSS research committee of any variations to the research during the application period or during the conduct of my (our) research.</p>
        <p className="mt-2">I (we) will ensure that patient's samples sent abroad will be used only for the research purposes described in the application of ethics committee approval.</p>
      </div>
      <Field label="Name of Principal Investigator (PI)" required htmlFor="piName" hint="Taken from the Principal Investigator details in Section 2. Update the name there if needed.">
        <Input id="piName" readOnly value={formData.principalInvestigator?.fullName || ''} className="bg-muted" />
      </Field>
      <Field label="Email of Principal Investigator (PI)" required htmlFor="piDeclarationEmail" hint="Taken from the Principal Investigator details in Section 2. Update the email there if needed.">
        <Input id="piDeclarationEmail" type="email" readOnly value={formData.principalInvestigator?.email || ''} className="bg-muted" />
      </Field>
      <div className="rounded-lg border border-info/30 bg-info-muted/40 p-4 text-sm leading-relaxed text-foreground/80">
        On submission, the Principal Investigator above receives an email to approve or disapprove this declaration. Review cannot begin until the PI approves.
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-5">
      <StepHeading title="Research Proposal" />
      <Field label="Introduction (Max 500 words)" required htmlFor="introduction" hint={`${countWords(formData.introduction)} / 500 words`} error={fieldErrors.introduction}>
        <Textarea id="introduction" rows={6} value={formData.introduction} onChange={(e) => handleChange('introduction', limitWords(e.target.value, 500))} placeholder="Provide an introduction to your research" />
      </Field>
      <Field label="Objectives (Primary & Secondary)" required htmlFor="objectives" error={fieldErrors.objectives}>
        <Textarea id="objectives" rows={4} value={formData.objectives} onChange={(e) => handleChange('objectives', e.target.value)} placeholder="List your primary and secondary objectives" />
      </Field>
      <Field label="Target Population" required htmlFor="targetPopulation" error={fieldErrors.targetPopulation}>
        <Textarea id="targetPopulation" rows={3} value={formData.targetPopulation} onChange={(e) => handleChange('targetPopulation', e.target.value)} placeholder="Describe your target population" />
      </Field>
      <Field label="Methodology" required htmlFor="methodology" error={fieldErrors.methodology}>
        <Textarea id="methodology" rows={6} value={formData.methodology} onChange={(e) => handleChange('methodology', e.target.value)} placeholder="Describe your research methodology" />
      </Field>
      <Field label="Sample Size Calculation" required>
        <FileUpload field="sampleSizeFiles" files={formData.sampleSizeFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" />
      </Field>
      <Field label="Statistical Analysis" required htmlFor="statisticalAnalysis" error={fieldErrors.statisticalAnalysis}>
        <Textarea id="statisticalAnalysis" rows={4} value={formData.statisticalAnalysis} onChange={(e) => handleChange('statisticalAnalysis', e.target.value)} placeholder="Describe your statistical analysis methods" />
      </Field>
      <Field label="Intervention" required htmlFor="intervention" error={fieldErrors.intervention}>
        <Textarea id="intervention" rows={4} value={formData.intervention} onChange={(e) => handleChange('intervention', e.target.value)} placeholder="Describe any interventions" />
      </Field>
      <Field label="Data and Research Variables">
        <FileUpload field="dataVariablesFiles" files={formData.dataVariablesFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" />
      </Field>
      <Field label="Expected Outcomes" required htmlFor="expectedOutcomes" error={fieldErrors.expectedOutcomes}>
        <Textarea id="expectedOutcomes" rows={4} value={formData.expectedOutcomes} onChange={(e) => handleChange('expectedOutcomes', e.target.value)} placeholder="Describe expected outcomes" />
      </Field>
      <Field label="References" required htmlFor="references" error={fieldErrors.references}>
        <Textarea id="references" rows={6} value={formData.references} onChange={(e) => handleChange('references', e.target.value)} placeholder="List your references" />
      </Field>
      <Field label="Upload Research Proposal" required>
        <FileUpload field="researchProposalFiles" files={formData.researchProposalFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} lockExisting={isRevision} accept=".pdf,.doc,.docx" />
      </Field>
    </div>
  );

  const STEP_RENDERERS = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
  };

  if (showSuccessView) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <CheckCircle2 className="size-16 text-success" />
            <h2 className="text-2xl font-bold text-foreground">Submission Successful!</h2>
            <p className="text-muted-foreground">Your research has been submitted for review.</p>
            <p className="text-sm text-muted-foreground">You will be notified once the review process is complete.</p>
            <Button className="mt-2" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={user}
        onLogout={onLogout}
        title="Research Ethics Submission"
        subtitle="Multi-step application form"
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <X />
            Cancel
          </Button>
        }
      />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="space-y-6">
            <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

            <div className="border-t border-border pt-6">{STEP_RENDERERS[currentStep]?.()}</div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <Button variant="secondary" onClick={handleBack}>
                    <ArrowLeft />
                    Back
                  </Button>
                )}
                {!id && autoSaveStatus && (
                  <span className={cn('text-sm italic', autoSaveStatus === 'Saving...' ? 'text-primary' : 'text-success')}>
                    {autoSaveStatus}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button variant="plum" onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* MCMSS Requirement Modal */}
      <Dialog open={showMCMSSModal} onOpenChange={setShowMCMSSModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>MCMSS Requirement</DialogTitle>
            <DialogDescription>The Principle Investigator should be from the MCMSS.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowMCMSSModal(false);
                handleChange('principalInvestigator.isFromMCMSS', '');
              }}
            >
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>Are you sure you want to submit this form for review?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button onClick={confirmSubmit} disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              Confirm Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubmissionForm;
