import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/thesis-phase-one-animation/", // ⚠️ must match your repo name
});
