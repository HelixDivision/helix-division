import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCoaManager } from "@/components/admin/ProductCoaManager";
import { ProductForm, type CategoryOption } from "@/components/admin/ProductForm";
import { ProductImagesForm } from "@/components/admin/ProductImagesForm";
import { listCategoriesForAdmin } from "@/server/services/admin-categories";
import { getProductForAdmin } from "@/server/services/admin-products";

export const metadata: Metadata = {
  title: "Edit Product | Admin | Helix Division",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    listCategoriesForAdmin(),
  ]);
  if (!product) notFound();

  const categoryOptions: CategoryOption[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    attributeSchema: Array.isArray(category.attributeSchema)
      ? (category.attributeSchema as { key: string; label: string }[])
      : [],
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/products"
          className="text-foreground-muted hover:text-foreground-primary inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to products
        </Link>
        <h2 className="font-heading text-foreground-primary mt-3 text-lg tracking-wide uppercase">
          Edit: {product.name}
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">
          Storefront URL: /shop/{product.category.slug}/{product.slug}
        </p>
      </div>

      <ProductForm
        productId={product.id}
        categories={categoryOptions}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          researchSummary: product.researchSummary ?? "",
          categoryId: product.categoryId,
          status: product.status,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          purity: product.purity ?? "",
          molecularWeight: product.molecularWeight ?? "",
          casNumber: product.casNumber ?? "",
          sequence: product.sequence ?? "",
          storageInstructions: product.storageInstructions ?? "",
          featured: product.featured,
          newArrival: product.newArrival,
          bestSeller: product.bestSeller,
          shippingClass: product.shippingClass,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            sku: variant.sku,
            price: variant.price === null ? "" : String(variant.price),
            compareAtPrice: variant.compareAtPrice === null ? "" : String(variant.compareAtPrice),
            availableQuantity: String(variant.availableQuantity),
            stock: String(variant.stock),
            lowStockThreshold: String(variant.lowStockThreshold),
            backorderAllowed: variant.backorderAllowed,
            attributes:
              variant.attributes && typeof variant.attributes === "object"
                ? (variant.attributes as Record<string, string>)
                : {},
          })),
        }}
      />

      <div className="border-border border-t pt-8">
        <ProductImagesForm
          productId={product.id}
          defaultValues={{
            images: product.images.map((image) => ({
              url: image.url,
              alt: image.alt,
              kind: image.kind,
            })),
          }}
        />
      </div>

      <div className="border-border border-t pt-8">
        <ProductCoaManager
          productId={product.id}
          currentCoa={(() => {
            const coa = product.documents.find((doc) => doc.kind === "COA");
            return coa ? { url: coa.url, label: coa.label } : null;
          })()}
        />
      </div>
    </div>
  );
}
