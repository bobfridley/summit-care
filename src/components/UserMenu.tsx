import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/* helpers */
function hasAdminRole(roles?: string[] | null) {
  const r = (roles ?? []).map(x => String(x).toLowerCase());
  return r.includes("admin") || r.includes("superadmin") || r.includes("owner");
}
function initials(name?: string | null, email?: string | null) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
}
function RouterLinkMenuItem({
  to, children, onClick,
}: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <RouterLink
      to={to}
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
      role="menuitem"
    >
      {children}
    </RouterLink>
  );
}

export default function UserMenu() {
  const { status, user, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const isAdmin = hasAdminRole(user?.roles);
  const displayName = user?.name || user?.email || "User";
  const avatarText = initials(user?.name, user?.email);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "idle" || status === "loading") {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />;
  }

  if (status === "anon") {
    return (
      <RouterLink
        to="/login"
        className="rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/60"
      >
        Sign in
      </RouterLink>
    );
  }

  return (
    <div className="relative ml-2" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user?.image ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={user.image} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <span>{avatarText}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-stone-700 dark:bg-stone-900"
        >
          <div className="px-3 py-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="font-medium text-stone-900 dark:text-stone-100">{displayName}</div>
              {isAdmin && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                  Admin
                </span>
              )}
            </div>
            {user?.email && (
              <div className="truncate text-stone-500 dark:text-stone-400">{user.email}</div>
            )}
          </div>

          {isAdmin && (
            <>
              <div className="border-t border-stone-200 px-3 py-2 text-xs font-medium text-stone-500 dark:border-stone-700">
                Admin
              </div>
              <div className="px-1">
                <RouterLinkMenuItem to="/admin" onClick={() => setOpen(false)}>
                  Admin Console
                </RouterLinkMenuItem>
              </div>
            </>
          )}

          <div className="border-t border-stone-200 dark:border-stone-700" />
          <button
            onClick={signOut}
            className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
