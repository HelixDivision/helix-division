"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

/** Prev/next pagination for admin tables (Phase 9) — preserves every other searchParam (search, filters) while stepping `page`. */
export function AdminPagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (pageCount <= 1) return null;

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-foreground-muted text-xs">
        Page {page} of {pageCount} · {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
