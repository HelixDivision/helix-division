import { ChevronRight } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Home / Shop / [Category] / [Product] — tokens only, reused across category pages and PDPs. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-foreground-muted hover:text-foreground-primary tracking-wide uppercase transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={
                  isLast
                    ? "text-foreground-primary tracking-wide uppercase"
                    : "text-foreground-muted tracking-wide uppercase"
                }
              >
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="text-foreground-muted size-3" />}
          </span>
        );
      })}
    </nav>
  );
}
