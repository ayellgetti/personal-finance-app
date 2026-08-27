import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const allowedHosts = (process.env.VITE_DEV_ALLOWED_HOSTS ?? "website.local.uat,web.local.uat")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  server: {
    host: "::",
    port: 8081,
    allowedHosts,
    watch: process.env.VITE_DEV_POLLING ? { usePolling: true, interval: 300 } : undefined,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
});
