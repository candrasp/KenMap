import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      // aktifkan service worker saat `npm run dev` juga (opsional, enak buat testing)
      devOptions: {
        enabled: false,
      },
      includeAssets: ["icons/favicon.ico"],
      manifest: {
        name: "KenMap",
        short_name: "KenMap",
        description: "Aplikasi manajemen jaringan fiber optik (FTTH) Kabupaten Ponorogo",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // penting: file GeoJSON & tile peta offline kamu bisa besar,
        // naikkan limit supaya tidak gagal di-precache
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // cache tile peta satelit Esri agar tersedia offline
            urlPattern: ({ url }) => url.hostname.includes("arcgisonline.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "esri-tiles-cache",
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // JANGAN cache endpoint auth (login/logout) — selalu network only
            urlPattern: ({ url }) => url.pathname.startsWith("/api/auth"),
            handler: "NetworkOnly",
          },
          {
            // cache API call lain ke backend Express (data ODC/ODP/klien)
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Saat dev: teruskan semua /api/* ke Express di port 3000
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },

  // Output build ke dist/
  build: {
    outDir: "dist",
  },
});
