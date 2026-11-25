import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// No GitHub Pages o jogo fica em /NEWBRAS/; localmente, na raiz.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  // O banco mundial é montado num Web Worker em módulo (ver src/editor/banco.worker.ts).
  worker: { format: "es" },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "NewBras",
        short_name: "NewBras",
        description: "Manager de futebol com simulação em campo e editor de times.",
        lang: "pt-BR",
        theme_color: "#1D2B3A",
        background_color: "#2E6B3A",
        display: "standalone",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
