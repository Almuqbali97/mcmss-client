import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS = {
  draft: 'muted',
  submitted: 'info',
  incomplete_submission: 'warning',
  under_review: 'info',
  in_review: 'info',
  pending: 'warning',
  revisions_required: 'warning',
  revision_required: 'warning',
  changes_requested: 'warning',
  conditional_minor: 'warning',
  major_revisions: 'warning',
  approved: 'success',
  accepted: 'success',
  completed: 'success',
  funded: 'success',
  rejected: 'destructive',
  declined: 'destructive',
  archived: 'muted',
};

const STATUS_LABELS = {
  conditional_minor: 'Conditional Approval — Minor Revisions',
  major_revisions: 'Major Revisions',
  under_review: 'Under Review',
  incomplete_submission: 'Incomplete Submission',
  archived: 'Cancelled (Archived)',
};

/**
 * A submitted proposal stays "Incomplete Submission" until the required approvals
 * (Principal Investigator declaration, and supervisor for Masters/PhD) are granted.
 */
export function deriveSubmissionStatus(submission) {
  if (!submission) return 'draft';
  const status = submission.status;
  if (status !== 'under_review') return status;

  const piStatus = submission.piDeclarationApproval?.status;
  const piIncomplete = !!piStatus && piStatus !== 'approved';

  const supRequired = submission.formData?.mastersOrPhd === 'Yes';
  const supStatus = submission.supervisorApproval?.status;
  const supIncomplete = supRequired && !!supStatus && supStatus !== 'approved';

  return piIncomplete || supIncomplete ? 'incomplete_submission' : status;
}

export const REVIEW_DECISIONS = [
  { value: 'approved', label: 'Approved' },
  { value: 'conditional_minor', label: 'Conditional approval - minor revisions' },
  { value: 'major_revisions', label: 'Major revisions' },
  { value: 'rejected', label: 'Rejected' },
];

export function statusVariant(status) {
  return STATUS_VARIANTS[status] || 'secondary';
}

export function formatStatus(status) {
  if (!status) return 'Unknown';
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, submission, className }) {
  const effective = submission ? deriveSubmissionStatus(submission) : status;
  return (
    <Badge variant={statusVariant(effective)} className={className}>
      {formatStatus(effective)}
    </Badge>
  );
}

export default StatusBadge;
