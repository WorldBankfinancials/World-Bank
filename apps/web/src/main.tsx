import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupGlobalErrorSuppression } from "./lib/globalErrorSuppression";

// Setup error filtering to suppress noise
setupGlobalErrorSuppression();

// Global error handling to suppress noise and log properly
const isViteWarning = (reason: unknown) => {
  const r = reason as { message?: string; stack?: string } | null;
  const msg = r?.message || (reason as { toString?: () => string })?.toString?.() || '';
  const stack = r?.stack || '';
  return msg.includes('did not match the expected pattern') ||
         msg.includes('HTTP Error') ||
         stack.includes('@vite/client') ||
         msg.includes('WebSocket') ||
         msg.includes('fetch') && msg.includes('abort') ||
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
