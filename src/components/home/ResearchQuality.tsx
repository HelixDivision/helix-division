import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";

/**
 * Left half of the mockup's combined "Science is our Foundation / Built for
 * those who demand more" band — see ManufacturingStandards.tsx for the right
 * half and app/page.tsx for how the two are composed side by side to match
 * the approved mockup's single 3-column row (photo · crest · photo).
 */
export function ResearchQuality() {
  return (
    <FadeIn className="relative flex min-h-[280px] flex-col justify-end overflow-hidden">
      {/* Real lab photography from HOMEPAGE RESOURSES/IMAGE ASSETS TO USE — matches the mockup's microscope researcher shot. */}
      <Image
        src="/branding/photography/lab-tech-microscope.png"
        alt=""
        fill
        className="object-cover object-[50%_30%] opacity-70 transition-transform duration-500 ease-out hover:scale-105"
        sizes="33vw"
      />
      <div className="from-background-base relative bg-gradient-to-t via-transparent to-transparent p-8 md:p-10">
        <h2 className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
          Science Is
          <br />
          Our Foundation
        </h2>
        <span className="bg-accent-crimson mt-3 block h-0.5 w-10" />
        <p className="text-foreground-muted mt-3 max-w-xs text-sm">
          Every peptide we offer is backed by rigorous research and manufactured under strict
          quality control standards.
        </p>
        <Link
          href="/research"
          className="text-accent-crimson group/link mt-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          Learn More
          <ChevronRight className="size-4 transition-transform duration-250 group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </FadeIn>
  );
}
