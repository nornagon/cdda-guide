import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    svelte(),
    VitePWA({
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.png", "global.css"],
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
        ],
        // Without this, a stale service worker can be alive for a long time,
        // and get out of date with the server.
        skipWaiting: true,
      },
    }),
  ],
});
