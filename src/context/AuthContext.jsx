/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/api/authClient";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // <-- keep local state name

  useEffect(() => {
    (async () => {
      try {
        const u = await authClient.getUser();
        setUser(u);
      } catch {
        // dev stub may throw when VITE_DISABLE_AUTH != 1 — that's fine
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // expose 'loading' key to consumers
  const value = { user, loading: isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
