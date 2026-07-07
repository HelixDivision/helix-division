import type { Metadata } from "next";

import { CategoryManager } from "@/components/admin/CategoryManager";
import { listCategoriesForAdmin } from "@/server/services/admin-categories";

export const metadata: Metadata = {
  title: "Categories | Admin | Helix Division",
};

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesForAdmin();

  return (
    <CategoryManager
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        productCount: category._count.products,
      }))}
    />
  );
}
