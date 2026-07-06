import type { Metadata } from "next";

import { FadeIn } from "@/components/motion/FadeIn";
import { Pagination } from "@/components/shop/Pagination";
import { ProductCardLink } from "@/components/shop/ProductCardLink";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopResults } from "@/components/shop/ShopResults";
import {
  getCategories,
  getFeaturedProducts,
  getProducts,
  type ProductSort,
} from "@/server/services/catalog";

export const metadata: Metadata = {
  title: "Shop | Helix Division",
  description: "Lab-verified research peptides, SARMs, laboratory supplies, and accessories.",
};

interface ShopPageProps {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const categories = getCategories();
  const featured = getFeaturedProducts();
  const result = getProducts({
    q: params.q,
    sort: (params.sort as ProductSort) || "featured",
    page,
  });

  function buildHref(targetPage: number) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.sort) search.set("sort", params.sort);
    if (targetPage > 1) search.set("page", String(targetPage));
    const qs = search.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <FadeIn>
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          Shop
        </h1>
        <p className="text-foreground-muted mt-2 max-w-xl text-sm">
          Precision-engineered research compounds, backed by science.
        </p>
      </FadeIn>

      {featured.length > 0 && !params.q && (
        <section className="mt-10">
          <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
            Featured
            <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
          </p>
          <div className="mt-6">
            <ProductCarousel>
              {featured.map((product) => (
                <ProductCardLink key={product.id} product={product} />
              ))}
            </ProductCarousel>
          </div>
        </section>
      )}

      <div className="mt-12">
        <ShopFilters categories={categories} />
      </div>

      <div className="mt-8">
        <ShopResults products={result.items} />
        <Pagination page={result.page} pageCount={result.pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
