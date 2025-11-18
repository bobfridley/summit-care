import * as React from "react";
import ReactDOM from "react-dom/client";
import Pages from "@/pages";
import "@/index.css";
import { AuthProvider } from "@/context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Pages />
    </AuthProvider>
  </React.StrictMode>
);
