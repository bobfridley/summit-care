// tests/setupTests.tsx
import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Auto-clean up between tests
afterEach(() => cleanup());

// --- Next.js light mocks ---

// Make <Link> behave like a normal <a> in tests
vi.mock('next/link', () => {
  return {
    default: React.forwardRef<HTMLAnchorElement, any>(function Link(
      { href, children, ...props },
      ref
    ) {
      return (
        <a href={typeof href === 'string' ? href : (href?.pathname ?? '#')} ref={ref} {...props}>
          {children}
        </a>
      );
    }),
  };
});

// Minimal router mock (only if something imports next/router)
vi.mock('next/router', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      pathname: '/',
      query: {},
      isReady: true,
    }),
  };
});

// Optional: next/image mock (render plain <img /> with alt)
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img alt={props.alt ?? ''} {...props} />;
  },
}));
