import { SectionCard, FileList } from './ViewPrimitives';
import { StatusBadge } from '../StatusBadge';

const eventLabels = {
  submitted: 'Proposal submitted', revision_submitted: 'Revised proposal submitted',
  review_issued: 'Reviewer decision issued to administrator', review_returned: 'Review returned for editing',
  decision_released: 'Decision shared with researcher', decision_retrieved: 'Decision retrieved for editing',
  deadline_extended: 'Revision deadline extended',
  edits_enabled: 'Researcher edits enabled', edits_closed: 'Researcher edits closed',
};
const label = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
const date = (value) => value ? new Date(value).toLocaleString() : 'Date not recorded';

function Answers({ value }) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    if (value.some((item) => item?.path)) return <FileList files={value} />;
    return <div className="space-y-2">{value.map((item, i) => <div key={i}><Answers value={item} /></div>)}</div>;
  }
  if (typeof value === 'object') return (
    <dl className="space-y-2">
      {Object.entries(value).filter(([key, item]) => !key.startsWith('_') && item != null && item !== '' && (!Array.isArray(item) || item.length)).map(([key, item]) => (
        <div key={key} className="border-l border-border pl-3">
          <dt className="font-medium">{label(key)}</dt><dd className="whitespace-pre-wrap text-muted-foreground"><Answers value={item} /></dd>
        </div>
      ))}
    </dl>
  );
  return <>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</>;
}

export default function SubmissionHistory({ submission, isSubmitter }) {
  const events = submission.reviewHistory?.length ? submission.reviewHistory
    : (submission.reviewCommentHistory?.length ? submission.reviewCommentHistory
      : submission.reviewComments ? [{ comment: submission.reviewComments, decision: submission.reviewStatus }] : [])
      .map((entry) => ({ ...entry, event: 'decision_released' }));
  const versions = submission.submissionVersions || [];
  if (!events.length && !versions.length) return null;
  const withdrawn = new Set(events.filter((entry) => entry.event === 'decision_retrieved').map((entry) => entry.relatedEventId));
  return (
    <SectionCard title="Decision and revision history">
      <ol className="space-y-3" aria-label="Decision and revision history">
        {events.map((entry, index) => (
          <li key={entry._id || index} className="rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{eventLabels[entry.event] || label(entry.event)}</span>
              {entry.decision && <StatusBadge status={entry.decision} />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {date(entry.createdAt)}{entry.version ? ` · Version ${entry.version}` : ''}{entry.round ? ` · Revision round ${entry.round}` : ''}
            </p>
            {withdrawn.has(String(entry._id)) && <p className="mt-1 text-xs text-muted-foreground">Retrieved for editing; no longer the active decision.</p>}
            {entry.comment && <p className="mt-2 whitespace-pre-wrap">{entry.comment}</p>}
            {Object.keys(entry.fieldComments || {}).length > 0 && <details className="mt-2"><summary className="cursor-pointer">Section comments at this decision</summary><Answers value={entry.fieldComments} /></details>}
            {entry.deadline && <p className="mt-1 text-xs">Revision deadline: {date(entry.deadline)}</p>}
            {!isSubmitter && entry.author && <p className="mt-1 text-xs text-muted-foreground">Reviewer: {entry.author}</p>}
          </li>
        ))}
      </ol>
      {versions.length > 0 && <div className="space-y-3 border-t pt-4">
        <h4 className="font-semibold">Submitted versions</h4>
        {versions.map((version) => (
          <details key={version._id || version.version} className="rounded-md border p-3">
            <summary className="cursor-pointer font-medium">Version {version.version} · {date(version.submittedAt)}</summary>
            <p className="my-2 text-muted-foreground">Saved answers and documents at submission. Later edits do not change this version.</p>
            <Answers value={{ researchTitle: version.researchTitle, principalInvestigator: version.principalInvestigator, ...version.formData }} />
          </details>
        ))}
      </div>}
    </SectionCard>
  );
}
