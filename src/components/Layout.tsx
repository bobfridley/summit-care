// src/components/Layout.tsx
// @ts-nocheck
import { ReactNode, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { Mountain } from '@/components/icons';
import { COLORS } from '@shared/constants';

type LayoutProps = {
  children: ReactNode;
  currentPageName?: string;
};

export default function Layout({ children, currentPageName }: LayoutProps) {
  const router = useRouter();
  const { pathname, asPath, query, isReady } = router;

  const derivedPageName = useMemo(() => {
    if (!pathname) return '';
    const seg = pathname.split('/').filter(Boolean).pop() ?? 'Home';
    return seg.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }, [pathname]);

  const pageName = currentPageName ?? derivedPageName;

  const isHome = pathname === '/' || pathname === '/index';
  const hideChrome = pathname === '/DevAuth';
  const isClimbGear = pathname === '/ClimbGear';

  const climbId = isReady
    ? Array.isArray(query.climbId)
      ? query.climbId[0]
      : query.climbId
    : undefined;

  return (
    <div
      className={`min-h-screen flex flex-col ${
        hideChrome ? '' : 'bg-gradient-to-br from-neutral-warm via-white to-stone-50'
      }`}
    >
      {!hideChrome && (
        <header
          className='border-b border-stone-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-stone-800 dark:bg-stone-950/70'
          style={{ '--brand': COLORS.brandGreen } as React.CSSProperties}
        >
          <div className='mx-auto flex max-w-6xl items-center justify-between p-4'>
            <Link href='/dashboard' className='flex items-center gap-2'>
              <Mountain className='h-5 w-5' style={{ color: COLORS.brandGreen }} />
              <span className='text-lg font-semibold text-stone-900 dark:text-stone-100'>
                SummitCare
              </span>
            </Link>

            <div className='flex items-center gap-3'>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 ${hideChrome ? '' : 'max-w-6xl mx-auto p-4'}`}>
        <h1 className='sr-only'>{pageName}</h1>
        {children}
      </main>

      {!hideChrome && (
        <footer className='border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950'>
          <div className='mx-auto flex max-w-6xl items-center justify-between p-4 text-xs text-stone-500'>
            <span>
              {isHome ? 'Welcome home.' : `Path: ${asPath}`}
              {isClimbGear && climbId ? ` • Climb #${climbId}` : ''}
            </span>
            <span>© {new Date().getFullYear()} SummitCare</span>
          </div>
        </footer>
      )}
    </div>
  );
}
