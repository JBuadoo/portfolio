import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/" ensures all asset URLs resolve from site root cleanly on Vercel and production hosts
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: { target: "es2020", assetsInlineLimit: 0 },
});
