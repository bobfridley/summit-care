import React from "react";
import Pages from "./pages";
import Navigation from "@/components/Navigation";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      {/* 🌄 Global Navigation Bar */}
      <Navigation />

      {/* 🧭 Routed content */}
      <main className="min-h-screen">
        <Pages />
      </main>

      {/* 🔔 Global toast notifications */}
      <Toaster />
    </>
  );
}

export default App;
