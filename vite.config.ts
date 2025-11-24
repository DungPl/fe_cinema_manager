import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { reactRouter } from "@react-router/dev/vite";
import path from "path";

export default defineConfig({
  plugins: [
    reactRouter(),           // ← thay thế hoàn toàn vite-plugin-pages
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],

  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
    },
  },

  server: {
    proxy: {
      "^/api": {
        target: "http://localhost:8002",
        changeOrigin: true,
      },
    },
  },
});