// @ts-nocheck
// src/components/NavLinks.tsx
import React from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------
   Helper: returns a preloading Link for any lazy page
------------------------------------------------------------ */
function makePreloadLink(path: string, importer: () => Promise<unknown>, label?: string) {
  const preload = () => {
    // Fire-and-forget to warm the chunk
    void importer();
  };

  return (
    <Link
      key={path}
      href={path}
      onMouseEnter={preload}
      className='hover:underline text-sm text-gray-700 dark:text-gray-300 transition-colors'
    >
      {label || path.replace('/', '')}
    </Link>
  );
}

/* ------------------------------------------------------------
   Individual preloading links
------------------------------------------------------------ */
export const NavLinkDashboard = () =>
  makePreloadLink('/dashboard', () => import('@/pages/Dashboard'), 'Dashboard');
export const NavLinkMedications = () =>
  makePreloadLink('/medications', () => import('@/pages/Medications'), 'Medications');
export const NavLinkDatabase = () =>
  makePreloadLink('/database', () => import('@/pages/Database'), 'Database');
export const NavLinkReports = () =>
  makePreloadLink('/reports', () => import('@/pages/Reports'), 'Reports');
export const NavLinkClimbs = () =>
  makePreloadLink('/climbs', () => import('@/pages/Climbs'), 'Climbs');
export const NavLinkAIPlayground = () =>
  makePreloadLink('/aiplayground', () => import('@/pages/AIPlayground'), 'AI Playground');
export const NavLinkBrandAssets = () =>
  makePreloadLink('/brandassets', () => import('@/pages/BrandAssets'), 'Brand Assets');
export const NavLinkClimbGear = () =>
  makePreloadLink('/climbgear', () => import('@/pages/ClimbGear'), 'Climb Gear');
export const NavLinkDBAccessHelp = () =>
  makePreloadLink('/dbaccesshelp', () => import('@/pages/DBAccessHelp'), 'DB Access Help');
export const NavLinkMySQLSchema = () =>
  makePreloadLink('/mysqlschema', () => import('@/pages/MySQLSchema'), 'MySQL Schema');
export const NavLinkMySQLSampleData = () =>
  makePreloadLink('/mysqlsampledata', () => import('@/pages/MySQLSampleData'), 'MySQL Sample Data');
export const NavLinkDisclaimer = () =>
  makePreloadLink('/disclaimer', () => import('@/pages/Disclaimer'), 'Disclaimer');
