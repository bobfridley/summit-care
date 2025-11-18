/* eslint-disable react-refresh/only-export-components */

import Reports from "./reports";
import AiPlayground from "./ai-playground";
import SummitAssistant from "./summit-assistant";
import ClimbGear from "./ClimbGear";
import Disclaimer from "./Disclaimer";
import Layout from "./Layout";
import Climbs from "./climbs";
import Dashboard from "./dashboard";
import Database from "./database";
import Medications from "./medications";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

export const pages = {
  "reports": Reports,
  "ai-playground": AiPlayground,
  "summit-assistant": SummitAssistant,
  "climb-gear": ClimbGear,
  "disclaimer": Disclaimer,
  "layout": Layout,
  "climbs": Climbs,
  "dashboard": Dashboard,
  "database": Database,
  "medications": Medications,
};

// Utility to normalize current page name
function _getCurrentPage(url) {
  if (url.endsWith("/")) url = url.slice(0, -1);
  let last = url.split("/").pop();
  if (last.includes("?")) last = last.split("?")[0];
  const match = Object.keys(pages).find(
    (page) => page.toLowerCase() === last.toLowerCase()
  );
  return match || Object.keys(pages)[0];
}

// Component rendered inside <Router>
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        {/* redirect /climbgear → /climb-gear (legacy support) */}
        <Route path="/climbgear" element={<Navigate to="/climb-gear" replace />} />

        {/* core routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/climb-gear" element={<ClimbGear />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/climbs" element={<Climbs />} />
        <Route path="/database" element={<Database />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/ai-playground" element={<AiPlayground />} />
        <Route path="/summit-assistant" element={<SummitAssistant />} />

        {/* catch-all → dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
