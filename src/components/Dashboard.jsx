import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ClipboardList, BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  getSubmissions,
  getPublicationFundingApplications,
  getAssignedSubmissions,
  deleteSubmission,
  deletePublicationFunding,
} from '../utils/api';
import AppHeader from './AppHeader';
import { StatusBadge } from './StatusBadge';
import { cn, REVISION_STATUSES, formatRemaining, remainingTone } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const FORM_TYPES = [
  {
    id: 'ethics',
    title: 'Research Ethics Approval',
    description: 'Submit a new application for medical research ethics committee review. Covers study design, ethical considerations, and research proposals.',
    Icon: ClipboardList,
    newRoute: '/submission/new',
    countLabel: 'submission',
  },
  {
    id: 'publication-funding',
    title: 'Publication Funding',
    description: 'Apply for reimbursement of article processing charges, open-access fees, and related publication costs after manuscript acceptance.',
    Icon: BookOpen,
    newRoute: '/publication-funding/new',
    countLabel: 'application',
  },
];

const EDITABLE_STATUSES = ['draft', ...REVISION_STATUSES];

function FormTypeCard({ form, count, onStart, onViewApplications }) {
  const { Icon } = form;
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <CardTitle className="mt-3 text-lg">{form.title}</CardTitle>
        <CardDescription>{form.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">
          {count} {count === 1 ? form.countLabel : `${form.countLabel}s`}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={onStart}>
          <Plus />
          Start New
        </Button>
        <Button variant="outline" onClick={onViewApplications} disabled={count === 0}>
          View All
        </Button>
      </CardFooter>
    </Card>
  );
}

function Dashboard({ user, onLogout }) {
  const [ethicsSubmissions, setEthicsSubmissions] = useState([]);
  const [publicationApps, setPublicationApps] = useState([]);
  const [assignedReviews, setAssignedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ethics');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const isReviewer = !!user.isReviewer;

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.isPublication) {
        await deletePublicationFunding(deleteTarget.id);
        setPublicationApps((prev) => prev.filter((x) => (x._id || x.id) !== deleteTarget.id));
      } else {
        await deleteSubmission(deleteTarget.id);
        setEthicsSubmissions((prev) => prev.filter((x) => (x._id || x.id) !== deleteTarget.id));
      }
      toast.success('Draft deleted.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete draft.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [ethics, publication, assigned] = await Promise.all([
        getSubmissions(),
        getPublicationFundingApplications(),
        user.isReviewer ? getAssignedSubmissions().catch(() => []) : Promise.resolve([]),
      ]);
      setEthicsSubmissions(ethics);
      setPublicationApps(publication);
      setAssignedReviews(assigned || []);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInvestigatorName = (item, isPublication = false) => {
    if (isPublication) return item.applicantName || 'N/A';
    if (item.principalInvestigator) return item.principalInvestigator;
    const submittedBy = item.submittedBy;
    if (!submittedBy) return 'N/A';
    if (typeof submittedBy === 'string') return submittedBy;
    const name = `${submittedBy.firstName || ''} ${submittedBy.lastName || ''}`.trim();
    return name || submittedBy.email || 'N/A';
  };

  const counts = {
    ethics: ethicsSubmissions.length,
    'publication-funding': publicationApps.length,
  };

  const renderTable = (rows, isPublication) => {
    const titleHeader = isPublication ? 'Manuscript Title' : 'Research Title';
    const basePath = isPublication ? '/publication-funding' : '/submission';

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{titleHeader}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => {
            const id = item._id || item.id;
            const title = isPublication
              ? item.manuscriptTitle || 'Untitled'
              : item.researchTitle || 'Untitled Research';
            const subId = isPublication
              ? item.applicationId
              : item.submissionId || `MCMSS-MREC ${id}`;
            return (
              <TableRow key={id}>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-foreground whitespace-normal">{title}</div>
                  <div className="text-xs text-muted-foreground">{subId}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                  {!isPublication && item.revision?.deadline && (
                    <div className={cn('mt-1 text-xs', remainingTone(item.revision.deadline))}>
                      {formatRemaining(item.revision.deadline)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(item.submittedDate)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/${id}`)}>
                      View
                    </Button>
                    {EDITABLE_STATUSES.includes(item.status) && (
                      <Button variant="secondary" size="sm" onClick={() => navigate(`${basePath}/${id}/edit`)}>
                        {REVISION_STATUSES.includes(item.status) ? 'Revise' : 'Edit'}
                      </Button>
                    )}
                    {item.status === 'draft' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget({ id, title, isPublication })}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderListSection = (tabId) => {
    const isPublication = tabId === 'publication-funding';
    const rows = isPublication ? publicationApps : ethicsSubmissions;
    const activeForm = FORM_TYPES.find((f) => f.id === tabId);
    const { Icon } = activeForm;

    if (loading) {
      return (
        <Card>
          <CardContent className="space-y-3 py-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    if (rows.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {isPublication ? 'No publication funding applications yet' : 'No ethics submissions yet'}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your submitted applications will appear here.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden py-0">
        {renderTable(rows, isPublication)}
      </Card>
    );
  };

  const renderAssignmentsTable = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="space-y-3 py-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      );
    }
    if (assignedReviews.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No submissions assigned to you yet.
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Research Title</TableHead>
              <TableHead>Principal Investigator</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Your response</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedReviews.map((item) => {
              const id = item._id || item.id;
              const accepted = item.reviewerAcceptance?.status === 'accepted';
              const declined = item.reviewerAcceptance?.status === 'rejected';
              return (
                <TableRow key={id}>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-foreground whitespace-normal">
                      {item.researchTitle || 'Untitled Research'}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.submissionId || `#${id}`}</div>
                  </TableCell>
                  <TableCell>{getInvestigatorName(item)}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell>
                    <span className={accepted ? 'text-success' : declined ? 'text-destructive' : 'text-muted-foreground'}>
                      {accepted ? 'Accepted' : declined ? 'Declined' : 'Awaiting (check email)'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/submission/${id}`)}>
                        View
                      </Button>
                      {accepted && item.status === 'under_review' && (
                        <Button size="sm" onClick={() => navigate(`/submission/${id}`)}>
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} onLogout={onLogout} />

      <main className="mx-auto max-w-[1300px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Application Portal</h2>
          <p className="mt-1 text-muted-foreground">
            Choose a form below to start a new application, or view your existing submissions.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2" aria-label="Available forms">
          {FORM_TYPES.map((form) => (
            <FormTypeCard
              key={form.id}
              form={form}
              count={counts[form.id]}
              onStart={() => navigate(form.newRoute)}
              onViewApplications={() => setActiveTab(form.id)}
            />
          ))}
        </section>

        {isReviewer && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Assigned Reviews</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Submissions assigned to you as a reviewer. Accept the request from your email, then submit your decision.
              </p>
            </div>
            {renderAssignmentsTable()}
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">My applications</h3>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
            <TabsList>
              {FORM_TYPES.map((form) => (
                <TabsTrigger key={form.id} value={form.id}>
                  {form.id === 'ethics' ? 'Ethics' : 'Publication Funding'} ({counts[form.id]})
                </TabsTrigger>
              ))}
            </TabsList>
            {FORM_TYPES.map((form) => (
              <TabsContent key={form.id} value={form.id}>
                {renderListSection(form.id)}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete draft?</DialogTitle>
            <DialogDescription>
              This will permanently delete the draft
              {deleteTarget?.title ? ` "${deleteTarget.title}"` : ''} and any files attached to it. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;
