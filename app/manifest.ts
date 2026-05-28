import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Camvelle Creative",
    short_name: "Camvelle",
    description: "Premium cinematic photography by Camvelle Creative.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050403",
    theme_color: "#050403",
    icons: [
      {
        src: "/branding/camvelle-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/camvelle-submark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
