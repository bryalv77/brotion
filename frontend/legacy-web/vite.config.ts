import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT) || 5173,
    proxy: {
      // Forward all API calls to the backend so the browser sees same-origin.
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
