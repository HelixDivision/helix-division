-- Category homepage presentation fields (image, imageAlt, featured, sortOrder).
-- Additive + non-destructive: new nullable columns and defaulted flags.
ALTER TABLE "categories" ADD COLUMN     "image" TEXT,
ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Keep the existing homepage populated: feature all current categories so the
-- "Shop by Category" grid (now featured-only) is not empty right after deploy.
-- New categories default to featured = false and are opted in from the Admin.
UPDATE "categories" SET "featured" = true;

-- Preserve Research Peptides' existing homepage art (was a hardcoded path).
UPDATE "categories"
SET "image" = '/branding/source/mockup-product-grid.jpeg',
    "imageAlt" = 'Research peptides'
WHERE "slug" = 'research-peptides' AND "image" IS NULL;
