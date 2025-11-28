/// <reference types="vite/client" />
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import path from "path";
import { defineConfig } from "vite";
async function loadCartographer() {
    if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
        const m = await import("@replit/vite-plugin-cartographer");
        return m.cartographer();
    }
    return null;
}
export default defineConfig(async () => {
    const cartographer = await loadCartographer();
    return {
        root: path.resolve(__dirname, "client"),
        plugins: [react(), runtimeErrorOverlay(), ...(cartographer ? [cartographer] : [])],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "client", "src"),
                "@shared": path.resolve(__dirname, "shared"),
                "@assets": path.resolve(__dirname, "attached_assets"),
            },
        },
        optimizeDeps: {
            exclude: [
                "@radix-ui/react-accordion",
                "@radix-ui/react-alert-dialog",
                "@radix-ui/react-dialog",
                "@radix-ui/react-dropdown-menu",
                "@radix-ui/react-popover",
                "@radix-ui/react-select",
                "@radix-ui/react-tooltip",
                "@radix-ui/react-toast",
            ],
            include: ["react", "react-dom"],
        },
        build: {
            outDir: path.resolve(__dirname, "dist/public"),
            emptyOutDir: true,
            rollupOptions: {
                output: {
                    manualChunks: {
                        "react-vendor": ["react", "react-dom"],
                        "ui-vendor": ["@radix-ui/react-slot", "class-variance-authority"],
                    },
                },
            },
        },
        server: {
            host: "0.0.0.0",
            port: 5173,
            strictPort: false,
            hmr: {
                protocol: "wss",
                host: process.env.REPL_SLUG
                    ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
                    : "localhost",
                clientPort: 443,
            },
            fs: {
                strict: false,
            },
        },
    };
});
