import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Expense Tracker PWA",
    short_name: "Expenses",
    description: "Responsive, mobile-first Personal Expense & Budget Tracker with Normal vs One-Time analytics",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090d16",
    theme_color: "#090d16",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["finance", "productivity", "utilities"],
  };
}
