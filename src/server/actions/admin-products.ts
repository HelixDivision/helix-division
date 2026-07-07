"use server";

import { revalidatePath } from "next/cache";

import { adminProductImagesSchema, adminProductSchema } from "@/lib/validations/admin";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import {
  createProduct,
  deleteProduct,
  deleteProductCoa,
  duplicateProduct,
  replaceProductImages,
  setProductCoa,
  setProductFeatured,
  setProductStatus,
  updateProduct,
} from "@/server/services/admin-products";

/**
 * Admin product actions (Phase 9). Every action re-checks the ADMIN role via
 * requireAdmin() (never trusts proxy.ts alone), validates with
 * lib/validations/admin.ts, and delegates to admin-products.ts. Mutations
 * revalidate the whole route tree — catalog edits ripple into the homepage
 * rails, /shop listings, and PDPs, not just admin pages.
 */

const NOT_AUTHORIZED: ActionResult = { success: false, error: "Not authorized." };

function revalidateCatalog() {
  revalidatePath("/", "layout");
}

export interface SaveProductResult extends ActionResult {
  productId?: string;
}

export async function saveProductAction(
  productId: string | null,
  input: unknown,
): Promise<SaveProductResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const { variants, ...product } = parsed.data;
  try {
    const saved = productId
      ? await updateProduct(productId, product, variants)
      : await createProduct(product, variants);
    revalidateCatalog();
    return { success: true, productId: saved.id };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function replaceProductImagesAction(
  productId: string,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = adminProductImagesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    await replaceProductImages(productId, parsed.data.images);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function setProductStatusAction(
  productId: string,
  status: "DRAFT" | "ACTIVE" | "ARCHIVED",
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await setProductStatus(productId, status);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function setProductFeaturedAction(
  productId: string,
  featured: boolean,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await setProductFeatured(productId, featured);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function duplicateProductAction(productId: string): Promise<SaveProductResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    const copy = await duplicateProduct(productId);
    revalidateCatalog();
    return { success: true, productId: copy.id };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function setProductCoaAction(
  productId: string,
  url: string,
  label: string,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await setProductCoa(productId, url, label);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteProductCoaAction(productId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteProductCoa(productId);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteProduct(productId);
    revalidateCatalog();
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
