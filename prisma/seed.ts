import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { categories, products } from "../src/lib/data/catalog-data";
import type { DocumentKind, ImageKind } from "../src/types/catalog";

// Seeded Super Admin (Phase 9.5). A fresh database bootstraps with one ADMIN
// account so the Admin Dashboard is reachable without manual promotion. The
// dev password is intentionally simple and documented (README); change it in
// any real environment. Upserted by email, so re-seeding never duplicates it.
const SUPER_ADMIN_EMAIL = "support@helixdivision.com";
const SUPER_ADMIN_PASSWORD = "Helix!Admin2026#";

/**
 * One-time database bootstrap — populates Postgres from the static catalog
 * data module that powered the app before Real Prisma Integration. This file
 * is the ONLY remaining consumer of src/lib/data/catalog-data.ts (see that
 * file's header comment): once this has run successfully, the database is
 * the single source of truth for the catalog, and lib/catalog.ts queries it
 * directly rather than reading the static arrays. Re-running this script is
 * safe — categories/products are upserted by slug, and each product's
 * variants/images/documents are replaced (not appended) on every run.
 *
 * Uses its own PrismaClient (rather than importing src/lib/db.ts) because
 * this script runs standalone via `tsx`, outside Next.js's module resolver,
 * so the `@/` path alias isn't available here — relative imports only.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const IMAGE_KIND_MAP: Record<
  ImageKind,
  "PRIMARY" | "GALLERY" | "LABEL_CLOSEUP" | "PACKAGING" | "LIFESTYLE" | "COA_PREVIEW"
> = {
  primary: "PRIMARY",
  gallery: "GALLERY",
  "label-closeup": "LABEL_CLOSEUP",
  packaging: "PACKAGING",
  lifestyle: "LIFESTYLE",
  "coa-preview": "COA_PREVIEW",
};

const DOCUMENT_KIND_MAP: Record<DocumentKind, "COA" | "LAB_REPORT" | "VIDEO" | "OTHER"> = {
  coa: "COA",
  "lab-report": "LAB_REPORT",
  video: "VIDEO",
  other: "OTHER",
};

async function main() {
  console.log(`Seeding ${categories.length} categories and ${products.length} products...`);

  const categoryIdBySlug = new Map<string, string>();

  for (const category of categories) {
    const row = await db.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        attributeSchema: category.attributeSchema,
        // Homepage presentation — set on create only so re-seeding never wipes
        // an admin's homepage curation (featured/order/image are managed in the
        // Admin category form after bootstrap).
        image: category.image ?? null,
        imageAlt: category.imageAlt ?? null,
        featured: category.featured,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        description: category.description,
        attributeSchema: category.attributeSchema,
      },
    });
    categoryIdBySlug.set(category.slug, row.id);
  }

  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Seed data references unknown category slug "${product.categorySlug}" for product "${product.slug}"`,
      );
    }

    const productData = {
      name: product.name,
      description: product.description,
      researchSummary: product.researchSummary,
      categoryId,
      status: product.status,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      purity: product.purity,
      molecularWeight: product.molecularWeight,
      casNumber: product.casNumber,
      sequence: product.sequence,
      storageInstructions: product.storageInstructions,
      labTestingSummary: product.labTestingSummary,
      featured: product.featured,
      newArrival: product.newArrival,
      bestSeller: product.bestSeller,
      shippingClass: product.shippingClass,
    };

    const productRow = await db.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...productData },
      update: productData,
    });

    // Replace child rows rather than appending, so re-running the seed never
    // accumulates duplicates.
    await db.productVariant.deleteMany({ where: { productId: productRow.id } });
    await db.productImage.deleteMany({ where: { productId: productRow.id } });
    await db.productDocument.deleteMany({ where: { productId: productRow.id } });

    for (const variant of product.variants) {
      await db.productVariant.create({
        data: {
          productId: productRow.id,
          label: variant.label,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stock: variant.availableQuantity,
          attributes: variant.attributes,
          availableQuantity: variant.availableQuantity,
          lowStockThreshold: variant.lowStockThreshold,
          backorderAllowed: variant.backorderAllowed,
          restockDate: variant.restockDate ? new Date(variant.restockDate) : null,
        },
      });
    }

    for (const image of product.images) {
      await db.productImage.create({
        data: {
          productId: productRow.id,
          url: image.url,
          alt: image.alt,
          position: image.position,
          kind: IMAGE_KIND_MAP[image.kind],
        },
      });
    }

    for (const doc of product.documents ?? []) {
      await db.productDocument.create({
        data: {
          productId: productRow.id,
          kind: DOCUMENT_KIND_MAP[doc.kind],
          label: doc.label,
          url: doc.url,
        },
      });
    }
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  await db.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: "Helix Division Admin",
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
      researchAcknowledgedAt: new Date(),
    },
    update: { role: "ADMIN" },
  });
  console.log(`Seeded Super Admin: ${SUPER_ADMIN_EMAIL}`);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
