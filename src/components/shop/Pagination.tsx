import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a given page, preserving the caller's other searchParams. */
  buildHref: (page: number) => string;
}

/** Server-rendered prev/next + page links — bookmarkable/crawlable, no client JS required. */
export function Pagination({ page, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <Link
        href={buildHref(page - 1)}
        aria-label="Previous page"
        aria-disabled={page <= 1}
        className={cn(
          "border-border flex size-8 items-center justify-center rounded-md border transition-colors",
          page <= 1
            ? "text-foreground-muted pointer-events-none opacity-40"
            : "text-foreground-primary hover:border-accent-gunmetal",
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "font-heading flex size-8 items-center justify-center rounded-md border text-xs tracking-wide transition-colors",
            p === page
              ? "border-accent-crimson bg-accent-crimson/10 text-accent-crimson"
              : "border-border text-foreground-muted hover:border-accent-gunmetal hover:text-foreground-primary",
          )}
        >
          {p}
        </Link>
      ))}

      <Link
        href={buildHref(page + 1)}
        aria-label="Next page"
        aria-disabled={page >= pageCount}
        className={cn(
          "border-border flex size-8 items-center justify-center rounded-md border transition-colors",
          page >= pageCount
            ? "text-foreground-muted pointer-events-none opacity-40"
            : "text-foreground-primary hover:border-accent-gunmetal",
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
