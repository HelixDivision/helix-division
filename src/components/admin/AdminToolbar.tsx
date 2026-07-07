"use client";

import { Search } from "lucide-react";
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

export interface AdminToolbarFilter {
  /** searchParams key, e.g. "status". */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Label of the "no filter" choice, e.g. "All statuses". */
  allLabel: string;
}

/**
 * Search + filter toolbar for admin list pages (Phase 9) — same URL-driven
 * architecture as ShopFilters: every control writes to searchParams (debounced
 * for the search box), pages read them server-side, and changing anything
 * resets pagination. One component configured per module, not one per page.
 */
export function AdminToolbar({
  searchPlaceholder,
  filters = [],
}: {
  searchPlaceholder: string;
  filters?: AdminToolbarFilter[];
}) {
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="border-border focus-within:border-accent-gunmetal relative flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 sm:max-w-xs">
        <Search className="text-foreground-muted size-4 shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="text-foreground-primary placeholder:text-foreground-muted h-full w-full bg-transparent text-sm outline-none"
        />
      </div>

      {filters.map((filter) => {
        const ALL = "__all__";
        const current = searchParams.get(filter.param) ?? ALL;
        return (
          <Select
            key={filter.param}
            value={current}
            onValueChange={(value) => updateParam(filter.param, value === ALL ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label={filter.label}>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
