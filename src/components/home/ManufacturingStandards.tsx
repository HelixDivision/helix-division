import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";

/** Right half of the mockup's combined split band — see ResearchQuality.tsx. */
export function ManufacturingStandards() {
  return (
    <FadeIn
      delay={0.1}
      className="relative flex min-h-[280px] flex-col justify-end overflow-hidden"
    >
      {/* Real executive/skyline photography from HOMEPAGE RESOURSES/IMAGE ASSETS TO USE — matches the mockup's boardroom shot. */}
      <Image
        src="/branding/photography/executive-skyline.png"
        alt=""
        fill
        className="object-cover object-top opacity-70 transition-transform duration-500 ease-out hover:scale-105"
        sizes="33vw"
      />
      <div className="from-background-base relative bg-gradient-to-t via-transparent to-transparent p-8 md:p-10">
        <h2 className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
          Built for Those
          <br />
          Who Demand More
        </h2>
        <span className="bg-accent-crimson mt-3 block h-0.5 w-10" />
        <p className="text-foreground-muted mt-3 max-w-xs text-sm">
          Whether your mission is physical, mental, or professional — our peptides are here to
          support your pursuit of excellence.
        </p>
        <Link
          href="/about"
          className="text-accent-crimson group/link mt-4 inline-flex items-center gap-1 text-sm font-medium"
        >
          Our Mission
          <ChevronRight className="size-4 transition-transform duration-250 group-hover/link:translate-x-0.5" />
        </Link>
      </div>
    </FadeIn>
  );
}
