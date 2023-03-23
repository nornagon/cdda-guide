import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import EnvironmentPlugin from "vite-plugin-environment";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/cdda-guide/",
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    EnvironmentPlugin({
      GITHUB_SHA: null,
    }),
    svelte(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.png"],
      manifest: {
        short_name: "Cataclysm Guide",
        name: "The Hitchhiker's Guide to the Cataclysm",
        icons: [
          {
            src: "icon-192.png",
            type: "image/png",
            sizes: "192x192",
          },
          {
            src: "icon-512.png",
            type: "image/png",
            sizes: "512x512",
          },
        ],
        start_url: "./",
        theme_color: "#202020",
        background_color: "#1c1c1c",
        display: "standalone",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // latest/all.json updates regularly, so try the network first.
            urlPattern:
              /^https:\/\/raw\.githubusercontent\.com\/.*\/latest\/all\.json$/,
            handler: "NetworkFirst",
          },
          {
            // the other all.json files are the same forever, so if we have
            // them from the cache they are fine.
            urlPattern:
              /^https:\/\/raw\.githubusercontent\.com\/.*\/all\.json$/,
            handler: "CacheFirst",
          },
          {
            // Use saved translations if possible, update in the background.
            urlPattern: /^https:\/\/cds.svc.transifex.net\//,
            handler: "StaleWhileRevalidate",
          },
        ],
        // Without this, a stale service worker can be alive for a long time,
        // and get out of date with the server.
        skipWaiting: true,
      },
    }),
  ],
});
