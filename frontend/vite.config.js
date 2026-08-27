import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "async-css-links",
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*)>/g,
          (match, attrs) => `\n    <link rel="preload" as="style"${attrs} onload="this.onload=null;this.rel='stylesheet'">\n    <noscript>${match}</noscript>`
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2022",
    cssTarget: "chrome90",
    minify: 'esbuild',
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 4173,
  },
});
