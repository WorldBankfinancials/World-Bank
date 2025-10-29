import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Only suppress specific Vite HMR WebSocket connection warnings in development
// These are expected in Replit's environment and don't affect functionality
if (import.meta.hot) {
  window.addEventListener('unhandledrejection', (event) => {
    // Only suppress the specific WebSocket pattern validation error from Vite HMR
    const isViteHMRError = event.reason?.message?.includes('did not match the expected pattern') &&
                           event.reason?.stack?.includes('setupWebSocket@') &&
                           event.reason?.stack?.includes('@vite/client');
    
    if (isViteHMRError) {
      // Silently handle this known development environment issue
      event.preventDefault();
      return;
    }
    // All other unhandled rejections will surface normally
  });
}

createRoot(document.getElementById("root")!).render(<App />);
