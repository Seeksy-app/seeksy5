import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA temporarily disabled to fix service worker lifecycle issues
    // VitePWA({
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.png", "favicon-180.png", "favicon-512.png"],
    //   manifest: {
    //     name: "Seeksy - Connect, Schedule & Engage",
    //     short_name: "Seeksy",
    //     description: "The all-in-one platform for creators and communities",
    //     theme_color: "#0a1929",
    //     background_color: "#0a1929",
    //     display: "standalone",
    //     orientation: "portrait",
    //     start_url: "/",
    //     icons: [
    //       {
    //         src: "/favicon.png",
    //         sizes: "32x32",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/favicon-180.png",
    //         sizes: "180x180",
    //         type: "image/png",
    //         purpose: "apple touch icon",
    //       },
    //       {
    //         src: "/favicon-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any maskable",
    //       },
    //     ],
    //   },
    //   workbox: {
    //     maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
    //     globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "google-fonts-cache",
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365,
    //           },
    //         },
    //       },
    //     ],
    //   },
    // }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Consolidate all supabase imports to the canonical typed client
      "@/lib/supabase": path.resolve(__dirname, "./src/integrations/supabase/client.ts"),
      "@/lib/supabaseClient": path.resolve(__dirname, "./src/integrations/supabase/client.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
