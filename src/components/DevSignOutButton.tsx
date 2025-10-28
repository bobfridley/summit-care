// @ts-nocheck
import React from 'react';
import { LogOut } from '@/components/icons';

export default function DevSignOutButton() {
  if (!import.meta.env.DEV) return null;

  const onClick = () => {
    try {
      localStorage.removeItem('b44-session-token');
    } catch {
      /* no-op: dev sign-out should not throw */
    }
    // full reload so useAuth() etc. re-evaluate
    location.reload();
  };

  return (
    <button
      onClick={onClick}
      className='inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800'
      title='Clear local dev token and reload'
    >
      <LogOut className='h-4 w-4' />
      <span>Sign out (Dev)</span>
    </button>
  );
}
