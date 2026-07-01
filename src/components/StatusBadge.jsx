import { Badge } from '@/components/ui/badge';

const STATUS_VARIANTS = {
  draft: 'muted',
  submitted: 'info',
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

export function StatusBadge({ status, className }) {
  return (
    <Badge variant={statusVariant(status)} className={className}>
      {formatStatus(status)}
    </Badge>
  );
}

export default StatusBadge;
