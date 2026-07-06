import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCarousel } from "@/components/shop/ProductCarousel";

// Sample pricing/copy matching the approved mockup's featured lineup and
// naming — real data comes from the Product/ProductVariant models (see
// ARCHITECTURE.md#database-schema-core-models) once the catalog is wired up.
// Product photography itself is real: every image below is an approved
// render from the brand's Products folder (public/products/), not a
// placeholder. Dosage labels match what's printed on each vial's actual
// render (source of truth for the photo, not the older text-only mockup).
const featuredProducts = [
  {
    name: "BPC-157",
    href: "/shop/research-peptides/bpc-157",
    image: "/products/bpc-157.png",
    variantLabel: "10MG",
    price: 59,
    badge: "new" as const,
  },
  {
    name: "Retatrutide",
    href: "/shop/research-peptides/retatrutide",
    image: "/products/retatrutide.png",
    variantLabel: "10MG",
    price: 129,
    compareAtPrice: 149,
  },
  {
    name: "NAD+",
    href: "/shop/research-peptides/nad",
    image: "/products/nad.png",
    variantLabel: "10MG",
    price: 79,
  },
  {
    name: "Ipamorelin",
    href: "/shop/research-peptides/ipamorelin",
    image: "/products/ipamorelin.png",
    variantLabel: "10MG",
    price: 55,
    badge: "research-grade" as const,
  },
  {
    name: "GHK-Cu",
    href: "/shop/research-peptides/ghk-cu",
    image: "/products/ghk-cu.png",
    variantLabel: "50MG",
    price: 69,
  },
  {
    name: "DSIP",
    href: "/shop/research-peptides/dsip",
    image: "/products/dsip.png",
    variantLabel: "10MG",
    price: 49,
  },
];

/** Featured product carousel — matches the approved mockup's "Featured Peptides" section (products, order, naming), presented as a horizontal carousel per the Phase 3 refinement. */
export function FeaturedProducts() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
        <FadeIn className="flex items-end justify-between">
          <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
            Featured Peptides
            <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
          </p>
          <Link
            href="/shop"
            className="group text-foreground-muted hover:text-accent-crimson hidden items-center gap-1 text-sm transition-colors sm:flex"
          >
            View All Peptides
            <span className="transition-transform duration-250 group-hover:translate-x-1">→</span>
          </Link>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10">
          <ProductCarousel>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.name}
                name={product.name}
                href={product.href}
                imageUrl={product.image}
                imageAlt={`Helix Division ${product.name} vial`}
                price={product.price}
                compareAtPrice={"compareAtPrice" in product ? product.compareAtPrice : undefined}
                variantLabel={product.variantLabel}
                badge={"badge" in product ? product.badge : undefined}
              />
            ))}
          </ProductCarousel>
        </FadeIn>

        <Link
          href="/shop"
          className="text-foreground-muted hover:text-accent-crimson mt-6 block text-center text-sm transition-colors sm:hidden"
        >
          View All Peptides →
        </Link>
      </div>
    </section>
  );
}
