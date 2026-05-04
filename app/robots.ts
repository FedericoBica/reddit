import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://redprowl.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/en", "/es", "/pt", "/about", "/login", "/privacy", "/terms", "/founder"],
        disallow: [
          "/dashboard",
          "/feed",
          "/admin",
          "/api/",
          "/settings",
          "/leads/",
          "/pipeline",
          "/analytics",
          "/calendar",
          "/content-lab",
          "/threads",
          "/mentions",
          "/bootstrap",
          "/onboarding",
          "/projects/",
          "/archive/",
          "/signup/",
          "/x/",
          "/outbound/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
