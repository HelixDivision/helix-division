import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FadeIn } from "@/components/motion/FadeIn";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { CertificateCard } from "@/components/shop/CertificateCard";
import { PriceDisplay } from "@/components/shop/PriceDisplay";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import { ReviewsSection } from "@/components/shop/ReviewsSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormattedText } from "@/components/ui/formatted-text";
import { getStockStatus } from "@/lib/stock-status";
import {
  getAllProductSlugPairs,
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
} from "@/server/services/catalog";

const stockStatusCopy = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock — order soon",
  "out-of-stock": "Out of Stock",
  "coming-soon": "Coming Soon",
} as const;

const shippingClassCopy = {
  STANDARD: "Ships via standard discreet parcel — no special handling required.",
  COLD_CHAIN: "Requires cold-chain handling — shipped with insulated packaging and ice packs.",
  HAZMAT: "Classified as hazardous material — shipped under restricted carrier rules.",
} as const;

interface ProductPageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllProductSlugPairs();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const product = await getProductBySlug(category, slug);
  if (!product) return {};
  return {
    title: product.seoTitle ?? `${product.name} | Helix Division`,
    description: product.seoDescription ?? product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { category: categorySlug, slug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  const product = await getProductBySlug(categorySlug, slug);
  if (!category || !product) notFound();

  const variant = product.variants[0];
  const stockStatus = getStockStatus(variant);
  const related = await getRelatedProducts(product);

  const specRows: { label: string; value?: string }[] = [
    { label: "SKU", value: variant.sku },
    { label: "Category", value: category.name },
    { label: "Purity", value: product.purity },
    { label: "Molecular Weight", value: product.molecularWeight },
    { label: "CAS Number", value: product.casNumber },
    { label: "Sequence", value: product.sequence },
    { label: "Storage Instructions", value: product.storageInstructions },
  ];

  return (
    <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-12 sm:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name, href: `/shop/${category.slug}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <FadeIn>
          <ProductGallery images={product.images} productName={product.name} />
        </FadeIn>

        <FadeIn delay={0.1} className="flex flex-col gap-4">
          <span className="text-foreground-muted text-xs tracking-wide uppercase">
            {category.name}
          </span>
          <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
            {product.name}
          </h1>
          <span className="text-foreground-muted text-sm tracking-wide uppercase">
            Strength: {variant.label}
          </span>

          <PriceDisplay
            price={variant.price}
            compareAtPrice={variant.compareAtPrice}
            className="text-lg"
          />

          <span className="text-sm font-medium uppercase">{stockStatusCopy[stockStatus]}</span>

          <FormattedText
            text={product.description}
            className="text-foreground-muted max-w-md text-sm"
          />

          <div className="mt-2">
            <AddToCartButton product={product} />
          </div>
        </FadeIn>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_320px]">
        <Accordion defaultValue={["specifications"]}>
          <AccordionItem value="specifications">
            <AccordionTrigger className="font-heading text-foreground-primary tracking-wide uppercase">
              Specifications
            </AccordionTrigger>
            <AccordionContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {specRows.map((row) => (
                  <div
                    key={row.label}
                    className="border-border flex justify-between border-b py-2 text-sm"
                  >
                    <dt className="text-foreground-muted">{row.label}</dt>
                    <dd className="text-foreground-primary text-right">
                      {row.value ?? "Not yet published"}
                    </dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="lab-testing">
            <AccordionTrigger className="font-heading text-foreground-primary tracking-wide uppercase">
              Laboratory Testing
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-foreground-muted">
                {product.documents?.some((doc) => doc.kind === "coa")
                  ? "Independent third-party analysis is documented in the Certificate of Analysis below — download it for the full purity and identity results."
                  : "Third-party lab testing data pending publication. Certificate of Analysis available on request."}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="research-disclaimer">
            <AccordionTrigger className="font-heading text-foreground-primary tracking-wide uppercase">
              Research Disclaimer
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-foreground-muted">
                This product is sold strictly for in-vitro laboratory research. It is not a drug,
                food, or cosmetic, and is not approved for human or animal consumption. Any order
                requires an explicit research-use acknowledgment.
              </p>
              {product.researchSummary && (
                <FormattedText
                  text={product.researchSummary}
                  className="text-foreground-muted mt-3"
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shipping">
            <AccordionTrigger className="font-heading text-foreground-primary tracking-wide uppercase">
              Shipping Information
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-foreground-muted">{shippingClassCopy[product.shippingClass]}</p>
              <p className="text-foreground-muted mt-2">
                All orders ship discreetly in plain packaging with no reference to contents on the
                exterior.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <CertificateCard documents={product.documents} />
      </div>

      <div className="mt-16">
        <ReviewsSection />
      </div>

      <div className="mt-16">
        <RelatedProducts products={related} categoryName={category.name} />
      </div>

      <div className="mt-16">
        <RecentlyViewed currentProduct={product} />
      </div>
    </div>
  );
}
