import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Save, X } from 'lucide-react';
import {
  createPublicationFunding,
  updatePublicationFunding,
  getPublicationFunding,
  submitPublicationFundingForReview,
} from '../../utils/api';
import AppHeader from '../AppHeader';
import {
  Field,
  FileUpload,
  OptionRadioGroup,
  CheckboxField,
  StepIndicator,
  StepHeading,
} from '../form/FormPrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  getStepErrors,
  validateEntireForm,
  getFirstInvalidStep,
  describeErrorKey,
} from './formHelpers.js';

const FIELD_FILE_LIMITS = { proofOfPaymentFiles: 3 };

const todayISO = () => new Date().toISOString().slice(0, 10);

/* +968 prefixed Omani mobile input */
function PhoneInput({ value, onChange, disabled, id }) {
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
        onKeyDown={(e) => {
          if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
          const raw = e.target.value.replace(/\D/g, '');
          if (!/\d/.test(e.key)) e.preventDefault();
          else if (raw.length >= 8) e.preventDefault();
        }}
      />
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState(createInitialFormData(user));
  const declarationName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : formData.fullName || '';

  useEffect(() => {
    if (id) {
      loadApplication();
    } else {
      const saved = localStorage.getItem('publicationFundingFormAutoSave');
      if (saved) {
        try {
          setFormData((prev) => ({
            ...prev,
            ...JSON.parse(saved),
            applicantDeclarationName: declarationName,
            applicantDeclarationDate: todayISO(),
          }));
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
          applicantDeclarationName: declarationName,
          applicantDeclarationDate: todayISO(),
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
    setFormData((prev) => {
      const item = { ...prev.fundingItems[key], [subField]: value };
      // Clear the amount whenever the item is no longer requested.
      if (subField === 'requested' && value !== 'Yes') {
        item.amount = '';
      }
      return {
        ...prev,
        fundingItems: { ...prev.fundingItems, [key]: item },
      };
    });
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
    const max = FIELD_FILE_LIMITS[field] || 5;
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ...arr].slice(0, max),
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
    formData: {
      ...formData,
      applicantDeclarationName: declarationName,
      applicantDeclarationDate: todayISO(),
    },
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
      toast.success('Draft saved successfully!');
    } catch {
      toast.error('Failed to save draft. Please try again.');
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
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showMissingToast = (errors) => {
    const labels = [...new Set(Object.keys(errors).map(describeErrorKey))];
    const preview = labels.slice(0, 4).join(', ');
    const extra = labels.length > 4 ? ` and ${labels.length - 4} more` : '';
    toast.error(`Missing or invalid: ${preview}${extra}.`);
  };

  const handleNext = () => {
    const errors = getStepErrors(currentStep, formData);
    if (Object.keys(errors).length === 0) {
      setFieldErrors({});
      setCurrentStep((s) => Math.min(s + 1, PF_STEPS.length));
    } else {
      setFieldErrors(errors);
      showMissingToast(errors);
    }
  };

  const handleSubmitClick = () => {
    if (validateEntireForm(formData, PF_STEPS.length)) {
      setFieldErrors({});
      setShowConfirmModal(true);
      return;
    }
    const invalidStep = getFirstInvalidStep(formData, PF_STEPS.length);
    const errors = getStepErrors(invalidStep, formData);
    setFieldErrors(errors);
    setCurrentStep(invalidStep);
    showMissingToast(errors);
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      <StepHeading
        title="Section 1: Applicant Information"
        description="Please complete all applicable sections and attach required supporting documents."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          ['fullName', 'Full name', 'text'],
          ['department', 'Department / Unit', 'text'],
          ['position', 'Position / Title', 'text'],
          ['email', 'Email address', 'email'],
        ].map(([key, label, type]) => (
          <Field key={key} label={label} required htmlFor={key} error={fieldErrors[key]}>
            <Input
              id={key}
              type={type}
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </Field>
        ))}
        <Field label="Phone number" required htmlFor="phone" hint="Omani mobile only (8 digits, starts with 9)" error={fieldErrors.phone}>
          <PhoneInput
            id="phone"
            value={formData.phone}
            onChange={(e) => {
              let raw = e.target.value.replace(/\D/g, '');
              if (raw.startsWith('968')) raw = raw.slice(3);
              if (raw === '' || (raw.startsWith('9') && raw.length <= 8)) {
                handleChange('phone', raw ? `+968${raw}` : '');
              }
            }}
          />
        </Field>
        <Field label="Principal Investigator (if different from applicant)" htmlFor="principalInvestigator" error={fieldErrors.principalInvestigator}>
          <Input
            id="principalInvestigator"
            type="text"
            value={formData.principalInvestigator}
            onChange={(e) => handleChange('principalInvestigator', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 2: Publication Information" />
      {[
        ['manuscriptTitle', 'Manuscript title'],
        ['journalName', 'Journal name'],
      ].map(([key, label]) => (
        <Field key={key} label={label} required htmlFor={key} error={fieldErrors[key]}>
          <Input id={key} value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
        </Field>
      ))}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of acceptance" required error={fieldErrors.dateOfAcceptance}>
          <Input type="date" value={formData.dateOfAcceptance} onChange={(e) => handleChange('dateOfAcceptance', e.target.value)} />
        </Field>
        <Field label="Date of publication (if already published)">
          <Input type="date" value={formData.dateOfPublication} onChange={(e) => handleChange('dateOfPublication', e.target.value)} />
        </Field>
      </div>
      <Field label="DOI / article link">
        <Input value={formData.doiOrLink} onChange={(e) => handleChange('doiOrLink', e.target.value)} />
      </Field>
      <Field label="Front page or research article (attachment)">
        <FileUpload field="frontPageOrArticleFiles" files={formData.frontPageOrArticleFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} />
      </Field>
      <Field label="Scopus indexed" required error={fieldErrors.scopusIndexed}>
        <OptionRadioGroup value={formData.scopusIndexed} onChange={(v) => handleChange('scopusIndexed', v)} options={['Yes', 'No']} />
      </Field>
      <Field label="Journal quartile" required error={fieldErrors.journalQuartile}>
        <OptionRadioGroup value={formData.journalQuartile} onChange={(v) => handleChange('journalQuartile', v)} options={['Q1', 'Q2', 'Other']} />
      </Field>
      <Field label="Impact factor">
        <Input value={formData.impactFactor} onChange={(e) => handleChange('impactFactor', e.target.value)} />
      </Field>
      <Field label="Source of quartile / impact factor data" required error={fieldErrors.quartileSource || fieldErrors.quartileSourceOther}>
        <OptionRadioGroup
          value={formData.quartileSource}
          onChange={(v) => handleChange('quartileSource', v)}
          options={['Scimago Journal Rank', 'Journal Citation Reports', 'Other']}
        />
        {formData.quartileSource === 'Other' && (
          <Input className="mt-2" placeholder="Specify" value={formData.quartileSourceOther} onChange={(e) => handleChange('quartileSourceOther', e.target.value)} />
        )}
      </Field>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 3: Authorship and Affiliation" />
      <Field label="Applicant role in the manuscript" required error={fieldErrors.applicantRole}>
        <div className="space-y-2">
          {['First author', 'Corresponding author'].map((role) => (
            <CheckboxField
              key={role}
              checked={formData.applicantRole.includes(role)}
              onChange={() => handleRoleToggle(role)}
            >
              {role}
            </CheckboxField>
          ))}
        </div>
      </Field>
      <Field label="Is Medical City for Military & Security Services clearly stated as an institutional affiliation?" required error={fieldErrors.mcmssAffiliationStated}>
        <OptionRadioGroup value={formData.mcmssAffiliationStated} onChange={(v) => handleChange('mcmssAffiliationStated', v)} options={['Yes', 'No']} />
      </Field>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 4: Type of Publication" description="Please select one:" />
      <OptionRadioGroup
        className="flex-col gap-2"
        value={formData.publicationType}
        onChange={(v) => handleChange('publicationType', v)}
        options={[
          'Original research article',
          'Systematic review / meta-analysis',
          'Clinical trial',
          'Large observational or registry study',
          'Translational or experimental study with human relevance',
          'Other',
        ]}
      />
      {fieldErrors.publicationType && (
        <p className="text-xs font-medium text-destructive">{fieldErrors.publicationType}</p>
      )}
      {formData.publicationType === 'Other' && (
        <div className="space-y-5">
          <Field label="Please specify" required error={fieldErrors.publicationTypeOther}>
            <Input value={formData.publicationTypeOther} onChange={(e) => handleChange('publicationTypeOther', e.target.value)} />
          </Field>
          <Field label="Explain why the publication should be considered eligible" required error={fieldErrors.publicationTypeOtherExplanation}>
            <Textarea rows={4} value={formData.publicationTypeOtherExplanation} onChange={(e) => handleChange('publicationTypeOtherExplanation', e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 5: Ethical and Administrative Compliance" />
      <Field label="Does the study have prior ethical approval?" required error={fieldErrors.priorEthicalApproval}>
        <OptionRadioGroup value={formData.priorEthicalApproval} onChange={(v) => handleChange('priorEthicalApproval', v)} options={['Yes', 'No']} />
      </Field>
      {formData.priorEthicalApproval === 'Yes' && (
        <div className="space-y-5">
          <Field
            label="IRB / ethics approval letter, if applicable"
            required
            error={fieldErrors.irbApprovalFiles}
          >
            <FileUpload field="irbApprovalFiles" files={formData.irbApprovalFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} error={fieldErrors.irbApprovalFiles} />
          </Field>
          <Field label="IRB / ethics approval number" required error={fieldErrors.irbApprovalNumber}>
            <Input value={formData.irbApprovalNumber} onChange={(e) => handleChange('irbApprovalNumber', e.target.value)} />
          </Field>
          <Field label="Approving institution / committee" required error={fieldErrors.approvingInstitution}>
            <Input value={formData.approvingInstitution} onChange={(e) => handleChange('approvingInstitution', e.target.value)} />
          </Field>
          <Field label="Date of approval" required error={fieldErrors.ethicsApprovalDate}>
            <Input type="date" value={formData.ethicsApprovalDate} onChange={(e) => handleChange('ethicsApprovalDate', e.target.value)} />
          </Field>
        </div>
      )}
      {formData.priorEthicalApproval === 'No' && (
        <Field label="If ethical approval was not required, state the reason" required error={fieldErrors.ethicsNotRequiredReason || fieldErrors.ethicsNotRequiredOther}>
          <OptionRadioGroup
            className="flex-col gap-2"
            value={formData.ethicsNotRequiredReason}
            onChange={(v) => handleChange('ethicsNotRequiredReason', v)}
            options={['Systematic review', 'Publicly available registry data', 'Other']}
          />
          {formData.ethicsNotRequiredReason === 'Other' && (
            <Input className="mt-2" value={formData.ethicsNotRequiredOther} onChange={(e) => handleChange('ethicsNotRequiredOther', e.target.value)} />
          )}
        </Field>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 6: Funding Request Details" />
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-32">Requested</TableHead>
              <TableHead className="w-40">Amount (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FUNDING_ITEMS.map(({ key, label, hasSpecify }) => (
              <TableRow key={key}>
                <TableCell className="align-top whitespace-normal">
                  <div className="font-medium">{label}</div>
                  {hasSpecify && (
                    <Input
                      className="mt-2"
                      placeholder="Specify"
                      value={formData.fundingItems[key].specify || ''}
                      onChange={(e) => handleFundingItemChange(key, 'specify', e.target.value)}
                    />
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Select
                    value={formData.fundingItems[key].requested || 'none'}
                    onValueChange={(v) => handleFundingItemChange(key, 'requested', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    disabled={formData.fundingItems[key].requested !== 'Yes'}
                    aria-invalid={!!fieldErrors[`fundingItems.${key}.amount`]}
                    value={formData.fundingItems[key].amount}
                    onChange={(e) => handleFundingItemChange(key, 'amount', e.target.value)}
                  />
                  {fieldErrors[`fundingItems.${key}.amount`] && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {fieldErrors[`fundingItems.${key}.amount`]}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Field label="Total requested amount (OMR)" required error={fieldErrors.totalRequestedAmount}>
        <Input
          type="number"
          min="0"
          step="0.001"
          value={formData.totalRequestedAmount}
          onChange={(e) => handleChange('totalRequestedAmount', e.target.value)}
        />
      </Field>
      <Field label="Date of payment" required error={fieldErrors.dateOfPayment}>
        <Input type="date" value={formData.dateOfPayment} onChange={(e) => handleChange('dateOfPayment', e.target.value)} />
      </Field>
      <Field label="Proof of payment (attachment)" hint="Up to 3 files">
        <FileUpload field="proofOfPaymentFiles" files={formData.proofOfPaymentFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} maxFiles={3} />
      </Field>
    </div>
  );

  // Step 7 (swapped): Required Attachments
  const renderStep7 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 7: Required Attachments" />
      <div className="space-y-4">
        {ATTACHMENT_ITEMS.map(({ key, label, files, required }) => (
          <div key={key} className="rounded-lg border border-border p-4">
            {required ? (
              <p className="text-sm font-medium text-foreground">
                {label} <span className="text-destructive">*</span>
              </p>
            ) : (
              <CheckboxField
                checked={!!formData.attachmentChecklist[key]}
                onChange={() => handleChecklistToggle('attachmentChecklist', key)}
              >
                {label}
              </CheckboxField>
            )}
            {(required || formData.attachmentChecklist[key]) && (
              <div className="mt-3">
                <FileUpload field={files} files={formData[files]} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} error={fieldErrors[files]} />
                {fieldErrors[files] && (
                  <p className="mt-1 text-xs font-medium text-destructive">{fieldErrors[files]}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Step 8 (swapped): Eligibility Checklist
  const renderStep8 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 8: Eligibility Checklist" description="Please confirm the following (all required):" />
      <div className="space-y-3">
        {ELIGIBILITY_ITEMS.map(({ key, label }) => {
          const hasError = !!fieldErrors[`eligibilityChecklist.${key}`];
          return (
            <CheckboxField
              key={key}
              className={cn(hasError && 'text-destructive')}
              checked={!!formData.eligibilityChecklist[key]}
              onChange={() => handleChecklistToggle('eligibilityChecklist', key)}
            >
              {label}
            </CheckboxField>
          );
        })}
      </div>
      {(fieldErrors.frontPageOrArticleFiles || fieldErrors.proofOfPaymentFiles) && (
        <div className="space-y-1">
          {fieldErrors.frontPageOrArticleFiles && (
            <p className="text-xs font-medium text-destructive">{fieldErrors.frontPageOrArticleFiles}</p>
          )}
          {fieldErrors.proofOfPaymentFiles && (
            <p className="text-xs font-medium text-destructive">{fieldErrors.proofOfPaymentFiles}</p>
          )}
        </div>
      )}
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 9: Applicant Declaration" />
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        The undersigned confirms that the information provided in this application is accurate and complete,
        that the publication meets the institutional criteria for research publication funding, and that all
        supporting documents submitted are valid. The applicant understands that funding is considered only after
        manuscript acceptance, reimbursement is subject to approval, and additional post-publication requirements may apply.
      </div>
      <Field label="Applicant name" required hint="Auto-filled from your account (editable)" error={fieldErrors.applicantDeclarationName}>
        <Input value={formData.applicantDeclarationName} onChange={(e) => handleChange('applicantDeclarationName', e.target.value)} />
      </Field>
      <Field label="Date" required hint="Auto-filled with the submission date (editable)" error={fieldErrors.applicantDeclarationDate}>
        <Input type="date" value={formData.applicantDeclarationDate} onChange={(e) => handleChange('applicantDeclarationDate', e.target.value)} />
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
    8: renderStep8,
    9: renderStep9,
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={user}
        onLogout={onLogout}
        title="Publication Funding Application"
        subtitle="Research publication reimbursement"
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
            <p className="text-sm text-muted-foreground">
              Please complete all applicable sections and attach the required supporting documents.
            </p>

            <StepIndicator steps={PF_STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

            <div className="border-t border-border pt-6">{STEP_RENDERERS[currentStep]?.()}</div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <Button variant="secondary" onClick={() => setCurrentStep((s) => s - 1)}>
                    <ArrowLeft />
                    Back
                  </Button>
                )}
                {!id && autoSaveStatus && (
                  <span className="text-sm italic text-success">{autoSaveStatus}</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                {currentStep < PF_STEPS.length ? (
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button
                    variant="plum"
                    disabled={loading}
                    onClick={handleSubmitClick}
                  >
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Submit this publication funding application for committee review?
            </DialogDescription>
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

export default PublicationFundingForm;
