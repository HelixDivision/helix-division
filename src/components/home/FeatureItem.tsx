import type { LucideIcon } from "lucide-react";

interface FeatureItemProps {
  icon: LucideIcon;
  label: string;
  description?: string;
}

/**
 * Icon + label pattern reused across Hero, TrustBar, WhyHelix, and the
 * Manufacturing Standards trust strip — matches the approved mockup's
 * repeated icon/label treatment instead of four one-off implementations.
 */
export function FeatureItem({ icon: Icon, label, description }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="text-accent-gunmetal size-6 shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col">
        <span className="font-heading text-foreground-primary text-xs tracking-wide uppercase">
          {label}
        </span>
        {description && <span className="text-foreground-muted text-xs">{description}</span>}
      </div>
    </div>
  );
}
