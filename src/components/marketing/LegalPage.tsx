import { FadeIn } from "@/components/motion/FadeIn";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/**
 * Shared layout for legal/policy pages (Terms, Privacy, Shipping, Research
 * Disclaimer) — consistent heading, last-updated line, and readable prose
 * column, matching the site's typography.
 */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-(--breakpoint-md) px-6 py-16 sm:px-8 sm:py-20">
      <FadeIn>
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          {title}
        </h1>
        <span className="bg-accent-crimson mt-4 block h-0.5 w-16" />
        <p className="text-foreground-muted mt-4 text-xs tracking-wide uppercase">
          Last updated: {updated}
        </p>
        {intro && <p className="text-foreground-muted mt-6 text-sm leading-relaxed">{intro}</p>}
      </FadeIn>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <FadeIn key={section.heading}>
            <h2 className="font-heading text-foreground-primary text-sm tracking-[0.15em] uppercase">
              {section.heading}
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-foreground-muted text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </FadeIn>
        ))}
      </div>

      <p className="border-border text-foreground-muted mt-12 border-t pt-6 text-xs leading-relaxed">
        Research use only. Not for human or animal consumption. This page is provided for general
        informational purposes and does not constitute legal advice.
      </p>
    </div>
  );
}
