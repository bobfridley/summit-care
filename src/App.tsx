import React, { Suspense } from 'react';
import Pages from './pages';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';

function Fallback() {
  return <div className='p-6 text-sm text-gray-500'>Loading…</div>;
}

export default function App() {
  return (
    <>
      <Navigation />
      <main className='min-h-screen'>
        <Suspense fallback={<Fallback />}>
          <Pages />
        </Suspense>
      </main>
      <Toaster />
    </>
  );
}

// export default App;
