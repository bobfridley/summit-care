// @ts-nocheck
// src/components/NavDisclaimerLink.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NavDisclaimerLink() {
  const preload = () => {
    // Fire-and-forget dynamic import to warm the chunk
    void import('@/pages/Disclaimer');
  };

  return (
    <Link to='/disclaimer' onMouseEnter={preload} className='text-sm text-gray-600 hover:underline'>
      Disclaimer
    </Link>
  );
}
