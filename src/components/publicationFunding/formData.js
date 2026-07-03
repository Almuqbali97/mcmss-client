export const PF_STEPS = [
  { id: 1, title: 'Applicant Info', section: 'section1' },
  { id: 2, title: 'Publication Info', section: 'section2' },
  { id: 3, title: 'Authorship', section: 'section3' },
  { id: 4, title: 'Publication Type', section: 'section4' },
  { id: 5, title: 'Ethical Compliance', section: 'section5' },
  { id: 6, title: 'Funding Request', section: 'section6' },
  { id: 7, title: 'Attachments', section: 'section7' },
  { id: 8, title: 'Eligibility', section: 'section8' },
  { id: 9, title: 'Declaration', section: 'section9' },
];

export const PF_FILE_FIELDS = [
  'frontPageOrArticleFiles',
  'proofOfPaymentFiles',
  'acceptanceLetterFiles',
  'invoiceReceiptFiles',
  'irbApprovalFiles',
  'additionalSupportingFiles',
];

export const createInitialFormData = (user) => ({
  fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : '',
  department: '',
  position: '',
  email: user?.email || '',
  phone: '',
  principalInvestigator: '',

  manuscriptTitle: '',
  journalName: '',
  dateOfAcceptance: '',
  dateOfPublication: '',
  doiOrLink: '',
  frontPageOrArticleFiles: [],
  scopusIndexed: '',
  journalQuartile: '',
  impactFactor: '',
  quartileSource: '',
  quartileSourceOther: '',

  applicantRole: [],
  mcmssAffiliationStated: '',

  publicationType: '',
  publicationTypeOther: '',
  publicationTypeOtherExplanation: '',

  priorEthicalApproval: '',
  irbApprovalNumber: '',
  approvingInstitution: '',
  ethicsApprovalDate: '',
  ethicsNotRequiredReason: '',
  ethicsNotRequiredOther: '',

  fundingItems: {
    apc: { requested: '', amount: '' },
    languageEditing: { requested: '', amount: '' },
    openAccess: { requested: '', amount: '' },
    other: { requested: '', amount: '', specify: '' },
  },
  totalRequestedAmount: '',
  dateOfPayment: '',
  proofOfPaymentFiles: [],

  eligibilityChecklist: {
    journalQ1OrQ2: false,
    scopusIndexedJournal: false,
    copeDoaj: false,
    firstOrCorresponding: false,
    eligiblePublicationType: false,
    manuscriptAccepted: false,
    published2025OrLater: false,
    ethicalRequirementsMet: false,
    frontPageAttached: false,
    proofOfPaymentAttached: false,
  },

  attachmentChecklist: {
    acceptanceLetter: false,
    additional: false,
  },
  acceptanceLetterFiles: [],
  invoiceReceiptFiles: [],
  irbApprovalFiles: [],
  additionalSupportingFiles: [],

  applicantDeclarationName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : '',
  applicantDeclarationDate: new Date().toISOString().slice(0, 10),
});

export const ELIGIBILITY_ITEMS = [
  { key: 'journalQ1OrQ2', label: 'The journal is Q1, or Q2 with impact factor of 2 or higher.' },
  { key: 'scopusIndexedJournal', label: 'The journal is indexed in Scopus.' },
  { key: 'copeDoaj', label: 'If open-access fees are requested, the journal follows COPE and DOAJ standards.' },
  { key: 'firstOrCorresponding', label: 'The applicant is the first author or corresponding author.' },
  { key: 'eligiblePublicationType', label: 'The publication type is eligible under the funding criteria.' },
  { key: 'manuscriptAccepted', label: 'The manuscript has been accepted for publication.' },
  { key: 'published2025OrLater', label: 'The article was published in 2025 or later.' },
  { key: 'ethicalRequirementsMet', label: 'Required ethical / administrative requirements have been met.' },
  { key: 'frontPageAttached', label: 'A copy of the published article front page is attached, if available.' },
  { key: 'proofOfPaymentAttached', label: 'Proof of payment is attached for reimbursement.' },
];

export const ATTACHMENT_ITEMS = [
  { key: 'acceptanceLetter', label: 'Acceptance letter from the journal', files: 'acceptanceLetterFiles', required: true },
  { key: 'additional', label: 'Any additional supporting documents', files: 'additionalSupportingFiles' },
];

export const FUNDING_ITEMS = [
  { key: 'apc', label: 'Article processing charges (APC)' },
  { key: 'languageEditing', label: 'Language editing' },
  { key: 'openAccess', label: 'Open-access fees' },
  { key: 'other', label: 'Other (specify)', hasSpecify: true },
];
