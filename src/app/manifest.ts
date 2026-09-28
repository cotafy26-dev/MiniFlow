import type { MetadataRoute } from "next";

import { pt } from "@/lib/i18n/dictionaries/pt";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: pt.app.name,
    short_name: pt.app.name,
    description: pt.app.tagline,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4338ca",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
