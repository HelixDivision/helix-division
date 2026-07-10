"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { CatalogCategory } from "@/types/catalog";

const sortOptions: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "newest", label: "Newest" },
];

// "all" clears the stock searchParam; the other values map 1:1 to StockFilter.
const stockOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Products" },
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
  { value: "coming-soon", label: "Coming Soon" },
];

interface ShopFiltersProps {
  categories: CatalogCategory[];
  activeCategorySlug?: string;
}

/**
 * Search + sort + category filters. Every control is URL-driven — nothing
 * lives in local component state beyond the search box's in-flight
 * keystrokes, which are debounced before being written to `searchParams` via
 * router.push(). Bookmarkable/shareable/crawlable results, per Phase 4's
 * search-architecture requirement.
 */
export function ShopFilters({ categories, activeCategorySlug }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(search, 350);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("q") ?? "")) {
      updateParam("q", debouncedSearch || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const currentSort = searchParams.get("sort") ?? "featured";
  const currentStock = searchParams.get("stock") ?? "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="border-border focus-within:border-accent-gunmetal relative flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 sm:max-w-xs">
          <Search className="text-foreground-muted size-4 shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="text-foreground-primary placeholder:text-foreground-muted h-full w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={currentStock}
            onValueChange={(value) => updateParam("stock", value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by availability">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              {stockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={currentSort} onValueChange={(value) => updateParam("sort", value)}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Sort products">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={cn(
            "font-heading rounded-full border px-3 py-1 text-xs tracking-wide uppercase transition-colors",
            !activeCategorySlug
              ? "border-accent-crimson bg-accent-crimson/10 text-accent-crimson"
              : "border-border text-foreground-muted hover:border-accent-gunmetal hover:text-foreground-primary",
          )}
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/shop/${category.slug}`}
            className={cn(
              "font-heading rounded-full border px-3 py-1 text-xs tracking-wide uppercase transition-colors",
              activeCategorySlug === category.slug
                ? "border-accent-crimson bg-accent-crimson/10 text-accent-crimson"
                : "border-border text-foreground-muted hover:border-accent-gunmetal hover:text-foreground-primary",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
