import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const REVISION_STATUSES = ['revisions_required', 'conditional_minor', 'major_revisions'];

/* Milliseconds left until the deadline, or null when no valid deadline. */
export function msUntil(deadline) {
  if (!deadline) return null;
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return null;
  return t - Date.now();
}

/* Human label for the revision deadline (e.g. "5 days left", "Overdue"). */
export function formatRemaining(deadline) {
  const ms = msUntil(deadline);
  if (ms === null) return null;
  if (ms <= 0) return 'Overdue';
  const days = Math.floor(ms / DAY_MS);
  if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;
  const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}

/* Tailwind text color reflecting urgency of the remaining time. */
export function remainingTone(deadline) {
  const ms = msUntil(deadline);
  if (ms === null) return '';
  if (ms <= 0) return 'text-destructive';
  if (ms <= 3 * DAY_MS) return 'text-destructive';
  if (ms <= 7 * DAY_MS) return 'text-amber-600 dark:text-amber-500';
  return 'text-muted-foreground';
}
