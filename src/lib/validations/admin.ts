import { z } from "zod";

// Admin-input schemas (Phase 9). These are the transforming, strict versions
// the Server Actions parse with — client admin forms keep their fields as
// plain strings/booleans and validate required-ness locally (same pattern as
// ResetPasswordForm's local formSchema), while the action re-parses with
// these before anything touches a service. Client-safe: no Prisma/Auth
// imports.

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug must be lowercase letters/numbers separated by single hyphens",
  );

/** "" → null, otherwise a non-negative number — for optional money fields coming from text inputs. */
const nullableMoney = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number({ error: "Enter a valid amount" }).min(0, "Must be 0 or more").nullable(),
);

// Preprocess guards the empty string — Number("") is 0, and a blank stock
// field silently becoming "0 in stock" is exactly the kind of quiet data bug
// admin tooling must not have.
const countField = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce
    .number({ error: "Enter a whole number" })
    .int("Enter a whole number")
    .min(0, "Must be 0 or more"),
);

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : null));

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const SHIPPING_CLASSES = ["STANDARD", "COLD_CHAIN", "HAZMAT"] as const;
export const IMAGE_KINDS = [
  "PRIMARY",
  "GALLERY",
  "LABEL_CLOSEUP",
  "PACKAGING",
  "LIFESTYLE",
  "COA_PREVIEW",
] as const;

export const adminVariantSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  sku: z.string().min(1, "SKU is required"),
  price: nullableMoney,
  compareAtPrice: nullableMoney,
  availableQuantity: countField,
  stock: countField,
  lowStockThreshold: countField,
  backorderAllowed: z.boolean(),
  /** Category-specific attribute values, keyed per Category.attributeSchema. */
  attributes: z.record(z.string(), z.string()).default({}),
});

export const adminProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  description: z.string().min(1, "Description is required"),
  researchSummary: optionalText,
  categoryId: z.string().min(1, "Choose a category"),
  status: z.enum(PRODUCT_STATUSES),
  seoTitle: optionalText,
  seoDescription: optionalText,
  purity: optionalText,
  molecularWeight: optionalText,
  casNumber: optionalText,
  sequence: optionalText,
  storageInstructions: optionalText,
  featured: z.boolean(),
  newArrival: z.boolean(),
  bestSeller: z.boolean(),
  shippingClass: z.enum(SHIPPING_CLASSES),
  variants: z.array(adminVariantSchema).min(1, "A product needs at least one variant"),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export const adminProductImagesSchema = z.object({
  images: z.array(
    z.object({
      url: z.string().min(1, "Image URL/path is required"),
      alt: z.string().min(1, "Alt text is required"),
      kind: z.enum(IMAGE_KINDS),
    }),
  ),
});

export const adminCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  description: optionalText,
  seoTitle: optionalText,
  seoDescription: optionalText,
  // Homepage presentation. `image` is a Media Library URL ("" → null).
  image: optionalText,
  imageAlt: optionalText,
  featured: z.coerce.boolean().default(false),
  sortOrder: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 0 : value),
    z.coerce.number({ error: "Enter a whole number" }).int("Enter a whole number").min(0),
  ),
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export const stockAdjustmentSchema = z.object({
  availableQuantity: countField,
  stock: countField,
  lowStockThreshold: countField,
  backorderAllowed: z.boolean(),
});

export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const orderTransitionSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const shipOrderSchema = z.object({
  trackingNumber: z.string().min(3, "Enter the tracking number"),
  trackingCarrier: optionalText,
});
