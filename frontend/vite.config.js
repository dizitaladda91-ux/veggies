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
  esbuild: {
    drop: ["console", "debugger"],
    legalComments: "none",
  },
  build: {
    target: "es2022",
    cssTarget: "chrome90",
    minify: "esbuild",
    cssMinify: "esbuild",
    modulePreload: {
      polyfill: false,
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            if (id.includes("axios")) {
              return "vendor-axios";
            }
            return "vendor-deps";
          }
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
