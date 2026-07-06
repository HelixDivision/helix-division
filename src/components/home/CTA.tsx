import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

/** Closing call-to-action — new section per Phase 3 scope, echoing the Hero's tone as the page's final beat before Footer. */
export function CTA() {
  return (
    <section className="bg-background-raised">
      <div className="mx-auto max-w-(--breakpoint-md) px-6 py-20 text-center sm:px-8 sm:py-24">
        <FadeIn>
          <p className="text-accent-crimson text-sm font-medium tracking-[0.2em] uppercase">
            Precision. Performance. Purpose.
          </p>
          <h2 className="font-heading text-foreground-primary mt-3 text-3xl tracking-wide uppercase sm:text-4xl">
            Ready to advance your research?
          </h2>
          <p className="text-foreground-muted mt-4 text-sm">
            Explore the full catalog — lab-verified, discreetly shipped, built for those who demand
            more.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-8"
            render={<Link href="/shop" />}
            nativeButton={false}
          >
            Shop Peptides
            <ChevronRight className="transition-transform duration-250 group-hover/button:translate-x-0.5" />
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
