import Layout from "./Layout.jsx";

import ClimbGear from "./ClimbGear";

import Disclaimer from "./Disclaimer";

import dashboard from "./dashboard";

import medications from "./medications";

import climbs from "./climbs";

import database from "./database";

import reports from "./reports";

import ai-playground from "./ai-playground";

import brand-assets from "./brand-assets";

import db-access-help from "./db-access-help";

import mysql-schema from "./mysql-schema";

import mysql-sample-data from "./mysql-sample-data";

import cert-debug from "./cert-debug";

import summit-assistant from "./summit-assistant";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ClimbGear: ClimbGear,
    
    Disclaimer: Disclaimer,
    
    dashboard: dashboard,
    
    medications: medications,
    
    climbs: climbs,
    
    database: database,
    
    reports: reports,
    
    ai-playground: ai-playground,
    
    brand-assets: brand-assets,
    
    db-access-help: db-access-help,
    
    mysql-schema: mysql-schema,
    
    mysql-sample-data: mysql-sample-data,
    
    cert-debug: cert-debug,
    
    summit-assistant: summit-assistant,
    
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
                
                    <Route path="/" element={<ClimbGear />} />
                
                
                <Route path="/ClimbGear" element={<ClimbGear />} />
                
                <Route path="/Disclaimer" element={<Disclaimer />} />
                
                <Route path="/dashboard" element={<dashboard />} />
                
                <Route path="/medications" element={<medications />} />
                
                <Route path="/climbs" element={<climbs />} />
                
                <Route path="/database" element={<database />} />
                
                <Route path="/reports" element={<reports />} />
                
                <Route path="/ai-playground" element={<ai-playground />} />
                
                <Route path="/brand-assets" element={<brand-assets />} />
                
                <Route path="/db-access-help" element={<db-access-help />} />
                
                <Route path="/mysql-schema" element={<mysql-schema />} />
                
                <Route path="/mysql-sample-data" element={<mysql-sample-data />} />
                
                <Route path="/cert-debug" element={<cert-debug />} />
                
                <Route path="/summit-assistant" element={<summit-assistant />} />
                
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