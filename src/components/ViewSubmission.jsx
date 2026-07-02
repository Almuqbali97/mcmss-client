import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmission, updateFieldComments, submitReview, setPiDeclaration, uploadApprovalCertificate } from '../utils/api';
import { getDefaultRouteForRole } from '../utils/roleRoutes';
import AppHeader from './AppHeader';
import { StatusBadge, REVIEW_DECISIONS } from './StatusBadge';
import { cn, REVISION_STATUSES, formatRemaining, remainingTone } from '@/lib/utils';
import { SectionCard, InfoRow, InfoGrid, FileList } from './view/ViewPrimitives';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

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

const EDITABLE_STATUSES = ['draft', ...REVISION_STATUSES];

function ViewSubmission({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fieldComments, setFieldComments] = useState({});
  const [savingComments, setSavingComments] = useState(false);
  const [commentsSaved, setCommentsSaved] = useState(false);
  const [reviewDecision, setReviewDecision] = useState({ status: 'approved', comments: '', deadlineOption: '2_weeks' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [savingPiDecision, setSavingPiDecision] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState('');

  const isAdmin = user?.role === 'admin';
  const piDeclarationApproved = submission?.piDeclarationApproval?.status === 'approved';
  // The submitter viewing their own submission is never acting as its reviewer, even if
  // they hold reviewer capability. The backend only serves this to submitter/assigned-reviewer/admin.
  const submitterId = submission?.submittedBy?._id || submission?.submittedBy?.id;
  const isSubmitter = !!submitterId && String(submitterId) === String(user?.id);
  const isAssignedReviewer =
    !!user?.isReviewer && !isAdmin && !isSubmitter && !!submission?.assignedReviewerId;
  // The PI must have approved before a reviewer can act; admins may override.
  const reviewUnlocked =
    submission?.status === 'under_review' && (isAdmin || piDeclarationApproved);
  const canComment = (isAssignedReviewer || isAdmin) && reviewUnlocked;
  const canSubmitReview = (isAssignedReviewer || isAdmin) && reviewUnlocked;
  const canEdit = user?.role === 'researcher' && EDITABLE_STATUSES.includes(submission?.status);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      // Persist the per-section comments first so they are saved with the review and
      // show under their respective sections afterwards (no need to re-enter them below).
      await updateFieldComments(id, fieldComments);
      const updated = await submitReview(id, reviewDecision.status, reviewDecision.comments, reviewDecision.deadlineOption);
      setSubmission(updated);
      navigate(getDefaultRouteForRole(user.role));
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCertificateUpload = async (file) => {
    if (!file) return;
    setCertificateError('');
    if (file.type !== 'application/pdf') {
      setCertificateError('Please upload a PDF file.');
      return;
    }
    setUploadingCertificate(true);
    try {
      const updated = await uploadApprovalCertificate(id, file);
      setSubmission(updated);
    } catch (error) {
      setCertificateError(error.response?.data?.message || 'Failed to upload certificate. Please try again.');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handlePiDecision = async (decision) => {
    setSavingPiDecision(true);
    try {
      const updated = await setPiDeclaration(id, decision);
      setSubmission(updated);
    } catch (error) {
      console.error('Failed to record PI declaration decision:', error);
    } finally {
      setSavingPiDecision(false);
    }
  };

  const backPath = getDefaultRouteForRole(user?.role);

  const shell = (children) => (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} onLogout={onLogout} title="View Submission" subtitle="Research Ethics Application" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );

  if (loading) {
    return shell(<div className="py-16 text-center text-sm text-muted-foreground">Loading submission...</div>);
  }

  if (!submission) {
    return shell(
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <h3 className="text-base font-semibold text-foreground">Submission not found</h3>
          <Button onClick={() => navigate(backPath)}>Back to Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  const formData = submission.formData || {};

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        user={user}
        onLogout={onLogout}
        title="View Submission"
        subtitle="Research Ethics Application"
        actions={
          <>
            {canEdit && (
              <Button size="sm" onClick={() => navigate(`/submission/${id}/edit`)}>
                {REVISION_STATUSES.includes(submission?.status) ? 'Revise' : 'Edit'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>
              Back
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {submission.researchTitle || 'Untitled Research'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted: {formatDate(submission.submittedDate)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge submission={submission} />
              {submission.revision?.deadline && (
                <span className={cn('text-xs font-medium', remainingTone(submission.revision.deadline))}>
                  Revision deadline: {formatRemaining(submission.revision.deadline)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {submission.status === 'approved' && (
          <SectionCard title="Letter of Approval">
            {submission.approvalCertificate?.path ? (
              <FileList
                label="Approval certificate"
                files={[submission.approvalCertificate]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? 'No approval certificate uploaded yet. Upload the signed letter of approval (PDF) below.'
                  : 'The letter of approval has not been uploaded yet. Please check back later.'}
              </p>
            )}
            {isAdmin && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <Label htmlFor="approvalCertificate" className="text-sm text-muted-foreground">
                  {submission.approvalCertificate?.path
                    ? 'Replace the approval certificate (PDF):'
                    : 'Upload the approval certificate (PDF):'}
                </Label>
                <input
                  id="approvalCertificate"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploadingCertificate}
                  onChange={(e) => handleCertificateUpload(e.target.files?.[0])}
                  className="block text-sm"
                />
                {uploadingCertificate && (
                  <p className="text-xs text-muted-foreground">Uploading...</p>
                )}
                {certificateError && (
                  <p className="text-xs text-destructive">{certificateError}</p>
                )}
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard title="Section 1: Terms and Conditions">
          <InfoRow label="Research Title" value={formData.researchTitle} />
          <InfoRow label="Consent Acknowledged" value={formData.consentAcknowledged ? 'Yes' : 'No'} />
        </SectionCard>

        <SectionCard title="Section 2: Researcher Details">
          <h4 className="font-semibold text-foreground">Principal Investigator</h4>
          <InfoGrid>
            <InfoRow label="Full Name" value={formData.principalInvestigator?.fullName} />
            <InfoRow label="Job Title" value={formData.principalInvestigator?.jobTitle} />
            <InfoRow label="Institution" value={formData.principalInvestigator?.hospital || formData.principalInvestigator?.institution} />
            <InfoRow label="Department" value={formData.principalInvestigator?.department} />
            <InfoRow label="Qualifications" value={formData.principalInvestigator?.qualifications} />
            <InfoRow label="Telephone" value={formData.principalInvestigator?.telephone} />
            <InfoRow label="Email" value={formData.principalInvestigator?.email} />
          </InfoGrid>
          {formData.coInvestigators?.length > 0 && (
            <>
              <h4 className="pt-2 font-semibold text-foreground">Co-Investigators</h4>
              {formData.coInvestigators.map((coInv, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <InfoRow label="Name" value={coInv.name} />
                  <InfoRow label="Professional Post" value={coInv.post} />
                  <InfoRow label="Institute & Department" value={coInv.institute} />
                </div>
              ))}
            </>
          )}
          <InfoRow label="Masters/PhD Award" value={formData.mastersOrPhd} />
          {formData.mastersOrPhd === 'Yes' && (
            <div className="rounded-md border border-border p-3">
              <h4 className="font-semibold text-foreground">Award details</h4>
              <InfoRow label="Research student (Masters/PhD)" value={formData.researchStudent} />
              <InfoRow label="Supervisor's name" value={formData.supervisorName} />
              <InfoRow label="Supervisor's email" value={formData.supervisorEmail || formData.supervisorSignature} />
              {submission.supervisorApproval?.status && (
                <InfoRow
                  label="Supervisor decision"
                  value={
                    submission.supervisorApproval.status === 'pending'
                      ? 'Pending'
                      : submission.supervisorApproval.status.charAt(0).toUpperCase() +
                        submission.supervisorApproval.status.slice(1)
                  }
                />
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Section 3: Project Description">
          <InfoRow
            label="Research Type"
            value={[
              ...(formData.researchType || []).filter((t) => t !== 'Other'),
              formData.researchType?.includes('Other') && formData.researchTypeOther
                ? formData.researchTypeOther
                : null,
            ]
              .filter(Boolean)
              .join(', ')}
          />
          <InfoRow label="Study Involvement" value={formData.studyInvolves?.join('; ')} />
          <FileList label="Information Sheet Files" files={formData.informationSheetFiles} />
          <FileList label="Consent Form Files" files={formData.consentFormFiles} />
        </SectionCard>

        <SectionCard title="Section 4: Confidential Information & Project Details">
          <InfoRow label="Data Capturing Methods" value={formData.dataCapturingMethods} />
          <InfoRow label="Data Storage Mode" value={formData.dataStorageMode} />
          <InfoRow label="Data Access" value={formData.dataAccess} />
          <InfoRow label="Confidentiality Measures" value={formData.confidentialityMeasures} />
          <InfoRow label="Proposed Start Date" value={formData.proposedStartDate} />
          <InfoRow label="Duration" value={formData.duration ? `${formData.duration} months` : null} />
          <InfoRow label="Multi-center Research" value={formData.multiCenterResearch} />
          {formData.multiCenterResearch === 'Yes' && formData.affiliatedCenters?.length > 0 && (
            <>
              <h4 className="pt-2 font-semibold text-foreground">Affiliated Centers</h4>
              {formData.affiliatedCenters.map((center, index) => (
                <div key={index} className="rounded-md border border-border p-3">
                  <InfoRow label={`Center ${index + 1} — Name`} value={center.name} />
                  <InfoRow label="Country of Affiliation" value={center.country} />
                </div>
              ))}
            </>
          )}
          <InfoRow label="Funding Source" value={formData.fundingSource} />
          {formData.fundingSource === 'Other' && <InfoRow label="Other Funding Source" value={formData.fundingOther} />}
          {formData.grantSum && (
            <>
              <InfoRow label="Grant Sum" value={formData.grantSum} />
              <InfoRow label="Grant Start Date" value={formData.grantStartDate} />
              <InfoRow label="Grant End Date" value={formData.grantEndDate} />
            </>
          )}
        </SectionCard>

        <SectionCard title="Section 5: Ethical Considerations">
          <InfoRow label="Previous Ethics Approval" value={formData.previousEthicsApproval} />
          {formData.previousEthicsApproval === 'Yes' && (
            <div className="rounded-md border border-border p-3">
              <InfoRow label="When did you apply?" value={formData.previousEthicsApplicationDate} />
              <InfoRow label="Was the research project approved?" value={formData.previousEthicsProjectApproved} />
              {formData.previousEthicsProjectApproved === 'Yes' && (
                <FileList label="Ethics approval document(s)" files={formData.ethicsApprovalDocuments} />
              )}
            </div>
          )}
          <InfoRow label="Collecting Personal Info" value={formData.collectingPersonalInfo} />
          <InfoRow label="Collecting from Other Source" value={formData.collectingFromOtherSource} />
          {formData.collectingFromOtherSource === 'Yes' && (
            <div className="rounded-md border border-border p-3">
              <InfoRow label="Intend to publish personal information from that source" value={formData.intendPublishPersonalInfoFromOtherSource} />
              {formData.intendPublishPersonalInfoFromOtherSource === 'Yes' && (
                <InfoRow full label="Form of publication" value={formData.publishPersonalInfoFromOtherSourceDetails} />
              )}
            </div>
          )}
          <InfoRow label="Involves Deception" value={formData.involvesDeception} />
          {formData.involvesDeception === 'Yes' && (
            <InfoRow full label="Debriefing procedures" value={formData.deceptionDebriefingProcedures} />
          )}
          <InfoRow label="Intend to Publish" value={formData.intendToPublish} />
          <InfoRow label="Blood/Tissue Samples" value={formData.bloodTissueSamples} />
          {formData.bloodTissueSamples === 'Yes' && (
            <div className="rounded-md border border-border p-3">
              <InfoRow label="Number of samples" value={formData.bloodTissueNumberOfSamples} />
              <InfoRow label="Type of sample" value={formData.bloodTissueSampleType} />
              <InfoRow label="Quantity of sample from each subject" value={formData.bloodTissueQuantityPerSubject} />
              <InfoRow label="Samples analyzed in Oman" value={formData.bloodTissueAnalyzedInOman} />
              {formData.bloodTissueAnalyzedInOman === 'No' && (
                <>
                  <InfoRow label="Institution (analysis abroad)" value={formData.bloodTissueAbroadInstitution} />
                  <InfoRow label="Country" value={formData.bloodTissueAbroadCountry} />
                  <InfoRow full label="Discard of samples after analysis" value={formData.bloodTissueDiscardExplanation} />
                  <FileList label="Supporting documents" files={formData.bloodTissueAbroadDocuments} />
                </>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Section 6: Declaration">
          <InfoRow label="PI Name" value={formData.principalInvestigator?.fullName || formData.piName} />
          <InfoRow label="PI Email" value={formData.principalInvestigator?.email} />
          <InfoRow
            label="PI declaration decision"
            value={
              !submission.piDeclarationApproval?.status
                ? 'Not requested'
                : submission.piDeclarationApproval.status === 'pending'
                  ? 'Pending PI approval'
                  : submission.piDeclarationApproval.status === 'approved'
                    ? 'Approved'
                    : 'Disapproved'
            }
          />
          {submission.piDeclarationApproval?.decidedAt && (
            <InfoRow
              label="Decision date"
              value={new Date(submission.piDeclarationApproval.decidedAt).toLocaleDateString()}
            />
          )}
          {isAdmin && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Record decision on the PI's behalf:</span>
              <Button
                size="sm"
                onClick={() => handlePiDecision('approve')}
                disabled={savingPiDecision || piDeclarationApproved}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handlePiDecision('reject')}
                disabled={savingPiDecision || submission.piDeclarationApproval?.status === 'rejected'}
              >
                Disapprove
              </Button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Section 7: Research Proposal">
          {SECTION7_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
              <InfoRow full label={label} value={formData[key]} />
              {canComment && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Your comment on {label}</Label>
                  <Textarea
                    value={fieldComments[key] || ''}
                    onChange={(e) => setFieldComments((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder={`Add comment for ${label}...`}
                    rows={2}
                  />
                </div>
              )}
              {!canComment && fieldComments[key] && (
                <div className="rounded-md border border-info/30 bg-info-muted/40 p-3 text-sm">
                  <span className="font-medium text-foreground">Reviewer comment:</span>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{fieldComments[key]}</p>
                </div>
              )}
            </div>
          ))}
          {canComment && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveFieldComments} disabled={savingComments}>
                {savingComments ? 'Saving...' : commentsSaved ? 'Saved' : 'Save field comments'}
              </Button>
            </div>
          )}
          <FileList label="Sample Size Calculation Files" files={formData.sampleSizeFiles} />
          <FileList label="Data & Research Variables Files" files={formData.dataVariablesFiles} />
          <FileList label="Research Proposal Files" files={formData.researchProposalFiles} />
        </SectionCard>

        {submission.reviewComments && (
          <SectionCard title="Review Comments">
            <p className="whitespace-pre-wrap text-muted-foreground">{submission.reviewComments}</p>
          </SectionCard>
        )}

        {isAssignedReviewer && submission?.status === 'under_review' && !reviewUnlocked && (
          <Alert>
            <AlertDescription>
              {`Review is locked until the Principal Investigator approves the Declaration${
                submission.piDeclarationApproval?.status === 'rejected'
                  ? '. The PI has disapproved this declaration.'
                  : ' (currently pending).'
              }`}
            </AlertDescription>
          </Alert>
        )}

        {canSubmitReview && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Submit Review Decision</CardTitle>
              <CardDescription>
                Add your comments per section in Section 7 above — they are saved with your review and
                shown under each section. The overall summary below is optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewError && (
                  <Alert variant="destructive">
                    <AlertDescription>{reviewError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reviewStatus">Decision</Label>
                  <Select value={reviewDecision.status} onValueChange={(v) => setReviewDecision((prev) => ({ ...prev, status: v }))}>
                    <SelectTrigger id="reviewStatus" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REVIEW_DECISIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {REVISION_STATUSES.includes(reviewDecision.status) &&
                  (submission?.revision?.round || 0) >= 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="reviewDeadline">Revision deadline</Label>
                      <Select
                        value={reviewDecision.deadlineOption}
                        onValueChange={(v) => setReviewDecision((prev) => ({ ...prev, deadlineOption: v }))}
                      >
                        <SelectTrigger id="reviewDeadline" className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_week">1 week</SelectItem>
                          <SelectItem value="2_weeks">2 weeks</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Second revision. Researcher must resubmit within this window or the form is cancelled.
                      </p>
                    </div>
                  )}
                {REVISION_STATUSES.includes(reviewDecision.status) &&
                  (submission?.revision?.round || 0) === 0 && (
                    <p className="text-xs text-muted-foreground">
                      First revision: the researcher is given <strong>30 days</strong> to resubmit before the form is cancelled.
                    </p>
                  )}
                <div className="space-y-2">
                  <Label htmlFor="reviewComments">Overall review comments (optional)</Label>
                  <Textarea
                    id="reviewComments"
                    rows={5}
                    value={reviewDecision.comments}
                    onChange={(e) => setReviewDecision((prev) => ({ ...prev, comments: e.target.value }))}
                    placeholder="Optional summary of your decision. Section-specific comments go in Section 7 above."
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate(backPath)}>Cancel</Button>
                  <Button type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default ViewSubmission;
