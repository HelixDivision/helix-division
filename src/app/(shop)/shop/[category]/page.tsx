import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FadeIn } from "@/components/motion/FadeIn";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { Pagination } from "@/components/shop/Pagination";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { ShopResults } from "@/components/shop/ShopResults";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  type ProductSort,
} from "@/server/services/catalog";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return {};
  return {
    title: `${category.name} | Helix Division`,
    description: category.description,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const foundCategory = getCategoryBySlug(categorySlug);
  if (!foundCategory) notFound();
  const category = foundCategory;

  const search = await searchParams;
  const page = Number(search.page) || 1;
  const categories = getCategories();
  const result = getProducts({
    category: category.slug,
    q: search.q,
    sort: (search.sort as ProductSort) || "featured",
    page,
  });

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (search.q) params.set("q", search.q);
    if (search.sort) params.set("sort", search.sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/shop/${category.slug}?${qs}` : `/shop/${category.slug}`;
  }

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
      />

      <FadeIn className="mt-4">
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-foreground-muted mt-2 max-w-xl text-sm">{category.description}</p>
        )}
      </FadeIn>

      <div className="mt-10">
        <ShopFilters categories={categories} activeCategorySlug={category.slug} />
      </div>

      <div className="mt-8">
        <ShopResults products={result.items} />
        <Pagination page={result.page} pageCount={result.pageCount} buildHref={buildHref} />
      </div>
    </div>
  );
}
