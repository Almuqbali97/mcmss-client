import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';

function AppHeader({
  user,
  onLogout,
  title = 'Research and Studies Committee',
  subtitle = 'Medical City for Military and Security Services',
  actions,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#442D40] text-white">
      <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">
            {title}
          </h1>
          <span className="truncate text-xs text-white/60">{subtitle}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 [&_[data-slot=button].bg-background]:border-white/20 [&_[data-slot=button].bg-background]:bg-white/10 [&_[data-slot=button].bg-background]:text-white [&_[data-slot=button].bg-background]:hover:bg-white/20 [&_[data-slot=button].bg-background]:hover:text-white">
          {actions}
          <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
