import { db } from "@/lib/db";

/**
 * Admin category management (Phase 9). Categories are data, not code
 * (ARCHITECTURE.md#product--catalog-model) — creating one here is all it
 * takes for /shop/[category] to exist. Server Actions
 * (server/actions/admin-categories.ts, role-checked) → this service → Prisma.
 */

export async function listCategoriesForAdmin() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategoryForAdmin(categoryId: string) {
  return db.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });
}

export interface CategoryWriteInput {
  name: string;
  slug: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

async function assertSlugAvailable(slug: string, excludeCategoryId?: string) {
  const clash = await db.category.findUnique({ where: { slug } });
  if (clash && clash.id !== excludeCategoryId) {
    throw new Error(`The slug "${slug}" is already in use by "${clash.name}".`);
  }
}

export async function createCategory(input: CategoryWriteInput) {
  await assertSlugAvailable(input.slug);
  return db.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    },
  });
}

export async function updateCategory(categoryId: string, input: CategoryWriteInput) {
  await assertSlugAvailable(input.slug, categoryId);
  return db.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
    },
  });
}

/** Only empty categories can be deleted — reassign or delete its products first (no silent cascades over catalog data). */
export async function deleteCategory(categoryId: string) {
  const productCount = await db.product.count({ where: { categoryId } });
  if (productCount > 0) {
    throw new Error(
      `This category still has ${productCount} product${productCount === 1 ? "" : "s"} — move or delete them first.`,
    );
  }
  await db.category.delete({ where: { id: categoryId } });
}
