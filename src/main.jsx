import React from "react";
import { createRoot } from "react-dom/client";
import App from "../App.jsx";     // App.jsx is at repo root; this relative path is correct
import "./index.css";

createRoot(document.getElementById("root")).render(<App />);
