import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-plum p-12 text-plum-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/35%),transparent_55%)]"
        />
        <div className="relative flex items-center gap-2 text-sm font-medium text-white/70">
          <ShieldCheck className="size-5 text-primary" />
          Secure Research Portal
        </div>
        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-wide text-white/60">
            Medical City for Military and Security Services
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">
            Research and Studies Committee
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Secure portal for ethics applications and publication funding requests.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          &copy; 2026 Research and Studies Committee. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
