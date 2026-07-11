import Image from "next/image";
import Link from "next/link";

import { LogoMark } from "@/branding/logo/LogoMark";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerReveal } from "@/components/motion/StaggerReveal";
import { getCategories } from "@/server/services/catalog";

// Optional per-category photography, keyed by slug. This is presentation art
// only — NOT a category list. The categories themselves come from the database
// (getCategories, the same source that powers the Admin dashboard), so creating
// or deleting a category in Admin is reflected here automatically. A slug with
// no entry (or no approved photo yet) falls back to a centered crest mark
// rather than a stretched/mis-cropped stand-in. Add a slug → image path here as
// approved photography becomes available.
const CATEGORY_IMAGES: Record<string, string> = {
  "research-peptides": "/branding/source/mockup-product-grid.jpeg",
};

/**
 * Category tile grid — renders directly from the Category data source (DB), so
 * the homepage always mirrors the Admin categories exactly (single source of
 * truth). Styled in the mockup's dark/crest-accented language.
 */
export async function FeaturedCategories() {
  const categories = await getCategories();
  if (categories.length === 0) return null;

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
          {categories.map((category) => {
            const image = CATEGORY_IMAGES[category.slug] ?? null;
            return (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="group/tile border-border hover:border-accent-gunmetal/40 relative block aspect-square w-full overflow-hidden rounded-lg border transition-colors duration-250"
              >
                {image ? (
                  <Image
                    src={image}
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
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
