import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

const allowedHosts = (process.env.VITE_DEV_ALLOWED_HOSTS ?? "crm.local.uat")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  server: {
    host: "::",
    port: 8082,
    allowedHosts,
    hmr: {
      overlay: false,
    },
    watch: process.env.VITE_DEV_POLLING ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://127.0.0.1:5001",
        changeOrigin: true,
        timeout: 120_000,
        proxyTimeout: 120_000,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Sales CRM",
        short_name: "Sales CRM",
        description: "Internal sales CRM for contacts, pipeline, follow-ups, and collections.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1c9b6a",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        globIgnores: ["**/env.js"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/env\.js$/],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
