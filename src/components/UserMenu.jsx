import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserMenu.css';

const ROLE_LABELS = {
  researcher: 'Researcher',
  reviewer: 'Reviewer',
  admin: 'Administrator',
};

function ChevronIcon({ open }) {
  return (
    <svg
      className={`user-menu-chevron ${open ? 'open' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleAction = (fn) => {
    setOpen(false);
    fn?.();
  };

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

  menuItems.push({
    id: 'logout',
    label: 'Sign out',
    onClick: onLogout,
    className: 'user-menu-item-logout',
  });

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.name || user?.email || 'User';

  const shortName = user?.firstName || user?.name?.split(/\s+/)[0] || displayName.split(/\s+/)[0] || 'User';

  const firstInitial = (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase();
  const lastInitial = (user?.lastName?.[0] || (user?.name?.trim()?.split(/\s+/)?.[1]?.[0]) || '').toUpperCase();
  const initials = (firstInitial + lastInitial) || 'U';

  const roleLabel = ROLE_LABELS[user?.role] || user?.role?.replace('_', ' ') || 'User';

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={`user-menu-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Account menu for ${displayName}`}
      >
        <span className="user-menu-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="user-menu-identity">
          <span className="user-menu-name">{shortName}</span>
          <span className="user-menu-role-pill">{roleLabel}</span>
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <span className="user-menu-avatar user-menu-avatar--lg" aria-hidden="true">
              {initials}
            </span>
            <div className="user-menu-header-text">
              <span className="user-menu-header-name">{displayName}</span>
              <span className="user-menu-header-email">{user?.email}</span>
            </div>
          </div>
          <ul className="user-menu-list">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="menuitem"
                  className={`user-menu-item ${item.className || ''}`}
                  onClick={() => handleAction(item.onClick)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
