import Image from "next/image";
import Link from "next/link";

import { LogoMark } from "@/branding/logo/LogoMark";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerReveal } from "@/components/motion/StaggerReveal";

// PLACEHOLDER (SARMs / Laboratory Supplies / Accessories): only "Research
// Peptides" has real approved photography (the Products folder is peptide
// renders only). The other categories don't have dedicated art yet — see
// ARCHITECTURE.md#product--catalog-model for why the catalog supports
// categories beyond peptides — so they render a centered crest mark on a
// card background instead of a stretched/mis-cropped stand-in photo. Swap
// `image: null` for a real photo per category as it becomes available.
const categories = [
  {
    name: "Research Peptides",
    href: "/shop/research-peptides",
    image: "/branding/source/mockup-product-grid.jpeg",
  },
  { name: "SARMs", href: "/shop/sarms", image: null },
  { name: "Laboratory Supplies", href: "/shop/lab-supplies", image: null },
  { name: "Accessories", href: "/shop/accessories", image: null },
];

/** Category tile grid — new section per Phase 3 scope, styled in the mockup's dark/crest-accented language rather than inventing a new visual system. */
export function FeaturedCategories() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
        <FadeIn>
          <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
            Shop by Category
            <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
          </p>
        </FadeIn>

        <StaggerReveal className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group/tile border-border hover:border-accent-gunmetal/40 relative block aspect-square w-full overflow-hidden rounded-lg border transition-colors duration-250"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-250 ease-out group-hover/tile:scale-105"
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
              ) : (
                <div className="bg-background-raised absolute inset-0 flex items-center justify-center transition-transform duration-250 ease-out group-hover/tile:scale-105">
                  <LogoMark size={64} className="opacity-70" />
                </div>
              )}
              <div className="from-background-base absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
              <span className="font-heading text-foreground-primary absolute bottom-3 left-3 text-xs tracking-wide uppercase">
                {category.name}
              </span>
            </Link>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
