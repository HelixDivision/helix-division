"use server";

import { revalidatePath } from "next/cache";

import { adminCategorySchema } from "@/lib/validations/admin";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import { createCategory, deleteCategory, updateCategory } from "@/server/services/admin-categories";

/** Admin category actions (Phase 9) — same shape as admin-products.ts: role re-check → validate → delegate → revalidate the tree (category edits affect /shop navigation and category pages). */

const NOT_AUTHORIZED: ActionResult = { success: false, error: "Not authorized." };

export async function saveCategoryAction(
  categoryId: string | null,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = adminCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    if (categoryId) {
      await updateCategory(categoryId, parsed.data);
    } else {
      await createCategory(parsed.data);
    }
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;
  try {
    await deleteCategory(categoryId);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
