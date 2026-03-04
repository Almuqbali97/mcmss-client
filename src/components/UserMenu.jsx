import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserMenu.css';

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

  const menuItems = [];

  // Dashboard – show for all; label "User Dashboard" when on admin, else "Dashboard"
  if (user?.role === 'admin' && isOnAdmin) {
    menuItems.push({
      id: 'dashboard',
      label: 'User Dashboard',
      onClick: () => navigate('/dashboard'),
    });
  } else if (!isOnDashboard) {
    menuItems.push({
      id: 'dashboard',
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    });
  }

  // Admin Panel – admin only, when not already on admin
  if (user?.role === 'admin' && !isOnAdmin) {
    menuItems.push({
      id: 'admin',
      label: 'Admin Panel',
      onClick: () => navigate('/admin'),
    });
  }

  // New Submission – researcher only
  if (user?.role === 'researcher') {
    menuItems.push({
      id: 'new-submission',
      label: 'New Submission',
      onClick: () => navigate('/submission/new'),
    });
  }

  // Change Password – all roles
  if (!isOnChangePassword) {
    menuItems.push({
      id: 'change-password',
      label: 'Change Password',
      onClick: () => navigate('/change-password'),
    });
  }

  // Logout – all roles
  menuItems.push({
    id: 'logout',
    label: 'Logout',
    onClick: onLogout,
    className: 'user-menu-item-logout',
  });

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.name || user?.email || 'User';

  const firstInitial = (user?.firstName?.[0] || user?.name?.[0] || 'U').toUpperCase();
  const lastInitial = (user?.lastName?.[0] || (user?.name?.trim()?.split(/\s+/)?.[1]?.[0]) || '').toUpperCase();
  const initials = (firstInitial + lastInitial) || 'U';

  return (
    <div className="user-menu" ref={menuRef}>
      <span className="user-menu-welcome">Welcome, {displayName}</span>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <span className="user-menu-avatar" title={displayName}>
          {initials}
        </span>
        <span className={`user-menu-arrow ${open ? 'open' : ''}`} aria-hidden>▼</span>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <span className="user-menu-name">{displayName}</span>
            <span className="user-menu-role">{user?.role?.replace('_', ' ') || 'User'}</span>
          </div>
          <ul className="user-menu-list">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
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
