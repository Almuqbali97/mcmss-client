import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ThemeToggle({ className, variant = 'ghost' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className={className}
    >
      {/* Avoid an incorrect icon flash before the theme is resolved on the client */}
      {mounted && isDark ? <Sun /> : <Moon className={mounted ? undefined : 'opacity-0'} />}
    </Button>
  );
}

export default ThemeToggle;
