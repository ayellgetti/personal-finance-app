// vite.config.ts
import { defineConfig } from "file:///app/node_modules/.pnpm/vite@5.4.21_@types+node@22.20.1_terser@5.51.2/node_modules/vite/dist/node/index.js";
import react from "file:///app/node_modules/.pnpm/@vitejs+plugin-react-swc@3.11.0_vite@5.4.21_@types+node@22.20.1_terser@5.51.2_/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { VitePWA } from "file:///app/node_modules/.pnpm/vite-plugin-pwa@1.3.0_vite@5.4.21_@types+node@22.20.1_terser@5.51.2__workbox-build@7.4.1_workbox-window@7.4.1/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "/app/apps/crm";
var allowedHosts = (process.env.VITE_DEV_ALLOWED_HOSTS ?? "crm.local.uat").split(",").map((host) => host.trim()).filter(Boolean);
var vite_config_default = defineConfig({
  server: {
    host: "::",
    port: 8082,
    allowedHosts,
    hmr: {
      overlay: false
    },
    watch: process.env.VITE_DEV_POLLING ? { usePolling: true, interval: 300 } : void 0,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY ?? "http://127.0.0.1:5001",
        changeOrigin: true,
        timeout: 12e4,
        proxyTimeout: 12e4
      }
    }
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
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        globIgnores: ["**/env.js"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/env\.js$/]
      },
      devOptions: { enabled: false }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2FwcHMvY3JtXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2FwcHMvY3JtL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvYXBwcy9jcm0vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuXG5jb25zdCBhbGxvd2VkSG9zdHMgPSAocHJvY2Vzcy5lbnYuVklURV9ERVZfQUxMT1dFRF9IT1NUUyA/PyBcImNybS5sb2NhbC51YXRcIilcbiAgLnNwbGl0KFwiLFwiKVxuICAubWFwKChob3N0KSA9PiBob3N0LnRyaW0oKSlcbiAgLmZpbHRlcihCb29sZWFuKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCI6OlwiLFxuICAgIHBvcnQ6IDgwODIsXG4gICAgYWxsb3dlZEhvc3RzLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgICB3YXRjaDogcHJvY2Vzcy5lbnYuVklURV9ERVZfUE9MTElORyA/IHsgdXNlUG9sbGluZzogdHJ1ZSwgaW50ZXJ2YWw6IDMwMCB9IDogdW5kZWZpbmVkLFxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjoge1xuICAgICAgICB0YXJnZXQ6IHByb2Nlc3MuZW52LlZJVEVfQVBJX1BST1hZID8/IFwiaHR0cDovLzEyNy4wLjAuMTo1MDAxXCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgdGltZW91dDogMTIwXzAwMCxcbiAgICAgICAgcHJveHlUaW1lb3V0OiAxMjBfMDAwLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogXCJhdXRvVXBkYXRlXCIsXG4gICAgICBpbmplY3RSZWdpc3RlcjogZmFsc2UsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXCJmYXZpY29uLnN2Z1wiLCBcImFwcGxlLXRvdWNoLWljb24ucG5nXCIsIFwicHdhLTE5Mi5wbmdcIiwgXCJwd2EtNTEyLnBuZ1wiXSxcbiAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgIG5hbWU6IFwiU2FsZXMgQ1JNXCIsXG4gICAgICAgIHNob3J0X25hbWU6IFwiU2FsZXMgQ1JNXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIkludGVybmFsIHNhbGVzIENSTSBmb3IgY29udGFjdHMsIHBpcGVsaW5lLCBmb2xsb3ctdXBzLCBhbmQgY29sbGVjdGlvbnMuXCIsXG4gICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXG4gICAgICAgIHNjb3BlOiBcIi9cIixcbiAgICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMWM5YjZhXCIsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAgeyBzcmM6IFwicHdhLTE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiIH0sXG4gICAgICAgICAgeyBzcmM6IFwicHdhLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiIH0sXG4gICAgICAgICAgeyBzcmM6IFwicHdhLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBwdXJwb3NlOiBcIm1hc2thYmxlXCIgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd29mZjIsd2VibWFuaWZlc3R9XCJdLFxuICAgICAgICBnbG9iSWdub3JlczogW1wiKiovZW52LmpzXCJdLFxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrOiBcImluZGV4Lmh0bWxcIixcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGkoPzpcXC98JCkvLCAvXlxcL2VudlxcLmpzJC9dLFxuICAgICAgfSxcbiAgICAgIGRldk9wdGlvbnM6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC9qc3gtcnVudGltZVwiLCBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLGdCQUFnQixRQUFRLElBQUksMEJBQTBCLGlCQUN6RCxNQUFNLEdBQUcsRUFDVCxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQyxFQUN6QixPQUFPLE9BQU87QUFFakIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ047QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxPQUFPLFFBQVEsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLE1BQU0sVUFBVSxJQUFJLElBQUk7QUFBQSxJQUM1RSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLFFBQVEsSUFBSSxrQkFBa0I7QUFBQSxRQUN0QyxjQUFjO0FBQUEsUUFDZCxTQUFTO0FBQUEsUUFDVCxjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsTUFDaEIsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGVBQWUsYUFBYTtBQUFBLE1BQ25GLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLFNBQVM7QUFBQSxRQUNULGtCQUFrQjtBQUFBLFFBQ2xCLGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMLEVBQUUsS0FBSyxlQUFlLE9BQU8sV0FBVyxNQUFNLFlBQVk7QUFBQSxVQUMxRCxFQUFFLEtBQUssZUFBZSxPQUFPLFdBQVcsTUFBTSxZQUFZO0FBQUEsVUFDMUQsRUFBRSxLQUFLLGVBQWUsT0FBTyxXQUFXLE1BQU0sYUFBYSxTQUFTLFdBQVc7QUFBQSxRQUNqRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGNBQWMsQ0FBQyxrREFBa0Q7QUFBQSxRQUNqRSxhQUFhLENBQUMsV0FBVztBQUFBLFFBQ3pCLGtCQUFrQjtBQUFBLFFBQ2xCLDBCQUEwQixDQUFDLGtCQUFrQixhQUFhO0FBQUEsTUFDNUQ7QUFBQSxNQUNBLFlBQVksRUFBRSxTQUFTLE1BQU07QUFBQSxJQUMvQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsSUFDQSxRQUFRLENBQUMsU0FBUyxhQUFhLHFCQUFxQix1QkFBdUI7QUFBQSxFQUM3RTtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
