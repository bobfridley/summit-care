// @ts-nocheck
// src/components/DevSignInButton.tsx
import React from 'react';
import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DevSignInButton() {
  // Only render in development mode
  if (!import.meta.env.DEV) return null;

  return (
    <Link
      to='/dev-auth'
      className='inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800'
      title='Paste a Base44 session/service token for local dev'
    >
      <LogIn className='h-4 w-4' />
      <span>Sign in (Dev)</span>
    </Link>
  );
}
