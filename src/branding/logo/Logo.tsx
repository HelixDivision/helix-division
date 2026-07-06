import { LogoMark } from "@/branding/logo/LogoMark";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { icon: 32, helix: "text-base", division: "text-[0.55rem]", tagline: "text-[0.5rem]" },
  md: { icon: 44, helix: "text-xl", division: "text-[0.65rem]", tagline: "text-[0.55rem]" },
  lg: { icon: 64, helix: "text-2xl", division: "text-xs", tagline: "text-[0.6rem]" },
} as const;

interface LogoProps {
  size?: keyof typeof sizes;
  /** Show the "Precision Molecular Systems" tagline line (omit in tight spaces). */
  tagline?: boolean;
  className?: string;
}

/**
 * Full crest + wordmark lockup — matches the approved mockup's header
 * treatment (public/branding/source/mockup-homepage.png): a small crest icon
 * beside "HELIX" / "DIVISION" / tagline rendered as real text, not baked into
 * the source JPEG. This sidesteps the JPEG's black background entirely for
 * the wordmark (the previous version rendered the whole flattened lockup
 * image, which showed as a boxed dark square in the header) — only the small
 * crest icon still depends on the JPEG-background trick (see LogoMark.tsx).
 */
export function Logo({ size = "md", tagline = true, className }: LogoProps) {
  const s = sizes[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={s.icon} />
      <span className="flex flex-col leading-none">
        <span
          className={cn("font-heading text-foreground-primary tracking-wide uppercase", s.helix)}
        >
          Helix
        </span>
        <span
          className={cn(
            "font-heading text-accent-crimson mt-0.5 tracking-[0.3em] uppercase",
            s.division,
          )}
        >
          Division
        </span>
        {tagline && (
          <span className={cn("text-foreground-muted mt-1 tracking-[0.12em] uppercase", s.tagline)}>
            Precision Molecular Systems
          </span>
        )}
      </span>
    </span>
  );
}
