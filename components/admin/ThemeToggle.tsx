
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
    return <Button variant="ghost" size="sm" className="w-9 h-9 rounded-md bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-500/30" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-pink-200 dark:border-pink-500/30 shadow-sm transition-all duration-200"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-pink-500 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-gray-700 dark:text-gray-300 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
