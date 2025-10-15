import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Medications from "./Medications";
import Database from "./Database";
import Reports from "./Reports";
import Climbs from "./Climbs";
import AIPlayground from "./AIPlayground";
import BrandAssets from "./BrandAssets";
import ClimbGear from "./ClimbGear";
import DBAccessHelp from "./DBAccessHelp";
import MySQLSchema from "./MySQLSchema";
import MySQLSampleData from "./MySQLSampleData";
import Disclaimer from "@/pages/Disclaimer";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Dashboard />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Medications" element={<Medications />} />
                <Route path="/Database" element={<Database />} />
                <Route path="/Reports" element={<Reports />} />
                <Route path="/Climbs" element={<Climbs />} />
                <Route path="/AIPlayground" element={<AIPlayground />} />
                <Route path="/BrandAssets" element={<BrandAssets />} />
                <Route path="/ClimbGear" element={<ClimbGear />} />
                <Route path="/DBAccessHelp" element={<DBAccessHelp />} />
                <Route path="/MySQLSchema" element={<MySQLSchema />} />
                <Route path="/MySQLSampleData" element={<MySQLSampleData />} />
                <Route path="/Disclaimer" element={<Disclaimer />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}