
"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Avoid rendering mismatch during hydration, or return a placeholder
    return <Button variant="ghost" size="sm" className="w-9 h-9 rounded-md" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-emerald-500 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-gray-700 dark:text-slate-300 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
