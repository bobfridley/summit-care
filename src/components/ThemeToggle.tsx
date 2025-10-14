import React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

function getSystemPrefersDark(): boolean {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const useDark = theme === "dark" || (theme === "system" && getSystemPrefersDark());
  root.classList.toggle("dark", useDark);
}

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored ?? "system";
  });

  // Apply on mount + when theme changes
  React.useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  // Respond to system changes when in "system" mode
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    try {
      mql.addEventListener("change", handler);
    } catch {
      // Safari <14
      // @ts-ignore
      mql.addListener(handler);
    }
    return () => {
      try {
        mql.removeEventListener("change", handler);
      } catch {
        // @ts-ignore
        mql.removeListener(handler);
      }
    };
  }, [theme]);

  // Cycle: light → dark → system → light …
  function cycle() {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }

  const isDark =
    theme === "dark" || (theme === "system" && typeof window !== "undefined" && getSystemPrefersDark());

  const label =
    theme === "system"
      ? "Theme: System"
      : theme === "dark"
      ? "Theme: Dark"
      : "Theme: Light";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-pressed={isDark}
        onClick={cycle}
        title={`${label} (click to change)`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
      >
        {/* Crossfade icons for a nice touch */}
        <Sun className={`h-5 w-5 transition-opacity ${isDark ? "opacity-0" : "opacity-100"}`} />
        <Moon className={`-ml-5 h-5 w-5 transition-opacity ${isDark ? "opacity-100" : "opacity-0"}`} />
      </button>

      {/* Small helper text; remove if you want it purely icon-based */}
      <span className="sr-only">{label}</span>
    </div>
  );
}
