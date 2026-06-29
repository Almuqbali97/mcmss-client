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
  approved: 'success',
  accepted: 'success',
  completed: 'success',
  funded: 'success',
  rejected: 'destructive',
  declined: 'destructive',
};

export function statusVariant(status) {
  return STATUS_VARIANTS[status] || 'secondary';
}

export function formatStatus(status) {
  if (!status) return 'Unknown';
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
