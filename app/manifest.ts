// app/manifest.ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gym Tracker",
    short_name: "GymTracker",
    description: "Persoonlijke workout en voortgang tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#baa3d0",
    theme_color: "#baa3d0",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}