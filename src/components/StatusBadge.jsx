import { Badge } from '@/components/ui/badge';
import { deriveSubmissionStatus } from '../utils/submissionStatus';
export { deriveSubmissionStatus } from '../utils/submissionStatus';

const STATUS_VARIANTS = {
  draft: 'muted',
  submitted: 'info',
  awaiting_pi_confirmation: 'warning',
  under_review: 'info',
  under_review_with_revisions: 'info',
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
  under_review_with_revisions: 'Under Review with Revisions',
  awaiting_pi_confirmation: 'Awaiting PI confirmation',
  archived: 'Cancelled (Archived)',
};

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
