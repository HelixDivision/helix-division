import { formatCurrency } from "@/lib/utils";
import type { DailyPoint } from "@/server/services/analytics-dashboard";

/**
 * Minimal revenue bar chart (Phase 9.5) — div-based, no chart library. One bar
 * per day in the window; height is % of the max. Kept dependency-free and
 * theme-tokened like the rest of the admin.
 */
export function SalesTrendChart({ points }: { points: DailyPoint[] }) {
  const max = points.reduce((m, p) => Math.max(m, p.value), 0);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="border-border rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Sales Trend
        </h3>
        <span className="text-foreground-muted text-xs">
          {formatCurrency(total)} over {points.length} days
        </span>
      </div>
      {max === 0 ? (
        <p className="text-foreground-muted mt-4 text-sm">No sales in this window yet.</p>
      ) : (
        <div className="mt-5 flex h-32 items-end gap-0.5">
          {points.map((point) => (
            <div
              key={point.date}
              className="group relative flex-1"
              title={`${point.date}: ${formatCurrency(point.value)}`}
            >
              <div
                className="bg-accent-crimson/70 hover:bg-accent-crimson w-full rounded-sm transition-colors"
                style={{ height: `${Math.max(2, (point.value / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
