// @ts-nocheck
import Dashboard from './Dashboard';
import Medications from './Medications';
import Database from './Database';
import Reports from './Reports';
import Climbs from './Climbs';
import AIPlayground from './AIPlayground';
import BrandAssets from './BrandAssets';
import ClimbGear from './ClimbGear';
import DBAccessHelp from './DBAccessHelp';
import MySQLSchema from './MySQLSchema';
import MySQLSampleData from './MySQLSampleData';
import Disclaimer from '@/pages/Disclaimer';
import { useLocation } from 'react-router-dom';

const PAGES = {
  Dashboard: Dashboard,
  Medications: Medications,
  Database: Database,
  Reports: Reports,
  Climbs: Climbs,
  AIPlayground: AIPlayground,
  BrandAssets: BrandAssets,
  ClimbGear: ClimbGear,
  DBAccessHelp: DBAccessHelp,
  MySQLSchema: MySQLSchema,
  MySQLSampleData: MySQLSampleData,
  Disclaimer: Disclaimer,
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        {/* prefer lowercase paths; keep a redirect from "/" */}
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/medications' element={<Medications />} />
        <Route path='/database' element={<Database />} />
        <Route path='/reports' element={<Reports />} />
        <Route path='/climbs' element={<Climbs />} />
        <Route path='/aiplayground' element={<AIPlayground />} />
        <Route path='/brandassets' element={<BrandAssets />} />
        <Route path='/climbgear' element={<ClimbGear />} />
        <Route path='/dbaccesshelp' element={<DBAccessHelp />} />
        <Route path='/mysqlschema' element={<MySQLSchema />} />
        <Route path='/mysqlsampledata' element={<MySQLSampleData />} />
        <Route path='/disclaimer' element={<Disclaimer />} />
        <Route path='/dev-auth' element={<DevAuth />} />
        <Route path='/admin' element={<Admin />} />
        {/* catch-all → dashboard */}
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return <PagesContent />; // ← no Router here
}
