// src/hooks/useScrollRestoration.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollRestoration(containerRef) {
  const location = useLocation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const key = `scroll:${location.pathname}`;

    // Restore on mount
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const y = Number(saved);
      if (!Number.isNaN(y)) {
        el.scrollTop = y;
      }
    }

    const handleScroll = () => {
      sessionStorage.setItem(key, String(el.scrollTop));
    };

    el.addEventListener("scroll", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, location.pathname]);
}
