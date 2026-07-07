import type { ReactNode } from "react";

import { FadeIn } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

/**
 * Shared hero for the marketing pages (About / Quality / Contact), matching the
 * three approved mockups: a big metallic uppercase page title with a crimson
 * underline, a tracked-uppercase subtitle, body copy on the left, and a media
 * composition on the right. Media is a slot so each page supplies its own
 * (crest showcase, product/lab imagery). Reuses the site's FadeIn + brand
 * tokens so it reads as part of the same site, not a bolt-on.
 */
export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  paragraphs,
  media,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  media: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="border-border relative overflow-hidden border-b">
      {/* Subtle hex/tech texture wash behind the hero, matching the mockups' dark backdrop. */}
      <div
        aria-hidden
        className="from-background-raised/60 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent"
      />
      <div className="relative mx-auto grid max-w-(--breakpoint-xl) items-center gap-10 px-6 py-14 sm:px-8 lg:grid-cols-2 lg:py-24">
        <FadeIn whileInView={false}>
          {eyebrow && (
            <p className="text-accent-crimson text-xs font-medium tracking-[0.25em] uppercase">
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "font-heading mt-3 bg-gradient-to-b from-[#dfe1e3] via-[#c2c4c7] to-[#7f8286] bg-clip-text text-4xl leading-[1.02] tracking-wide text-transparent uppercase sm:text-5xl lg:text-6xl",
            )}
          >
            {title}
          </h1>
          <span className="bg-accent-crimson mt-4 block h-0.5 w-16" />
          <p className="text-foreground-primary mt-5 text-sm font-medium tracking-[0.15em] uppercase sm:text-base">
            {subtitle}
          </p>
          <div className="mt-5 flex max-w-md flex-col gap-3">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-foreground-muted text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          {actions && <div className="mt-8">{actions}</div>}
        </FadeIn>

        <FadeIn whileInView={false} delay={0.1}>
          {media}
        </FadeIn>
      </div>
    </section>
  );
}
