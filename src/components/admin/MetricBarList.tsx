import type { NameValue } from "@/server/services/analytics-dashboard";

/**
 * Horizontal bar list for admin analytics breakdowns (Phase 9.5) — pure
 * presentation, no chart library (bar widths are % of the max). Used for
 * traffic sources, top pages, devices, countries, search terms, best-sellers.
 */
export function MetricBarList({
  title,
  items,
  emptyLabel = "No data yet.",
  formatValue = (v) => String(v),
}: {
  title: string;
  items: NameValue[];
  emptyLabel?: string;
  formatValue?: (value: number) => string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);

  return (
    <div className="border-border rounded-lg border p-5">
      <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-foreground-muted mt-3 text-sm">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground-muted min-w-0 truncate">{item.label}</span>
                <span className="text-foreground-primary shrink-0">{formatValue(item.value)}</span>
              </div>
              <div className="bg-background-raised h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-accent-crimson h-full rounded-full"
                  style={{ width: `${max > 0 ? Math.max(3, (item.value / max) * 100) : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
