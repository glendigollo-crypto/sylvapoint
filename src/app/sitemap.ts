import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.sylvapoint.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/audit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/book`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const blogPosts: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog/what-is-gtm-readiness`,
      lastModified: "2025-06-01",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog/gtm-audit-how-to-score`,
      lastModified: "2025-06-05",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog/website-grader-vs-gtm-audit`,
      lastModified: "2025-06-10",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog/6-dimensions-gtm-readiness`,
      lastModified: "2025-06-15",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog/how-to-improve-gtm-score`,
      lastModified: "2025-06-20",
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticRoutes, ...blogPosts];
}
