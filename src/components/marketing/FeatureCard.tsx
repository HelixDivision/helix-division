import type { LucideIcon } from "lucide-react";

import { HexIcon } from "@/components/marketing/HexIcon";

/**
 * Hex-icon feature card — the raised, bordered card used in the "Why Choose"
 * (About) and "Our Commitment" (Quality) grids. Hover lifts the border to
 * crimson, consistent with the rest of the site's interactive cards.
 */
export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border-border bg-background-raised hover:border-accent-crimson/60 flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors">
      <HexIcon icon={icon} size={56} />
      <h3 className="font-heading text-foreground-primary mt-1 text-sm tracking-wide uppercase">
        {title}
      </h3>
      <p className="text-foreground-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
