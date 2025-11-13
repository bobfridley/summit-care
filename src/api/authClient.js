// src/api/authClient.js
// Simple local auth stub — replace with real backend auth later

const IS_DEV = import.meta?.env?.VITE_DISABLE_AUTH === "1";

const DEV_USER = {
  id: "local-dev",
  name: "Developer",
  role: "admin", // change to "user" to hide admin-only features
};

export const authClient = {
  async getUser() {
    if (IS_DEV) return DEV_USER;
    throw new Error("Auth service not configured. Enable VITE_DISABLE_AUTH=1 for local dev.");
  },
};

export const isAuthDisabled = () => IS_DEV;
