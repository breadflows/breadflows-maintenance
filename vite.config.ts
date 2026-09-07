import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: "pages-app",
  publicDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL("./pages-app/src", import.meta.url)) } },
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: "../.pages-build", emptyOutDir: true },
});
