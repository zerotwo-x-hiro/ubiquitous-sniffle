import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      // In dev, proxy our /api/tvmaze path straight to TVMaze (the Vercel
      // serverless function isn't running locally). In production /api/tvmaze
      // is handled by api/tvmaze/[...path].js at the edge.
      "/api/tvmaze": {
        target: "https://api.tvmaze.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/tvmaze/, ""),
      },
    },
  },
  preview: { host: "0.0.0.0", port: 4173, allowedHosts: true },
});
