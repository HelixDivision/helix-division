import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getCategories, getAllProductSlugPairs } from "@/lib/catalog";
import { getAllPublishedArticleSlugs } from "@/server/services/articles";
import { listPublishedNewsletters } from "@/server/services/newsletters";

/**
 * Dynamic sitemap (Prototype Launch). Static marketing/shop routes plus every
 * live catalog + published-content URL. Excludes account/admin/checkout/cart
 * (also blocked in robots.ts) since those aren't indexable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");

  const staticPaths = [
    "",
    "/shop",
    "/about",
    "/quality",
    "/contact",
    "/research",
    "/newsletter",
    "/faq",
    "/legal/terms",
    "/legal/privacy",
    "/legal/shipping",
    "/legal/research-disclaimer",
  ];

  const [categories, productPairs, articleSlugs, newsletters] = await Promise.all([
    getCategories().catch(() => []),
    getAllProductSlugPairs().catch(() => []),
    getAllPublishedArticleSlugs().catch(() => []),
    listPublishedNewsletters().catch(() => []),
  ]);

  const now = new Date();
  const entry = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  });

  return [
    entry("", 1),
    ...staticPaths.slice(1).map((p) => entry(p, p === "/shop" ? 0.9 : 0.5)),
    ...categories.map((c) => entry(`/shop/${c.slug}`, 0.7)),
    ...productPairs.map((p) => entry(`/shop/${p.categorySlug}/${p.slug}`, 0.8)),
    ...articleSlugs.map((slug) => entry(`/research/${slug}`, 0.6)),
    ...newsletters.map((n) => entry(`/newsletter/${n.slug}`, 0.4)),
  ];
}
