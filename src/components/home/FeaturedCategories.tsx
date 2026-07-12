import Image from "next/image";
import Link from "next/link";

import { LogoMark } from "@/branding/logo/LogoMark";
import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerReveal } from "@/components/motion/StaggerReveal";
import { getFeaturedCategories } from "@/server/services/catalog";

/**
 * Homepage "Shop by Category" grid. Renders directly from the database —
 * getFeaturedCategories() reads the SAME `categories` table the Admin dashboard
 * writes to (single source of truth). It shows ONLY featured categories,
 * ordered by sortOrder, each with its Admin-uploaded image (crest fallback when
 * none). There is no hardcoded category list anywhere: featuring, creating,
 * reordering, or deleting a category in Admin changes this grid with no code
 * change (the category actions revalidate "/"). Styled in the mockup's
 * dark/crest-accented language.
 */
export async function FeaturedCategories() {
  const categories = await getFeaturedCategories();
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
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className="group/tile border-border hover:border-accent-gunmetal/40 relative block aspect-square w-full overflow-hidden rounded-lg border transition-colors duration-250"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.imageAlt ?? category.name}
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
