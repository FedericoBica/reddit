import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://redprowl.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${APP_URL}/en`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${APP_URL}/en`,
          es: `${APP_URL}/es`,
          pt: `${APP_URL}/pt`,
        },
      },
    },
    {
      url: `${APP_URL}/es`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${APP_URL}/en`,
          es: `${APP_URL}/es`,
          pt: `${APP_URL}/pt`,
        },
      },
    },
    {
      url: `${APP_URL}/pt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${APP_URL}/en`,
          es: `${APP_URL}/es`,
          pt: `${APP_URL}/pt`,
        },
      },
    },
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${APP_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
