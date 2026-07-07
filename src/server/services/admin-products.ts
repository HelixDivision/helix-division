import type { Prisma, ProductStatus, ShippingClass } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Admin product management (Phase 9) — create/edit/delete/duplicate/archive,
 * plus the variant/image nested writes the product form edits in place.
 * Follows the same layering as every other service: Server Actions
 * (server/actions/admin-products.ts, role-checked) → this service → Prisma.
 * Storefront reads stay in lib/catalog.ts (ACTIVE-only); this file is the
 * write side plus admin-shaped reads (all statuses, filters, pagination).
 */

export interface AdminProductListParams {
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  sort?: "newest" | "name" | "updated";
  page?: number;
  pageSize?: number;
}

const PRODUCT_LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  variants: {
    select: { id: true, price: true, availableQuantity: true, lowStockThreshold: true },
  },
  images: { orderBy: { position: "asc" as const }, take: 1 },
} satisfies Prisma.ProductInclude;

export async function listProductsForAdmin(params: AdminProductListParams) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const where: Prisma.ProductWhereInput = {
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { slug: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "name"
      ? { name: "asc" }
      : params.sort === "updated"
        ? { updatedAt: "desc" }
        : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: PRODUCT_LIST_INCLUDE,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where }),
  ]);
  return { products, total, page, pageSize };
}

export async function getProductForAdmin(productId: string) {
  return db.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      variants: { orderBy: { label: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
}

export interface ProductWriteInput {
  name: string;
  slug: string;
  description: string;
  researchSummary?: string | null;
  categoryId: string;
  status: ProductStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  purity?: string | null;
  molecularWeight?: string | null;
  casNumber?: string | null;
  sequence?: string | null;
  storageInstructions?: string | null;
  labTestingSummary?: string | null;
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  shippingClass: ShippingClass;
}

export interface VariantWriteInput {
  /** Present = update this existing variant; absent = create a new one. */
  id?: string;
  label: string;
  sku: string;
  price: number | null;
  compareAtPrice?: number | null;
  availableQuantity: number;
  stock: number;
  lowStockThreshold: number;
  backorderAllowed: boolean;
  attributes: Record<string, string>;
}

export interface ImageWriteInput {
  url: string;
  alt: string;
  kind: "PRIMARY" | "GALLERY" | "LABEL_CLOSEUP" | "PACKAGING" | "LIFESTYLE" | "COA_PREVIEW";
}

async function assertSlugAvailable(slug: string, excludeProductId?: string) {
  const clash = await db.product.findUnique({ where: { slug } });
  if (clash && clash.id !== excludeProductId) {
    throw new Error(`The slug "${slug}" is already in use by "${clash.name}".`);
  }
}

function productData(input: ProductWriteInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    researchSummary: input.researchSummary ?? null,
    categoryId: input.categoryId,
    status: input.status,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    purity: input.purity ?? null,
    molecularWeight: input.molecularWeight ?? null,
    casNumber: input.casNumber ?? null,
    sequence: input.sequence ?? null,
    storageInstructions: input.storageInstructions ?? null,
    labTestingSummary: input.labTestingSummary ?? null,
    featured: input.featured,
    newArrival: input.newArrival,
    bestSeller: input.bestSeller,
    shippingClass: input.shippingClass,
  };
}

export async function createProduct(input: ProductWriteInput, variants: VariantWriteInput[]) {
  await assertSlugAvailable(input.slug);
  return db.product.create({
    data: {
      ...productData(input),
      variants: {
        create: variants.map((variant) => ({
          label: variant.label,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice ?? null,
          availableQuantity: variant.availableQuantity,
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold,
          backorderAllowed: variant.backorderAllowed,
          attributes: variant.attributes,
        })),
      },
    },
  });
}

export async function updateProduct(
  productId: string,
  input: ProductWriteInput,
  variants: VariantWriteInput[],
) {
  await assertSlugAvailable(input.slug, productId);
  const existing = await db.product.findUnique({
    where: { id: productId },
    include: { variants: { select: { id: true } } },
  });
  if (!existing) throw new Error("Product not found.");

  // Variant reconciliation: update-by-id / create-new / delete-removed.
  // A variant that has ever been ordered can't be hard-deleted (OrderItem
  // keeps a Restrict FK to it — order history must stay intact); surface
  // that as a friendly error rather than a raw constraint violation.
  const keptIds = new Set(variants.filter((v) => v.id).map((v) => v.id as string));
  const removedIds = existing.variants.map((v) => v.id).filter((id) => !keptIds.has(id));
  if (removedIds.length > 0) {
    const ordered = await db.orderItem.findFirst({
      where: { variantId: { in: removedIds } },
      select: { variantId: true },
    });
    if (ordered) {
      throw new Error(
        "A variant you removed has existing orders and can't be deleted — set its stock to 0 or archive the product instead.",
      );
    }
  }

  return db.$transaction(async (tx) => {
    if (removedIds.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });
    }
    for (const variant of variants) {
      const data = {
        label: variant.label,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? null,
        availableQuantity: variant.availableQuantity,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        backorderAllowed: variant.backorderAllowed,
        attributes: variant.attributes,
      };
      if (variant.id) {
        await tx.productVariant.update({ where: { id: variant.id }, data });
      } else {
        await tx.productVariant.create({ data: { ...data, productId } });
      }
    }
    return tx.product.update({ where: { id: productId }, data: productData(input) });
  });
}

/** Full image-list replacement (images have no inbound FKs, so this is safe). Order in the array = display position; first image should be PRIMARY. */
export async function replaceProductImages(productId: string, images: ImageWriteInput[]) {
  await db.$transaction([
    db.productImage.deleteMany({ where: { productId } }),
    db.productImage.createMany({
      data: images.map((image, index) => ({
        productId,
        url: image.url,
        alt: image.alt,
        kind: image.kind,
        position: index,
      })),
    }),
  ]);
}

export async function setProductStatus(productId: string, status: ProductStatus) {
  return db.product.update({ where: { id: productId }, data: { status } });
}

/** Quick homepage-merchandising toggle — the "Featured Products" rail renders featured+ACTIVE products. */
export async function setProductFeatured(productId: string, featured: boolean) {
  return db.product.update({ where: { id: productId }, data: { featured } });
}

export async function duplicateProduct(productId: string) {
  const source = await db.product.findUnique({
    where: { id: productId },
    include: { variants: true, images: true },
  });
  if (!source) throw new Error("Product not found.");

  // Find a free slug/sku by suffixing — copies always start as DRAFT and
  // unfeatured so a duplicate never leaks onto the storefront/homepage.
  let slug = `${source.slug}-copy`;
  for (let n = 2; await db.product.findUnique({ where: { slug } }); n++) {
    slug = `${source.slug}-copy-${n}`;
  }

  return db.product.create({
    data: {
      name: `${source.name} (Copy)`,
      slug,
      description: source.description,
      researchSummary: source.researchSummary,
      categoryId: source.categoryId,
      status: "DRAFT",
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      purity: source.purity,
      molecularWeight: source.molecularWeight,
      casNumber: source.casNumber,
      sequence: source.sequence,
      storageInstructions: source.storageInstructions,
      labTestingSummary: source.labTestingSummary,
      featured: false,
      newArrival: false,
      bestSeller: false,
      shippingClass: source.shippingClass,
      variants: {
        create: source.variants.map((variant, index) => ({
          label: variant.label,
          sku: `${variant.sku}-COPY${index === 0 ? "" : `-${index + 1}`}`,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          availableQuantity: variant.availableQuantity,
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold,
          backorderAllowed: variant.backorderAllowed,
          attributes: variant.attributes as Prisma.InputJsonValue,
        })),
      },
      images: {
        create: source.images.map((image) => ({
          url: image.url,
          alt: image.alt,
          kind: image.kind,
          position: image.position,
        })),
      },
    },
  });
}

/** Hard delete — only possible for never-purchased products (order history keeps a Restrict FK to variants). Purchased products should be archived instead. */
export async function deleteProduct(productId: string) {
  const ordered = await db.orderItem.findFirst({
    where: { variant: { productId } },
    select: { id: true },
  });
  if (ordered) {
    throw new Error(
      "This product has been ordered and can't be deleted — archive it instead to remove it from the storefront while keeping order history intact.",
    );
  }
  await db.product.delete({ where: { id: productId } });
}
