import { cn } from "@/lib/utils";

/**
 * Dashboard stat tile (Phase 9) — the DataTable/StatCard admin primitive pair
 * DESIGN_SYSTEM.md reserves for admin modules. Server component, no state.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="border-border rounded-lg border p-5">
      <p className="text-foreground-muted font-heading text-xs tracking-wide uppercase">{label}</p>
      <p
        className={cn(
          "font-heading mt-2 text-2xl",
          tone === "warning" ? "text-state-warning" : "text-foreground-primary",
        )}
      >
        {value}
      </p>
      {hint && <p className="text-foreground-muted mt-1 text-xs">{hint}</p>}
    </div>
  );
}
