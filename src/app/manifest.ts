import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SylvaPoint — GTM Audit Tool",
    short_name: "SylvaPoint",
    description:
      "Grade your Go-To-Market strategy in 60 seconds. Free automated GTM audit across 6 dimensions.",
    start_url: "/",
    display: "standalone",
    theme_color: "#0A1F1C",
    background_color: "#0A1F1C",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
