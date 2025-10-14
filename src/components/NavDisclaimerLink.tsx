// src/components/NavDisclaimerLink.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function NavDisclaimerLink() {
  const preload = () => {
    // kick off the dynamic import early (same path as in main.tsx)
    import("@/pages/Disclaimer");
  };

  return (
    <Link
      to="/disclaimer"
      onMouseEnter={preload}
      className="text-sm text-gray-600 hover:underline"
    >
      Disclaimer
    </Link>
  );
}
