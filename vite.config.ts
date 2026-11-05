import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the build run from any folder (GitHub Pages project sites, file servers, etc.)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020", assetsInlineLimit: 0 },
});
