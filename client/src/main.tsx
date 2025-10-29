import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket warnings in development
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('did not match the expected pattern') ||
      event.reason?.stack?.includes('@vite/client')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
