import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Setup error filtering to suppress noise

// Global error handling to suppress noise and log properly
const isViteWarning = (reason: any) => {
  const msg = reason?.message || reason?.toString() || '';
  const stack = reason?.stack || '';
  return msg.includes('did not match the expected pattern') ||
         msg.includes('HTTP Error') ||
         stack.includes('@vite/client') ||
         msg.includes('AuthRetryableFetchError');
};

window.addEventListener('unhandledrejection', (event) => {
  if (isViteWarning(event.reason)) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (isViteWarning(event.error)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
