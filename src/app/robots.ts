import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/** robots.txt (Prototype Launch) — index public pages, keep private/checkout areas out, point at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/cart", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
