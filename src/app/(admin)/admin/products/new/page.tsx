import type { Metadata } from "next";

import { EMPTY_VARIANT, ProductForm, type CategoryOption } from "@/components/admin/ProductForm";
import { listCategoriesForAdmin } from "@/server/services/admin-categories";

export const metadata: Metadata = {
  title: "New Product | Admin | Helix Division",
};

function toCategoryOptions(
  categories: Awaited<ReturnType<typeof listCategoriesForAdmin>>,
): CategoryOption[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    attributeSchema: Array.isArray(category.attributeSchema)
      ? (category.attributeSchema as { key: string; label: string }[])
      : [],
  }));
}

export default async function NewProductPage() {
  const categories = await listCategoriesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
        New Product
      </h2>
      <ProductForm
        productId={null}
        categories={toCategoryOptions(categories)}
        defaultValues={{
          name: "",
          slug: "",
          description: "",
          researchSummary: "",
          categoryId: "",
          status: "DRAFT",
          seoTitle: "",
          seoDescription: "",
          purity: "",
          molecularWeight: "",
          casNumber: "",
          sequence: "",
          storageInstructions: "",
          labTestingSummary: "",
          featured: false,
          newArrival: false,
          bestSeller: false,
          shippingClass: "STANDARD",
          variants: [{ ...EMPTY_VARIANT }],
        }}
      />
    </div>
  );
}
