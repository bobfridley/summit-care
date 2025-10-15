import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu as MenuIcon,
  X as CloseIcon,
  Mountain,
  Activity,
  Database as DatabaseIcon,
  FileBarChart,
  Pill,
  Map,
  Bot,
  PackageOpen,
  HelpCircle,
  Code,
  Info,
  ShieldAlert,
} from "lucide-react";
import { COLORS } from "@shared/constants";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";

/** Define your routes once (label, path, icon, and a lazy-import for preloading) */
const NAV_ITEMS = [
  { label: "Dashboard",     path: "/dashboard",     icon: Mountain,     preload: () => import("@/pages/Dashboard") },
  { label: "Medications",   path: "/medications",   icon: Pill,         preload: () => import("@/pages/Medications") },
  { label: "Database",      path: "/database",      icon: DatabaseIcon, preload: () => import("@/pages/Database") },
  { label: "Reports",       path: "/reports",       icon: FileBarChart, preload: () => import("@/pages/Reports") },
  { label: "Climbs",        path: "/climbs",        icon: Activity,     preload: () => import("@/pages/Climbs") },
  { label: "AI Playground", path: "/aiplayground",  icon: Bot,          preload: () => import("@/pages/AIPlayground") },
  { label: "Brand Assets",  path: "/brandassets",   icon: PackageOpen,  preload: () => import("@/pages/BrandAssets") },
  { label: "Climb Gear",    path: "/climbgear",     icon: Map,          preload: () => import("@/pages/ClimbGear") },
  { label: "DB Access Help",path: "/dbaccesshelp",  icon: HelpCircle,   preload: () => import("@/pages/DBAccessHelp") },
  { label: "MySQL Schema",  path: "/mysqlschema",   icon: Code,         preload: () => import("@/pages/MySQLSchema") },
  { label: "Sample Data",   path: "/mysqlsampledata", icon: Code,       preload: () => import("@/pages/MySQLSampleData") },
  { label: "Disclaimer",    path: "/disclaimer",    icon: ShieldAlert,  preload: () => import("@/pages/Disclaimer") },
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-700 ${className}`} />;
}
function SkeletonCircle({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-stone-200 dark:bg-stone-700 ${className}`} />;
}

// Helper: role check
function hasAdminRole(roles?: string[] | null) {
  const r = (roles ?? []).map(x => String(x).toLowerCase());
  return r.includes("admin") || r.includes("superadmin") || r.includes("owner");
}

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function ActiveLink({
  to,
  label,
  Icon,
  onPreload,
  onNavigate,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onPreload: () => void;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onMouseEnter={onPreload}
      onFocus={onPreload}
      onClick={onNavigate}
      className={({ isActive }) =>
        classNames(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-stone-100 text-stone-900 dark:bg-stone-800/70 dark:text-white"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800/50 dark:hover:text-stone-50"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Navigation() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const { user, status, signOut } = useAuth();
  const isAdmin = hasAdminRole(user?.roles);

  // Close mobile drawer on route change
  React.useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <>
      {/* Top Bar */}
      <header
        className="sticky top-0 z-40 border-b border-stone-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-stone-800 dark:bg-stone-950/70"
        style={{ "--brand": COLORS.brandGreen } as React.CSSProperties}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Brand + Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              className="mr-1 rounded-lg p-2 text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 md:hidden dark:text-stone-300 dark:hover:bg-stone-800"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-controls="mobile-drawer"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>

            <NavLink to="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6" style={{ color: COLORS.brandGreen }} />
              <span className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                SummitCare
              </span>
              {status === "loading" || status === "idle" ? (
                <Skeleton className="ml-2 h-4 w-10 rounded-md" />
              ) : isAdmin ? (
                <span className="ml-2 rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  Admin
                </span>
              ) : null}
            </NavLink>

          </div>

          {/* Right: Desktop Nav + Theme + User */}
          <div className="flex items-center gap-2">
            {/* Desktop nav is static; show it regardless so layout is stable */}
            <nav className="hidden md:flex md:flex-wrap md:items-center md:gap-1">
              {NAV_ITEMS.map((item) => (
                <ActiveLink
                  key={item.path}
                  to={item.path}
                  label={item.label}
                  Icon={item.icon}
                  onPreload={item.preload}
                />
              ))}
              {isAdmin && (
                <ActiveLink
                  to="/admin"
                  label="Admin"
                  Icon={ShieldAlert}
                  onPreload={() => import("@/pages/Admin")}
                />
              )}
            </nav>

            {/* Right side: Theme + User (skeleton while auth loads) */}
            {status === "loading" || status === "idle" ? (
              <div className="flex items-center gap-2">
                {/* ThemeToggle placeholder */}
                <SkeletonCircle className="h-9 w-9" />
                {/* Avatar/UserMenu placeholder (same footprint) */}
                <SkeletonCircle className="h-9 w-9" />
              </div>
            ) : (
              <>
                <ThemeToggle />
                <UserMenu />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer & Overlay */}
      <div
        id="mobile-drawer"
        className={classNames(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Overlay */}
        <div
          className={classNames(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <aside
          className={classNames(
            // panel base
            "absolute left-0 top-0 h-full w-72 transform shadow-xl transition-transform",
            // light bg gradient + dark bg gradient
            "bg-gradient-to-b from-white via-stone-50 to-stone-100",
            "dark:from-stone-950 dark:via-stone-900 dark:to-stone-900",
            // border edge for dark
            "border-r border-stone-200 dark:border-stone-800",
            // slide state
            open ? "translate-x-0" : "-translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Header area with brand */}
          <div className="flex items-center justify-between border-b border-stone-200/70 px-4 py-3 dark:border-stone-800/80">
            <div className="flex items-center gap-2">
              <Mountain className="h-5 w-5" style={{ color: COLORS.brandGreen }} />
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">SummitCare</span>
              {isAdmin && (
                <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                  Admin
                </span>
              )}
            </div>
            <button
              className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:text-stone-300 dark:hover:bg-stone-800"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* 👤 Mobile User Section */}
          {(status === "loading" || status === "idle") && (
            <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
              <SkeletonCircle className="h-9 w-9" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          )}
          {status === "authed" && user && (
            <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? "User"}
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700">
                  {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="max-w-[8rem] truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="text-xs text-stone-500 hover:underline"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => (
              <ActiveLink
                key={item.path}
                to={item.path}
                label={item.label}
                Icon={item.icon}
                onPreload={item.preload}
                onNavigate={() => setOpen(false)}
              />
            ))}
            {isAdmin && (
              <ActiveLink
                to="/admin"
                label="Admin"
                Icon={ShieldAlert}
                onPreload={() => import("@/pages/Admin")}
                onNavigate={() => setOpen(false)}
              />
            )}
          </nav>

          {/* Footer */}
          <div className="mt-auto border-t border-stone-200 p-3 text-xs text-stone-500 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              <span>© {new Date().getFullYear()} SummitCare</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
