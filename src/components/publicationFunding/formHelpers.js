import { PF_FILE_FIELDS, ATTACHMENT_ITEMS } from './formData.js';

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

export function validateStep(step, formData) {
  switch (step) {
    case 1:
      return (
        formData.fullName?.trim() &&
        formData.department?.trim() &&
        formData.position?.trim() &&
        formData.email?.trim() &&
        formData.phone?.trim()
      );
    case 2:
      if (
        !formData.manuscriptTitle?.trim() ||
        !formData.journalName?.trim() ||
        !formData.dateOfAcceptance ||
        !formData.scopusIndexed ||
        !formData.journalQuartile ||
        !formData.quartileSource
      ) {
        return false;
      }
      if (formData.quartileSource === 'Other' && !formData.quartileSourceOther?.trim()) {
        return false;
      }
      return true;
    case 3:
      return formData.applicantRole?.length > 0 && formData.mcmssAffiliationStated;
    case 4:
      if (!formData.publicationType) return false;
      if (formData.publicationType === 'Other') {
        return formData.publicationTypeOther?.trim() && formData.publicationTypeOtherExplanation?.trim();
      }
      return true;
    case 5:
      if (!formData.priorEthicalApproval) return false;
      if (formData.priorEthicalApproval === 'Yes') {
        return (
          formData.irbApprovalNumber?.trim() &&
          formData.approvingInstitution?.trim() &&
          formData.ethicsApprovalDate
        );
      }
      if (formData.priorEthicalApproval === 'No') {
        if (!formData.ethicsNotRequiredReason) return false;
        if (formData.ethicsNotRequiredReason === 'Other') {
          return formData.ethicsNotRequiredOther?.trim();
        }
      }
      return true;
    case 6:
      return formData.totalRequestedAmount?.trim() && formData.dateOfPayment;
    case 7: {
      const checklistValid = Object.values(formData.eligibilityChecklist || {}).every(Boolean);
      if (!checklistValid) return false;
      if (formData.eligibilityChecklist?.frontPageAttached) {
        const frontPageFiles = formData.frontPageOrArticleFiles || [];
        if (frontPageFiles.length === 0) return false;
      }
      if (formData.eligibilityChecklist?.proofOfPaymentAttached) {
        const paymentFiles = [...(formData.proofOfPaymentFiles || []), ...(formData.invoiceReceiptFiles || [])];
        if (paymentFiles.length === 0) return false;
      }
      return true;
    }
    case 8: {
      for (const { key, files } of ATTACHMENT_ITEMS) {
        if (formData.attachmentChecklist?.[key] && (!formData[files] || formData[files].length === 0)) {
          return false;
        }
      }
      if (formData.priorEthicalApproval === 'Yes') {
        const irbFiles = formData.irbApprovalFiles || [];
        if (irbFiles.length === 0) return false;
      }
      return true;
    }
    case 9:
      return (
        formData.applicantDeclarationName?.trim() &&
        formData.applicantSignature?.trim() &&
        formData.applicantDeclarationDate
      );
    default:
      return true;
  }
}

export function validateEntireForm(formData, stepsCount) {
  for (let step = 1; step <= stepsCount; step++) {
    if (!validateStep(step, formData)) return false;
  }
  return true;
}
