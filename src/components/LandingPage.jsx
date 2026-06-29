import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-plum px-4 text-center text-plum-foreground">
        <ThemeToggle className="absolute right-4 top-4 text-white hover:bg-white/10 hover:text-white sm:right-6 sm:top-6" />
        <div className="flex max-w-3xl flex-col items-center">
          <img src={logo} alt="Hospital Logo" className="h-44 w-auto drop-shadow-lg sm:h-52" />
          <p className="mt-6 text-sm font-medium uppercase tracking-wide text-white/70">
            Medical City for Military and Security Services
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Research and Studies Committee
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Submit ethics applications and publication funding requests through our secure portal.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/login">
              Access Platform
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <footer className="absolute inset-x-0 bottom-0 bg-black/20 px-4 py-5 text-center text-xs text-white/55">
          <p>&copy; 2026 Research and Studies Committee at the Medical City for Military and Security Services. All rights reserved.</p>
        </footer>
      </section>
    </div>
  );
}

export default LandingPage;
