import React from "react";
import { createRoot } from "react-dom/client";
import "../App.jsx"; // If App.jsx registers routes/components globally, keep; otherwise adjust below
import App from "../App.jsx"; // If App has a default export
import "./index.css";

const root = document.getElementById("root");
createRoot(root).render(<App />);
