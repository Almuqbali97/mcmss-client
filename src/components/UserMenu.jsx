import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ROLE_LABELS = {
  researcher: 'Researcher',
  reviewer: 'Reviewer',
  admin: 'Administrator',
};

function UserMenu({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isOnDashboard = location.pathname === '/dashboard';
  const isOnAdmin = location.pathname === '/admin';
  const isOnChangePassword = location.pathname === '/change-password';
  const isReviewer = user?.role === 'reviewer';
  const isAdmin = user?.role === 'admin';

  const menuItems = [];

  if (!isAdmin && !isOnDashboard) {
    menuItems.push({
      id: 'dashboard',
      label: isReviewer ? 'Review Dashboard' : 'Dashboard',
      onClick: () => navigate('/dashboard'),
    });
  }

  if (isAdmin && !isOnAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Admin Panel',
      onClick: () => navigate('/admin'),
    });
  }

  if (user?.role === 'researcher') {
    menuItems.push({
      id: 'new-submission',
      label: 'New Ethics Submission',
      onClick: () => navigate('/submission/new'),
    });
    menuItems.push({
      id: 'new-publication-funding',
      label: 'Publication Funding Application',
      onClick: () => navigate('/publication-funding/new'),
    });
  }

  if (!isOnChangePassword) {
    menuItems.push({
      id: 'change-password',
      label: 'Change Password',
      onClick: () => navigate('/change-password'),
    });
  }

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.name || user?.email || 'User';

  const shortName = user?.firstName || user?.name?.split(/\s+/)[0] || displayName.split(/\s+/)[0] || 'User';

  const firstInitial = (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase();
  const lastInitial = (user?.lastName?.[0] || (user?.name?.trim()?.split(/\s+/)?.[1]?.[0]) || '').toUpperCase();
  const initials = (firstInitial + lastInitial) || 'U';

  const roleLabel = ROLE_LABELS[user?.role] || user?.role?.replace('_', ' ') || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full border border-border bg-background py-1 pl-1 pr-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label={`Account menu for ${displayName}`}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-foreground sm:inline">{shortName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-3 p-2">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <Badge variant="muted" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>
        <DropdownMenuSeparator />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.id} onSelect={item.onClick}>
            {item.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
