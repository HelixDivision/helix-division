import { Award, ChevronRight, Dna, Shield, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FeatureItem } from "@/components/home/FeatureItem";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

const trustItems = [
  { icon: Target, label: "Precision", description: "In every dose" },
  { icon: Shield, label: "Strength", description: "In every mission" },
  { icon: Dna, label: "Science", description: "Driven results" },
  { icon: Award, label: "Discipline", description: "Builds excellence" },
];

/** Homepage hero — copy, hierarchy, and image per the approved mockup (public/branding/source/mockup-homepage.png). */
export function Hero() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto grid max-w-(--breakpoint-xl) items-center gap-10 px-6 py-12 sm:px-8 lg:grid-cols-2 lg:py-20">
        <FadeIn>
          <p className="text-accent-crimson text-sm font-medium tracking-[0.2em] uppercase">
            Precision. Performance. Purpose.
          </p>
          <h1 className="font-heading text-foreground-primary mt-3 text-4xl leading-[1.05] tracking-wide uppercase sm:text-5xl lg:text-6xl">
            From the Battlefield
            <br />
            to the Boardroom
          </h1>
          <p className="text-foreground-muted mt-5 max-w-md text-base">
            Advanced peptides. Backed by science. Engineered for those who demand more.
          </p>
          {/* Outline, not filled — matches the mockup's consistent bordered-button treatment (every CTA in the mockup is outline style, not solid crimson). */}
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

          <div className="mt-12 grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:gap-x-4">
            {trustItems.map((item) => (
              <FeatureItem key={item.label} {...item} />
            ))}
          </div>
        </FadeIn>

        <FadeIn
          delay={0.1}
          className="relative aspect-4/5 w-full overflow-hidden rounded-lg lg:aspect-square"
        >
          <Image
            src="/products/bpc-157.png"
            alt="Helix Division BPC-157 — research peptide, field-tested precision"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          {/* Decorative — matches the mockup's static carousel-dot indicator on the hero image. Non-functional (single image), purely visual fidelity. */}
          <div className="absolute right-4 bottom-4 flex items-center gap-1.5">
            <span className="bg-accent-crimson h-1.5 w-4 rounded-full" />
            <span className="bg-foreground-primary/40 h-1.5 w-1.5 rounded-full" />
            <span className="bg-foreground-primary/40 h-1.5 w-1.5 rounded-full" />
            <span className="bg-foreground-primary/40 h-1.5 w-1.5 rounded-full" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
