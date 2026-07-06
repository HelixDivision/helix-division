import { ProductCardLink } from "@/components/shop/ProductCardLink";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import type { CatalogProduct } from "@/types/catalog";

/** Same-category products, excluding the one being viewed — see getRelatedProducts() in server/services/catalog.ts. */
export function RelatedProducts({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section>
      <p className="font-heading text-foreground-primary text-xl tracking-wide uppercase sm:text-2xl">
        Related Products
        <span className="bg-accent-crimson ml-4 inline-block h-px w-12 align-middle" />
      </p>
      <div className="mt-8">
        <ProductCarousel>
          {products.map((product) => (
            <ProductCardLink key={product.id} product={product} />
          ))}
        </ProductCarousel>
      </div>
    </section>
  );
}
