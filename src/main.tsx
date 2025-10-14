import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";

import "./App.css";
import "./index.css";

// ⚡ Code-split: Disclaimer is loaded only when the route is visited
const Disclaimer = lazy(() => import("@/pages/Disclaimer"));

function Fallback() {
  return (
    <div className="p-6 text-sm text-gray-500">
      Loading…
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap routes that include lazy elements in Suspense */}
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
