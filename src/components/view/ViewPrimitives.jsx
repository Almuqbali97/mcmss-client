import { FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { API_ORIGIN } from '../../utils/apiConfig.js';

export function SectionCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6 text-sm">{children}</CardContent>
    </Card>
  );
}

export function InfoRow({ label, value, full }) {
  return (
    <div className={full ? 'space-y-1' : 'flex flex-wrap gap-x-2'}>
      <span className="font-medium text-foreground">{label}:</span>{' '}
      <span className="whitespace-pre-wrap text-muted-foreground">{value ?? 'N/A'}</span>
    </div>
  );
}

export function InfoGrid({ children }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function getUploadedFileDisplayName(file) {
  if (file == null) return 'File';
  if (typeof file === 'string') return file;
  return file.name || file.originalName || file._fileMeta?.name || 'File';
}

export function FileList({ files, label }) {
  if (!files?.length) return null;
  return (
    <div className="space-y-1.5">
      {label && <span className="font-medium text-foreground">{label}:</span>}
      <ul className="space-y-1">
        {files.map((file, index) => (
          <li key={index}>
            {file.path ? (
              <a
                href={`${API_ORIGIN}${file.path}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="size-4" />
                {getUploadedFileDisplayName(file)}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileText className="size-4" />
                {getUploadedFileDisplayName(file)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
