import { cn } from "@/lib/utils";

/**
 * Centered section header used across the marketing pages — uppercase tracked
 * title with a short crimson underline and a muted subtitle, matching the
 * "OUR PROCESS / OUR COMMITMENT TO QUALITY" headers in the mockups.
 */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <h2 className="font-heading text-foreground-primary text-2xl tracking-[0.15em] uppercase sm:text-3xl">
        {title}
      </h2>
      <span
        className={cn("bg-accent-crimson mt-3 block h-0.5 w-12", align === "center" && "mx-auto")}
      />
      {subtitle && (
        <p className="text-foreground-muted mt-4 max-w-2xl text-sm tracking-wide">{subtitle}</p>
      )}
    </div>
  );
}
