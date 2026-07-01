import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ClipboardList,
  Users,
  Settings,
  BarChart3,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Search,
  Download,
} from 'lucide-react';
import {
  getSubmissions,
  assignReviewer,
  submitReview,
  getReviewers,
  createReviewer,
  updateReviewer,
  deleteReviewer,
  exportSubmission,
  getPublicationFundingApplications,
  assignPublicationFundingReviewer,
  submitPublicationFundingReview,
  exportPublicationFunding,
  getAdminUsers,
  getNotificationSettings,
  updateNotificationSettings,
} from '../utils/api';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'applications', label: 'All Applications', Icon: ClipboardList },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'administration', label: 'Administration', Icon: Settings },
  { id: 'settings', label: 'Settings', Icon: Bell },
  { id: 'reports', label: 'Reports & Analytics', Icon: BarChart3 },
];

const NO_RECIPIENT = 'none';

function StatCard({ value, label }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="px-4">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function ComingSoon({ title, description, detail }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        {detail && <p className="max-w-md text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
}

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [publicationApps, setPublicationApps] = useState([]);
  const [applicationTab, setApplicationTab] = useState('ethics');
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedApplicationType, setSelectedApplicationType] = useState('ethics');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ status: 'approved', comments: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeSection, setActiveSection] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddReviewerModal, setShowAddReviewerModal] = useState(false);
  const [showEditReviewerModal, setShowEditReviewerModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [reviewerForm, setReviewerForm] = useState({ name: '', email: '', specialization: '' });
  const [reviewerFormError, setReviewerFormError] = useState('');
  const [reviewerToDeactivate, setReviewerToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [selectedAssignReviewerId, setSelectedAssignReviewerId] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [notificationRecipientId, setNotificationRecipientId] = useState(NO_RECIPIENT);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subsData, pubData, revsData, adminsData, settingsData] = await Promise.all([
        getSubmissions(),
        getPublicationFundingApplications(),
        getReviewers(),
        getAdminUsers().catch(() => []),
        getNotificationSettings().catch(() => null),
      ]);
      setSubmissions(subsData);
      setPublicationApps(pubData);
      setReviewers(revsData);
      setAdminUsers(adminsData || []);
      const recipient = settingsData?.submissionNotificationRecipient;
      setNotificationRecipientId(recipient?._id || recipient?.id || NO_RECIPIENT);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSavingSettings(true);
    try {
      await updateNotificationSettings(
        notificationRecipientId === NO_RECIPIENT ? null : notificationRecipientId
      );
      toast.success('Notification settings saved.');
    } catch {
      toast.error('Failed to save notification settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAssignReviewer = async (submissionId, reviewerId) => {
    try {
      if (selectedApplicationType === 'publication') {
        await assignPublicationFundingReviewer(submissionId, reviewerId);
      } else {
        await assignReviewer(submissionId, reviewerId);
      }
      await loadData();
      setShowAssignModal(false);
      setSelectedSubmission(null);
      toast.success('Reviewer assigned successfully!');
    } catch {
      toast.error('Failed to assign reviewer. Please try again.');
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.comments.trim()) {
      toast.error('Please provide review comments.');
      return;
    }

    try {
      const id = selectedSubmission._id || selectedSubmission.id;
      if (selectedApplicationType === 'publication') {
        await submitPublicationFundingReview(id, reviewData.status, reviewData.comments);
      } else {
        await submitReview(id, reviewData.status, reviewData.comments);
      }
      await loadData();
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewData({ status: 'approved', comments: '' });
      toast.success('Review submitted successfully!');
    } catch {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  const handleExport = async (submissionId, type = 'ethics') => {
    try {
      const data = type === 'publication'
        ? await exportPublicationFunding(submissionId)
        : await exportSubmission(submissionId);
      const item = data.application || data.submission || data;
      const json = JSON.stringify(item, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'publication' ? 'publication-funding' : 'submission'}-${item.applicationId || item.submissionId || submissionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export. Please try again.');
    }
  };

  const openAddReviewerModal = () => {
    setReviewerForm({ name: '', email: '', specialization: '' });
    setReviewerFormError('');
    setShowAddReviewerModal(true);
  };

  const openEditReviewerModal = (reviewer) => {
    setSelectedReviewer(reviewer);
    setReviewerForm({
      name: reviewer.name || '',
      email: reviewer.email || '',
      specialization: reviewer.specialization || '',
    });
    setReviewerFormError('');
    setShowEditReviewerModal(true);
  };

  const handleAddReviewer = async (e) => {
    e.preventDefault();
    if (!reviewerForm.name.trim()) {
      setReviewerFormError('Name is required.');
      return;
    }
    if (!reviewerForm.email.trim()) {
      setReviewerFormError('Email is required.');
      return;
    }
    setReviewerFormError('');
    try {
      await createReviewer(reviewerForm);
      await loadData();
      setShowAddReviewerModal(false);
      toast.success('Reviewer added.');
    } catch (error) {
      setReviewerFormError(error.response?.data?.message || 'Failed to add reviewer. Please try again.');
    }
  };

  const handleEditReviewer = async (e) => {
    e.preventDefault();
    if (!selectedReviewer) return;
    if (!reviewerForm.name.trim()) {
      setReviewerFormError('Name is required.');
      return;
    }
    if (!reviewerForm.email.trim()) {
      setReviewerFormError('Email is required.');
      return;
    }
    setReviewerFormError('');
    try {
      await updateReviewer(selectedReviewer._id || selectedReviewer.id, reviewerForm);
      await loadData();
      setShowEditReviewerModal(false);
      setSelectedReviewer(null);
      toast.success('Reviewer updated.');
    } catch (error) {
      setReviewerFormError(error.response?.data?.message || 'Failed to update reviewer. Please try again.');
    }
  };

  const confirmDeactivateReviewer = async () => {
    if (!reviewerToDeactivate) return;
    setDeactivating(true);
    try {
      await deleteReviewer(reviewerToDeactivate._id || reviewerToDeactivate.id);
      await loadData();
      setReviewerToDeactivate(null);
      toast.success('Reviewer deactivated.');
    } catch {
      toast.error('Failed to deactivate reviewer. Please try again.');
    } finally {
      setDeactivating(false);
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

  const getAvailableYears = (items) => {
    const years = new Set();
    items.forEach((s) => {
      if (s.submittedDate) {
        years.add(new Date(s.submittedDate).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const computeStats = (items) => ({
    total: items.length,
    draft: items.filter((s) => s.status === 'draft').length,
    under_review: items.filter((s) => s.status === 'under_review').length,
    approved: items.filter((s) => s.status === 'approved').length,
    revisions_required: items.filter((s) => s.status === 'revisions_required').length,
    rejected: items.filter((s) => s.status === 'rejected').length,
  });

  const matchesPeriod = (date) => {
    if (filterPeriod === 'all' || !date) return true;
    const daysDiff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (filterPeriod === 'today') return daysDiff === 0;
    if (filterPeriod === 'week') return daysDiff <= 7;
    if (filterPeriod === 'month') return daysDiff <= 30;
    if (filterPeriod === 'quarter') return daysDiff <= 90;
    if (filterPeriod === 'year') return daysDiff <= 365;
    return true;
  };

  const matchesYear = (date) => {
    if (!filterYear) return true;
    const year = date ? new Date(date).getFullYear() : null;
    return year === parseInt(filterYear, 10);
  };

  const filteredSubmissions = (filterStatus === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filterStatus))
    .filter((s) => s.status !== 'draft')
    .filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.principalInvestigator?.toLowerCase().includes(query);
        const email = s.formData?.principalInvestigator?.email || '';
        const matchesEmail = email.toLowerCase().includes(query);
        const matchesTitle = s.researchTitle?.toLowerCase().includes(query);
        const matchesId = (s.submissionId || `#${s.id}`).toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesTitle && !matchesId) return false;
      }
      return matchesYear(s.submittedDate) && matchesPeriod(s.submittedDate);
    });

  const filteredPublicationApps = (filterStatus === 'all'
    ? publicationApps
    : publicationApps.filter((s) => s.status === filterStatus))
    .filter((s) => s.status !== 'draft')
    .filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = s.applicantName?.toLowerCase().includes(query);
        const matchesTitle = s.manuscriptTitle?.toLowerCase().includes(query);
        const matchesId = (s.applicationId || '').toLowerCase().includes(query);
        if (!matchesName && !matchesTitle && !matchesId) return false;
      }
      return matchesYear(s.submittedDate) && matchesPeriod(s.submittedDate);
    });

  const stats = computeStats(submissions);
  const publicationStats = computeStats(publicationApps);
  const isPublicationTab = applicationTab === 'publication';
  const activeList = isPublicationTab ? filteredPublicationApps : filteredSubmissions;
  const activeStats = isPublicationTab ? publicationStats : stats;
  const activeYears = getAvailableYears(isPublicationTab ? publicationApps : submissions);

  const openAssignModal = (item, type) => {
    setSelectedApplicationType(type);
    setSelectedSubmission(item);
    setSelectedAssignReviewerId('');
    setShowAssignModal(true);
  };

  const openReviewModal = (item, type) => {
    setSelectedApplicationType(type);
    setSelectedSubmission(item);
    setShowReviewModal(true);
  };

  const renderApplicationRows = () =>
    activeList.map((item) => {
      const id = item._id || item.id;
      const idLabel = isPublicationTab
        ? item.applicationId
        : item.submissionId || `MCMSS-MREC ${item.id}/${new Date(item.submittedDate || Date.now()).getFullYear()}`;
      const title = isPublicationTab ? item.manuscriptTitle || 'Untitled' : item.researchTitle || 'Untitled Research';
      const person = isPublicationTab ? item.applicantName : item.principalInvestigator;
      const basePath = isPublicationTab ? '/publication-funding' : '/submission';
      const type = isPublicationTab ? 'publication' : 'ethics';
      return (
        <TableRow key={id}>
          <TableCell className="font-mono text-xs text-muted-foreground">{idLabel}</TableCell>
          <TableCell className="max-w-xs font-medium whitespace-normal">{title}</TableCell>
          <TableCell>{person}</TableCell>
          <TableCell>
            <StatusBadge status={item.status} />
          </TableCell>
          <TableCell className="text-muted-foreground">{formatDate(item.submittedDate)}</TableCell>
          <TableCell>
            {item.assignedReviewer || <span className="text-muted-foreground">Not assigned</span>}
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`${basePath}/${id}`)}>
                View
              </Button>
              {item.status === 'under_review' && !item.assignedReviewer && (
                <Button size="sm" onClick={() => openAssignModal(item, type)}>
                  Assign
                </Button>
              )}
              {item.status === 'under_review' && item.assignedReviewer && (
                <Button size="sm" variant="plum" onClick={() => openReviewModal(item, type)}>
                  Review
                </Button>
              )}
              <Button variant="ghost" size="icon" title="Export" onClick={() => handleExport(id, type)}>
                <Download />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });

  const renderApplicationsView = () => (
    <div className="space-y-6">
      <Tabs value={applicationTab} onValueChange={setApplicationTab}>
        <TabsList>
          <TabsTrigger value="ethics">Ethics Submissions ({submissions.length})</TabsTrigger>
          <TabsTrigger value="publication">Publication Funding ({publicationApps.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={activeStats.total - activeStats.draft} label={isPublicationTab ? 'Total Applications' : 'Total Submissions'} />
        <StatCard value={activeStats.under_review} label="Under Review" />
        <StatCard value={activeStats.approved} label="Approved" />
        <StatCard value={activeStats.revisions_required} label="Revisions Required" />
        <StatCard value={activeStats.rejected} label="Rejected" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={isPublicationTab ? 'ID, applicant, or title...' : 'ID, name, email, or title...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="revisions_required">Revisions Required</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Year</Label>
              <Select
                value={filterYear || 'all'}
                onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {activeYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time Period</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading applications...</div>
        ) : activeList.length === 0 ? (
          <div className="p-14 text-center">
            <h3 className="text-base font-semibold text-foreground">
              No {isPublicationTab ? 'applications' : 'submissions'} found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{isPublicationTab ? 'Manuscript Title' : 'Research Title'}</TableHead>
                <TableHead>{isPublicationTab ? 'Applicant' : 'Principal Investigator'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Assigned Reviewer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderApplicationRows()}</TableBody>
          </Table>
        )}
      </Card>
    </div>
  );

  const renderAdministrationView = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Administration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reviewer assignments and administrative tasks.
          </p>
        </div>
        <Button onClick={openAddReviewerModal}>
          <Plus />
          Add Reviewer
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2">
          <h3 className="font-semibold text-plum">Reviewer Assignment</h3>
          <p className="text-sm text-muted-foreground">
            Use the "Assign" button in the Applications view to assign reviewers to submissions under review.
          </p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <h3 className="font-semibold text-plum">Available Reviewers</h3>
        </div>
        {reviewers.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No reviewers available</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewers.map((reviewer) => (
                <TableRow key={reviewer._id || reviewer.id}>
                  <TableCell className="font-medium">{reviewer.name}</TableCell>
                  <TableCell>{reviewer.specialization || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{reviewer.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditReviewerModal(reviewer)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setReviewerToDeactivate(reviewer)}>
                        Deactivate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );

  const renderSettingsView = () => {
    const selectedAdmin = adminUsers.find(
      (a) => (a._id || a.id) === notificationRecipientId
    );
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure platform-wide administrative settings.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-plum">Submission Notifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose which admin account receives an email when a new form (research ethics or
                publication funding) is submitted.
              </p>
            </div>
            <div className="max-w-md space-y-2">
              <Label>Notification recipient</Label>
              <Select value={notificationRecipientId} onValueChange={setNotificationRecipientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an admin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_RECIPIENT}>No notifications</SelectItem>
                  {adminUsers.map((admin) => {
                    const aid = admin._id || admin.id;
                    const name = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
                    return (
                      <SelectItem key={aid} value={String(aid)}>
                        {name} — {admin.email}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {adminUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">No admin accounts found.</p>
              )}
              {selectedAdmin && (
                <p className="text-xs text-muted-foreground">
                  Notifications will be sent to {selectedAdmin.email}.
                </p>
              )}
            </div>
            <div>
              <Button onClick={handleSaveNotificationSettings} disabled={savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const reviewerFields = (
    <div className="space-y-4">
      {reviewerFormError && (
        <Alert variant="destructive">
          <AlertDescription>{reviewerFormError}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="reviewer-name">Name *</Label>
        <Input
          id="reviewer-name"
          value={reviewerForm.name}
          onChange={(e) => setReviewerForm({ ...reviewerForm, name: e.target.value })}
          placeholder="Reviewer full name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reviewer-email">Email *</Label>
        <Input
          id="reviewer-email"
          type="email"
          value={reviewerForm.email}
          onChange={(e) => setReviewerForm({ ...reviewerForm, email: e.target.value })}
          placeholder="reviewer@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reviewer-spec">Specialization</Label>
        <Input
          id="reviewer-spec"
          value={reviewerForm.specialization}
          onChange={(e) => setReviewerForm({ ...reviewerForm, specialization: e.target.value })}
          placeholder="e.g. Clinical Research, Ethics"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#442D40] text-white dark:border-border dark:bg-card dark:text-foreground">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-accent dark:hover:text-foreground"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeft /> : <PanelLeftClose />}
            </Button>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg dark:text-foreground">Admin Panel</h1>
              <span className="text-xs text-white/60 dark:text-muted-foreground">Research and Studies Committee</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-accent dark:hover:text-foreground" />
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-white/10 bg-[#442D40] p-3 transition-all sm:block dark:border-border dark:bg-card',
            sidebarCollapsed ? 'w-16' : 'w-60'
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const { id, label, Icon } = item;
              return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                title={label}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  activeSection === id
                    ? 'bg-white/15 text-white dark:bg-primary/10 dark:text-primary'
                    : 'text-white/60 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === 'applications' && renderApplicationsView()}
          {activeSection === 'users' && (
            <ComingSoon
              title="Users Management"
              description="Manage users, roles, and permissions from here."
              detail="This feature will be implemented to manage all platform users, their roles, and access permissions."
            />
          )}
          {activeSection === 'administration' && renderAdministrationView()}
          {activeSection === 'settings' && renderSettingsView()}
          {activeSection === 'reports' && (
            <ComingSoon
              title="Reports & Analytics"
              description="View detailed reports and analytics about submissions, reviews, and platform usage."
              detail="This section will provide comprehensive reports, statistics, and analytics for administrative insights."
            />
          )}
        </main>
      </div>

      {/* Assign Reviewer Modal */}
      <Dialog open={showAssignModal} onOpenChange={(o) => { setShowAssignModal(o); if (!o) setSelectedAssignReviewerId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Reviewer</DialogTitle>
            <DialogDescription>
              {selectedApplicationType === 'publication' ? 'Manuscript' : 'Research'}:{' '}
              {selectedApplicationType === 'publication'
                ? selectedSubmission?.manuscriptTitle
                : selectedSubmission?.researchTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Select Reviewer</Label>
            <Select value={selectedAssignReviewerId} onValueChange={setSelectedAssignReviewerId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a reviewer..." /></SelectTrigger>
              <SelectContent>
                {reviewers.map((reviewer) => {
                  const rid = reviewer._id || reviewer.id;
                  return (
                    <SelectItem key={rid} value={String(rid)}>
                      {reviewer.name}{reviewer.specialization ? ` — ${reviewer.specialization}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setShowAssignModal(false); setSelectedAssignReviewerId(''); }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedAssignReviewerId}
              onClick={() => handleAssignReviewer(selectedSubmission._id || selectedSubmission.id, selectedAssignReviewerId)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Review</DialogTitle>
            <DialogDescription>
              {selectedApplicationType === 'publication' ? 'Manuscript' : 'Research'}:{' '}
              {selectedApplicationType === 'publication'
                ? selectedSubmission?.manuscriptTitle
                : selectedSubmission?.researchTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Review Status *</Label>
              <Select value={reviewData.status} onValueChange={(v) => setReviewData({ ...reviewData, status: v })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="revisions_required">Revisions Required</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Review Comments *</Label>
              <Textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                rows={6}
                placeholder="Enter your review comments and feedback..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Reviewer Modal */}
      <Dialog open={showAddReviewerModal} onOpenChange={setShowAddReviewerModal}>
        <DialogContent>
          <form onSubmit={handleAddReviewer}>
            <DialogHeader>
              <DialogTitle>Add Reviewer</DialogTitle>
            </DialogHeader>
            <div className="py-4">{reviewerFields}</div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowAddReviewerModal(false)}>Cancel</Button>
              <Button type="submit">Add Reviewer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Reviewer Modal */}
      <Dialog open={showEditReviewerModal} onOpenChange={setShowEditReviewerModal}>
        <DialogContent>
          <form onSubmit={handleEditReviewer}>
            <DialogHeader>
              <DialogTitle>Edit Reviewer</DialogTitle>
            </DialogHeader>
            <div className="py-4">{reviewerFields}</div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setShowEditReviewerModal(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Reviewer Confirmation */}
      <Dialog open={!!reviewerToDeactivate} onOpenChange={(o) => { if (!o) setReviewerToDeactivate(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Reviewer</DialogTitle>
            <DialogDescription>
              Deactivate <span className="font-medium text-foreground">{reviewerToDeactivate?.name}</span>? They will no
              longer appear in the reviewers list or be available for new assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setReviewerToDeactivate(null)} disabled={deactivating}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivateReviewer} disabled={deactivating}>
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPanel;
