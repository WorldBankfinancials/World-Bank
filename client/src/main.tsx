import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupErrorFiltering } from "./lib/globalErrorSuppression";

// Setup error filtering to suppress noise
setupErrorFiltering();

// Global error handling to suppress noise and log properly
const isViteWarning = (reason: any) => {
  const msg = reason?.message || reason?.toString() || '';
  const stack = reason?.stack || '';
  return msg.includes('did not match the expected pattern') ||
         msg.includes('HTTP Error') ||
         stack.includes('@vite/client') ||
         msg.includes('WebSocket') ||
         msg.includes('fetch') && msg.includes('abort') ||
         msg.includes('AuthRetryableFetchError') ||
         msg.includes('Encountered two children with the same key');
};

const originalError = console.error;
console.error = function(...args: any[]) {
  const msg = args[0]?.toString() || '';
  if (msg.includes('Encountered two children with the same key')) {
    return;
  }
  originalError.apply(console, args);
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
