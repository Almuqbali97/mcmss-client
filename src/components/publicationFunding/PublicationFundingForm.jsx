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
  validateStep,
  validateEntireForm,
} from './formHelpers.js';

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

  const handleNext = () => {
    if (validateStep(currentStep, formData)) {
      setCurrentStep((s) => Math.min(s + 1, PF_STEPS.length));
    } else {
      toast.error('Please fill in all required fields before proceeding.');
    }
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
          ['phone', 'Phone number', 'tel'],
          ['principalInvestigator', 'Principal Investigator (if different from applicant)', 'text'],
        ].map(([key, label, type]) => (
          <Field key={key} label={label} required={key !== 'principalInvestigator'} htmlFor={key}>
            <Input
              id={key}
              type={type}
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </Field>
        ))}
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
        <Field key={key} label={label} required htmlFor={key}>
          <Input id={key} value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
        </Field>
      ))}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date of acceptance" required>
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
      <Field label="Scopus indexed" required>
        <OptionRadioGroup value={formData.scopusIndexed} onChange={(v) => handleChange('scopusIndexed', v)} options={['Yes', 'No']} />
      </Field>
      <Field label="Journal quartile" required>
        <OptionRadioGroup value={formData.journalQuartile} onChange={(v) => handleChange('journalQuartile', v)} options={['Q1', 'Q2', 'Other']} />
      </Field>
      <Field label="Impact factor">
        <Input value={formData.impactFactor} onChange={(e) => handleChange('impactFactor', e.target.value)} />
      </Field>
      <Field label="Source of quartile / impact factor data" required>
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
      <Field label="Applicant role in the manuscript" required>
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
      <Field label="Is Medical City for Military & Security Services clearly stated as an institutional affiliation?" required>
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
      {formData.publicationType === 'Other' && (
        <div className="space-y-5">
          <Field label="Please specify" required>
            <Input value={formData.publicationTypeOther} onChange={(e) => handleChange('publicationTypeOther', e.target.value)} />
          </Field>
          <Field label="Explain why the publication should be considered eligible" required>
            <Textarea rows={4} value={formData.publicationTypeOtherExplanation} onChange={(e) => handleChange('publicationTypeOtherExplanation', e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 5: Ethical and Administrative Compliance" />
      <Field label="Does the study have prior ethical approval?" required>
        <OptionRadioGroup value={formData.priorEthicalApproval} onChange={(v) => handleChange('priorEthicalApproval', v)} options={['Yes', 'No', 'Not applicable']} />
      </Field>
      {formData.priorEthicalApproval === 'Yes' && (
        <div className="space-y-5">
          <Field label="IRB / ethics approval number" required>
            <Input value={formData.irbApprovalNumber} onChange={(e) => handleChange('irbApprovalNumber', e.target.value)} />
          </Field>
          <Field label="Approving institution / committee" required>
            <Input value={formData.approvingInstitution} onChange={(e) => handleChange('approvingInstitution', e.target.value)} />
          </Field>
          <Field label="Date of approval" required>
            <Input type="date" value={formData.ethicsApprovalDate} onChange={(e) => handleChange('ethicsApprovalDate', e.target.value)} />
          </Field>
        </div>
      )}
      {formData.priorEthicalApproval === 'No' && (
        <Field label="If ethical approval was not required, state the reason" required>
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
                    value={formData.fundingItems[key].amount}
                    onChange={(e) => handleFundingItemChange(key, 'amount', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Field label="Total requested amount (OMR)" required>
        <Input value={formData.totalRequestedAmount} onChange={(e) => handleChange('totalRequestedAmount', e.target.value)} />
      </Field>
      <Field label="Date of payment" required>
        <Input type="date" value={formData.dateOfPayment} onChange={(e) => handleChange('dateOfPayment', e.target.value)} />
      </Field>
      <Field label="Proof of payment (attachment)">
        <FileUpload field="proofOfPaymentFiles" files={formData.proofOfPaymentFiles} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} />
      </Field>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 7: Eligibility Checklist" description="Please confirm the following (all required):" />
      <div className="space-y-3">
        {ELIGIBILITY_ITEMS.map(({ key, label }) => (
          <CheckboxField
            key={key}
            checked={!!formData.eligibilityChecklist[key]}
            onChange={() => handleChecklistToggle('eligibilityChecklist', key)}
          >
            {label}
          </CheckboxField>
        ))}
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-5">
      <StepHeading title="Section 8: Required Attachments" />
      <div className="space-y-4">
        {ATTACHMENT_ITEMS.map(({ key, label, files }) => (
          <div key={key} className="rounded-lg border border-border p-4">
            <CheckboxField
              checked={!!formData.attachmentChecklist[key]}
              onChange={() => handleChecklistToggle('attachmentChecklist', key)}
            >
              {label}
            </CheckboxField>
            {formData.attachmentChecklist[key] && (
              <div className="mt-3">
                <FileUpload field={files} files={formData[files]} onAdd={handleFileChange} onRemove={removeFile} getFileName={getFileName} />
              </div>
            )}
          </div>
        ))}
      </div>
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
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          ['applicantDeclarationName', 'Applicant name'],
          ['applicantSignature', 'Signature'],
        ].map(([key, label]) => (
          <Field key={key} label={label} required>
            <Input value={formData[key]} onChange={(e) => handleChange(key, e.target.value)} />
          </Field>
        ))}
      </div>
      <Field label="Date" required>
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
                    onClick={() => {
                      if (!validateEntireForm(formData, PF_STEPS.length)) {
                        toast.error('Please complete all required fields in every section.');
                        return;
                      }
                      setShowConfirmModal(true);
                    }}
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
