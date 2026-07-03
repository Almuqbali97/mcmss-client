import { PF_FILE_FIELDS, ATTACHMENT_ITEMS, ELIGIBILITY_ITEMS, FUNDING_ITEMS } from './formData.js';

export function sanitizeFormData(data) {
  if (!data) return data;
  if (data instanceof File) {
    return { _fileMeta: { name: data.name, size: data.size, type: data.type } };
  }
  if (Array.isArray(data)) return data.map(sanitizeFormData);
  if (typeof data === 'object' && data !== null) {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = sanitizeFormData(v);
    }
    return out;
  }
  return data;
}

export function getFileName(file) {
  return file?.name || file?._fileMeta?.name || file?.originalName || 'File';
}

export function hasFileObjects(obj) {
  if (obj instanceof File) return true;
  if (Array.isArray(obj)) return obj.some(hasFileObjects);
  if (obj && typeof obj === 'object') return Object.values(obj).some(hasFileObjects);
  return false;
}

export function buildPublicationFundingFormData(data) {
  const fd = new FormData();
  fd.append('manuscriptTitle', data.manuscriptTitle || '');
  fd.append('applicantName', data.applicantName || '');
  fd.append('status', data.status || 'draft');

  const formData = data.formData || data;
  const sanitized = { ...formData };

  for (const field of PF_FILE_FIELDS) {
    if (Array.isArray(sanitized[field])) {
      const files = sanitized[field].filter((f) => f instanceof File);
      const existing = sanitized[field].filter((f) => !(f instanceof File));
      sanitized[field] = existing;
      for (const file of files) {
        fd.append(field, file);
      }
    }
  }

  fd.append('formDataJson', JSON.stringify(sanitized));
  return fd;
}

const ELIGIBILITY_LABELS = Object.fromEntries(ELIGIBILITY_ITEMS.map((i) => [i.key, i.label]));
const ATTACHMENT_LABELS = Object.fromEntries(ATTACHMENT_ITEMS.map((i) => [i.files, i.label]));

/**
 * Returns an object mapping field keys to error messages for the given step.
 * Empty object means the step is valid.
 */
export function getStepErrors(step, formData) {
  const e = {};
  const req = (key, ok, msg = 'This field is required.') => {
    if (!ok) e[key] = msg;
  };

  switch (step) {
    case 1:
      req('fullName', formData.fullName?.trim());
      req('department', formData.department?.trim());
      req('position', formData.position?.trim());
      req('email', formData.email?.trim());
      req('phone', formData.phone?.trim());
      break;
    case 2:
      req('manuscriptTitle', formData.manuscriptTitle?.trim());
      req('journalName', formData.journalName?.trim());
      req('dateOfAcceptance', formData.dateOfAcceptance);
      req('scopusIndexed', formData.scopusIndexed);
      req('journalQuartile', formData.journalQuartile);
      req('quartileSource', formData.quartileSource);
      if (formData.quartileSource === 'Other') {
        req('quartileSourceOther', formData.quartileSourceOther?.trim());
      }
      break;
    case 3:
      req('applicantRole', formData.applicantRole?.length > 0, 'Select at least one role.');
      req('mcmssAffiliationStated', formData.mcmssAffiliationStated);
      break;
    case 4:
      req('publicationType', formData.publicationType);
      if (formData.publicationType === 'Other') {
        req('publicationTypeOther', formData.publicationTypeOther?.trim());
        req('publicationTypeOtherExplanation', formData.publicationTypeOtherExplanation?.trim());
      }
      break;
    case 5:
      req('priorEthicalApproval', formData.priorEthicalApproval);
      if (formData.priorEthicalApproval === 'Yes') {
        req('irbApprovalNumber', formData.irbApprovalNumber?.trim());
        req('approvingInstitution', formData.approvingInstitution?.trim());
        req('ethicsApprovalDate', formData.ethicsApprovalDate);
        req('irbApprovalFiles', (formData.irbApprovalFiles || []).length > 0, 'Upload the IRB / ethics approval letter.');
      }
      if (formData.priorEthicalApproval === 'No') {
        req('ethicsNotRequiredReason', formData.ethicsNotRequiredReason);
        if (formData.ethicsNotRequiredReason === 'Other') {
          req('ethicsNotRequiredOther', formData.ethicsNotRequiredOther?.trim());
        }
      }
      break;
    case 6:
      for (const { key, label } of FUNDING_ITEMS) {
        const item = formData.fundingItems?.[key] || {};
        if (item.requested === 'Yes') {
          const amt = String(item.amount ?? '').trim();
          req(`fundingItems.${key}.amount`, amt !== '', `Enter an amount for "${label}".`);
        }
      }
      req('totalRequestedAmount', String(formData.totalRequestedAmount ?? '').trim());
      req('dateOfPayment', formData.dateOfPayment);
      break;
    case 7: // Attachments
      for (const { key, files, label, required } of ATTACHMENT_ITEMS) {
        if (required || formData.attachmentChecklist?.[key]) {
          req(files, (formData[files] || []).length > 0, `Upload a file for "${label}".`);
        }
      }
      break;
    case 8: // Eligibility
      for (const { key, label } of ELIGIBILITY_ITEMS) {
        req(`eligibilityChecklist.${key}`, !!formData.eligibilityChecklist?.[key], `Please confirm: ${label}`);
      }
      if (formData.eligibilityChecklist?.frontPageAttached && (formData.frontPageOrArticleFiles || []).length === 0) {
        req('frontPageOrArticleFiles', false, 'Attach the published article front page (Section 2).');
      }
      if (formData.eligibilityChecklist?.proofOfPaymentAttached) {
        const paymentFiles = [...(formData.proofOfPaymentFiles || []), ...(formData.invoiceReceiptFiles || [])];
        req('proofOfPaymentFiles', paymentFiles.length > 0, 'Attach proof of payment (Section 6).');
      }
      break;
    case 9:
      req('applicantDeclarationName', formData.applicantDeclarationName?.trim());
      req('applicantDeclarationDate', formData.applicantDeclarationDate);
      break;
    default:
      break;
  }
  return e;
}

/* Human-readable labels for the "what is missing" summary. */
export const PF_FIELD_LABELS = {
  fullName: 'Full name',
  department: 'Department / Unit',
  position: 'Position / Title',
  email: 'Email address',
  phone: 'Phone number',
  manuscriptTitle: 'Manuscript title',
  journalName: 'Journal name',
  dateOfAcceptance: 'Date of acceptance',
  scopusIndexed: 'Scopus indexed',
  journalQuartile: 'Journal quartile',
  quartileSource: 'Source of quartile data',
  quartileSourceOther: 'Quartile source (specify)',
  applicantRole: 'Applicant role',
  mcmssAffiliationStated: 'Institutional affiliation stated',
  publicationType: 'Type of publication',
  publicationTypeOther: 'Publication type (specify)',
  publicationTypeOtherExplanation: 'Eligibility explanation',
  priorEthicalApproval: 'Prior ethical approval',
  irbApprovalNumber: 'IRB / ethics approval number',
  approvingInstitution: 'Approving institution',
  ethicsApprovalDate: 'Date of approval',
  ethicsNotRequiredReason: 'Reason ethics not required',
  ethicsNotRequiredOther: 'Reason (specify)',
  totalRequestedAmount: 'Total requested amount',
  dateOfPayment: 'Date of payment',
  frontPageOrArticleFiles: 'Front page / article attachment',
  proofOfPaymentFiles: 'Proof of payment',
  irbApprovalFiles: 'IRB approval letter',
  applicantDeclarationName: 'Applicant name (declaration)',
  applicantDeclarationDate: 'Declaration date',
};

export function describeErrorKey(key) {
  if (PF_FIELD_LABELS[key]) return PF_FIELD_LABELS[key];
  if (key.startsWith('fundingItems.')) return 'Funding item amount';
  if (key.startsWith('eligibilityChecklist.')) return 'Eligibility confirmation';
  if (ATTACHMENT_LABELS[key]) return ATTACHMENT_LABELS[key];
  if (ELIGIBILITY_LABELS[key]) return ELIGIBILITY_LABELS[key];
  return key;
}

export function validateStep(step, formData) {
  return Object.keys(getStepErrors(step, formData)).length === 0;
}

export function validateEntireForm(formData, stepsCount) {
  for (let step = 1; step <= stepsCount; step++) {
    if (!validateStep(step, formData)) return false;
  }
  return true;
}

export function getFirstInvalidStep(formData, stepsCount) {
  for (let step = 1; step <= stepsCount; step++) {
    if (!validateStep(step, formData)) return step;
  }
  return null;
}
