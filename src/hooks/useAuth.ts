import * as React from "react";

export type AuthUser = {
  id: string | null;
  name: string | null;
  email: string | null;
  image?: string | null;
  roles?: string[];
};

type State =
  | { status: "idle"; user: null }
  | { status: "loading"; user: null }
  | { status: "authed"; user: AuthUser }
  | { status: "anon"; user: null };

export function useAuth() {
  const [state, setState] = React.useState<State>({ status: "idle", user: null });

  const refresh = React.useCallback(async () => {
    setState({ status: "loading", user: null });
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (!r.ok) throw new Error("unauthorized");
      const data = await r.json();
      setState({ status: "authed", user: data.user as AuthUser });
    } catch {
      setState({ status: "anon", user: null });
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } finally {
      // simple: reload to clear client state / caches
      window.location.href = "/";
    }
  }, []);

  React.useEffect(() => {
    // fetch once on mount
    refresh();
  }, [refresh]);

  return { ...state, refresh, signOut };
}
