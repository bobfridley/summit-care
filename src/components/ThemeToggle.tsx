// @ts-nocheck
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage?.getItem('theme');

    const root = document.documentElement; // HTMLElement
    // Apply class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Persist
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  return (
    <button
      type='button'
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label='Toggle theme'
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
