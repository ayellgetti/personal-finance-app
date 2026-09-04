import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
