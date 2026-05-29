import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import compression from "vite-plugin-compression";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    compression({ algorithm: "gzip", ext: ".gz" }),
    compression({ algorithm: "brotliCompress", ext: ".br" }),
  ],
  build: {
    cssCodeSplit: false,
    minify: true,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        entryFileNames: "widget.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
