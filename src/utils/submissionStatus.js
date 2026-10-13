export function deriveSubmissionStatus(submission) {
  if (!submission) return 'draft';
  const status = submission.status;
  if (!['under_review', 'under_review_with_revisions'].includes(status)) return status;
  if (submission.piDeclarationApproval?.status !== 'approved') return 'awaiting_pi_confirmation';
  return submission.revision?.round > 0 ? 'under_review_with_revisions' : status;
}
