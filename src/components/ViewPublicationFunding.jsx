import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Circle } from 'lucide-react';
import {
  getPublicationFunding,
  submitPublicationFundingReview,
  updateCommitteeReview,
} from '../utils/api';
import { getDefaultRouteForRole } from '../utils/roleRoutes';
import { ELIGIBILITY_ITEMS, ATTACHMENT_ITEMS, FUNDING_ITEMS } from './publicationFunding/formData';
import AppHeader from './AppHeader';
import { StatusBadge } from './StatusBadge';
import { SectionCard, InfoRow, FileList } from './view/ViewPrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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
      toast.error('Please provide review comments.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitPublicationFundingReview(id, reviewDecision.status, reviewDecision.comments);
      navigate(backPath);
    } catch {
      toast.error('Failed to submit review.');
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
      toast.success('Committee review saved.');
    } catch {
      toast.error('Failed to save committee review.');
    } finally {
      setSavingCommittee(false);
    }
  };

  const actions = (
    <>
      {application && EDITABLE_STATUSES.includes(application.status) && user?.role === 'researcher' && (
        <Button size="sm" onClick={() => navigate(`/publication-funding/${id}/edit`)}>
          {application.status === 'revisions_required' ? 'Revise' : 'Edit'}
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>Back</Button>
    </>
  );

  const shell = (title, children, headerActions) => (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} onLogout={onLogout} title={title} subtitle="Publication Funding Application" actions={headerActions} />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );

  if (loading) {
    return shell('View Application', <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>);
  }

  if (!application) {
    return shell(
      'View Application',
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-sm text-muted-foreground">Application not found.</p>
          <Button onClick={() => navigate(backPath)}>Back</Button>
        </CardContent>
      </Card>
    );
  }

  return shell(
    'Publication Funding Application',
    <>
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{application.manuscriptTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {application.applicationId} · Applicant: {application.applicantName}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </CardContent>
      </Card>

      <SectionCard title="Section 1: Applicant Information">
        <InfoRow label="Full name" value={fd.fullName} />
        <InfoRow label="Department / Unit" value={fd.department} />
        <InfoRow label="Position / Title" value={fd.position} />
        <InfoRow label="Email" value={fd.email} />
        <InfoRow label="Phone" value={fd.phone} />
        <InfoRow label="Principal Investigator" value={fd.principalInvestigator} />
      </SectionCard>

      <SectionCard title="Section 2: Publication Information">
        <InfoRow label="Manuscript title" value={fd.manuscriptTitle} />
        <InfoRow label="Journal name" value={fd.journalName} />
        <InfoRow label="Date of acceptance" value={fd.dateOfAcceptance} />
        <InfoRow label="Date of publication" value={fd.dateOfPublication} />
        <InfoRow label="DOI / link" value={fd.doiOrLink} />
        <InfoRow label="Scopus indexed" value={fd.scopusIndexed} />
        <InfoRow label="Journal quartile" value={fd.journalQuartile} />
        <InfoRow label="Impact factor" value={fd.impactFactor} />
        <InfoRow label="Quartile source" value={fd.quartileSource} />
        {fd.quartileSource === 'Other' && <InfoRow label="Other quartile source" value={fd.quartileSourceOther} />}
        <FileList label="Front page / article files" files={fd.frontPageOrArticleFiles} />
      </SectionCard>

      <SectionCard title="Section 3: Authorship and Affiliation">
        <InfoRow label="Applicant role" value={fd.applicantRole?.join(', ')} />
        <InfoRow label="MCMSS affiliation stated" value={fd.mcmssAffiliationStated} />
      </SectionCard>

      <SectionCard title="Section 4: Type of Publication">
        <InfoRow label="Publication type" value={fd.publicationType} />
        {fd.publicationType === 'Other' && (
          <>
            <InfoRow label="Other specification" value={fd.publicationTypeOther} />
            <InfoRow full label="Eligibility explanation" value={fd.publicationTypeOtherExplanation} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Section 5: Ethical and Administrative Compliance">
        <InfoRow label="Prior ethical approval" value={fd.priorEthicalApproval} />
        <InfoRow label="IRB number" value={fd.irbApprovalNumber} />
        <InfoRow label="Approving institution" value={fd.approvingInstitution} />
        <InfoRow label="Approval date" value={fd.ethicsApprovalDate} />
        <InfoRow label="Reason if not required" value={fd.ethicsNotRequiredReason} />
        {fd.ethicsNotRequiredReason === 'Other' && <InfoRow label="Other reason" value={fd.ethicsNotRequiredOther} />}
        <FileList label="IRB / ethics approval letter" files={fd.irbApprovalFiles} />
      </SectionCard>

      <SectionCard title="Section 6: Funding Request Details">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Amount (OMR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FUNDING_ITEMS.map(({ key, label }) => (
                <TableRow key={key}>
                  <TableCell className="whitespace-normal">
                    {label}
                    {key === 'other' && fd.fundingItems?.other?.specify ? ` (${fd.fundingItems.other.specify})` : ''}
                  </TableCell>
                  <TableCell>{fd.fundingItems?.[key]?.requested || '—'}</TableCell>
                  <TableCell>{fd.fundingItems?.[key]?.amount || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <InfoRow label="Total requested" value={fd.totalRequestedAmount} />
        <InfoRow label="Date of payment" value={fd.dateOfPayment} />
        <FileList label="Proof of payment files" files={fd.proofOfPaymentFiles} />
      </SectionCard>

      <SectionCard title="Section 7: Required Attachments">
        {ATTACHMENT_ITEMS.map(({ key, label, files, required }) =>
          required || fd.attachmentChecklist?.[key] ? (
            <FileList key={key} label={label} files={fd[files]} />
          ) : null
        )}
      </SectionCard>

      <SectionCard title="Section 8: Eligibility Checklist">
        <ul className="space-y-2">
          {ELIGIBILITY_ITEMS.map(({ key, label }) => {
            const checked = fd.eligibilityChecklist?.[key];
            return (
              <li key={key} className="flex items-start gap-2">
                {checked ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">{label}</span>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Section 9: Applicant Declaration">
        <InfoRow label="Applicant name" value={fd.applicantDeclarationName} />
        <InfoRow label="Date" value={fd.applicantDeclarationDate} />
      </SectionCard>

      {application.reviewComments && (
        <SectionCard title="Review Comments">
          <p className="whitespace-pre-wrap text-muted-foreground">{application.reviewComments}</p>
        </SectionCard>
      )}

      {canSubmitReview && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Submit Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <Label>Decision</Label>
                <Select value={reviewDecision.status} onValueChange={(v) => setReviewDecision((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="revisions_required">Request Revisions</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comments *</Label>
                <Textarea rows={5} value={reviewDecision.comments} onChange={(e) => setReviewDecision((p) => ({ ...p, comments: e.target.value }))} required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Section 10: Committee Review</CardTitle>
            <CardDescription>For Research &amp; Studies Committee use only.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveCommitteeReview} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['applicationReceivedOn', 'Application received on', 'date'],
                  ['reviewedBy', 'Reviewed by', 'text'],
                  ['approvedAmount', 'Approved amount (OMR)', 'text'],
                  ['finalDecision', 'Final decision', 'text'],
                  ['dateOfDecision', 'Date of decision', 'date'],
                ].map(([key, label, type]) => (
                  <div className="space-y-2" key={key}>
                    <Label>{label}</Label>
                    <Input type={type} value={committeeReview[key] || ''} onChange={(e) => setCommitteeReview((p) => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['journalQualityVerified', 'Journal quality verified'],
                  ['authorshipEligibilityVerified', 'Authorship eligibility verified'],
                  ['ethicalComplianceVerified', 'Ethical compliance verified'],
                  ['recommendedForFunding', 'Recommended for funding'],
                ].map(([key, label]) => (
                  <div className="space-y-2" key={key}>
                    <Label>{label}</Label>
                    <Select
                      value={committeeReview[key] || 'none'}
                      onValueChange={(v) => setCommitteeReview((p) => ({ ...p, [key]: v === 'none' ? '' : v }))}
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea rows={4} value={committeeReview.comments || ''} onChange={(e) => setCommitteeReview((p) => ({ ...p, comments: e.target.value }))} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingCommittee}>
                  {savingCommittee ? 'Saving...' : 'Save Committee Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>,
    actions
  );
}

export default ViewPublicationFunding;
