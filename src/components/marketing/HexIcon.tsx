import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Hexagon-framed crimson icon — the recurring motif in the About/Quality
 * mockups (process steps, feature cards, analytical methods). The hexagon is a
 * CSS clip-path border ring so it scales cleanly and tokenizes its colors.
 */
export function HexIcon({
  icon: Icon,
  size = 64,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  const hexClip = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Crimson hex ring: an outer crimson shape with an inset background shape on top. */}
      <span
        aria-hidden
        className="bg-accent-crimson/70 absolute inset-0"
        style={{ clipPath: hexClip }}
      />
      <span
        aria-hidden
        className="bg-background-raised absolute inset-[2px]"
        style={{ clipPath: hexClip }}
      />
      <Icon
        className="text-accent-crimson relative"
        style={{ width: size * 0.4, height: size * 0.4 }}
        strokeWidth={1.5}
      />
    </span>
  );
}
