import { Star } from "lucide-react";

/**
 * Reserves the page position and component boundary for a future Reviews
 * feature (the `Review` model already exists in prisma/schema.prisma) —
 * intentionally not implemented yet. When it is, this component gains real
 * data (CatalogProduct.reviewCount/averageRating) without moving anything
 * else on the PDP.
 */
export function ReviewsSection() {
  return (
    <section className="border-border rounded-lg border p-8 text-center">
      <div className="flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="text-foreground-muted size-4" strokeWidth={1.5} />
        ))}
      </div>
      <p className="font-heading text-foreground-primary mt-3 text-sm tracking-wide uppercase">
        Customer Reviews Coming Soon
      </p>
      <p className="text-foreground-muted mt-1 text-sm">
        Be among the first researchers to review this product.
      </p>
    </section>
  );
}
