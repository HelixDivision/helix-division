"use server";

import { revalidatePath } from "next/cache";

import { stockAdjustmentSchema } from "@/lib/validations/admin";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import { adjustStock } from "@/server/services/admin-inventory";

/** Admin inventory actions (Phase 9) — manual stock corrections. Automatic movements (reserve/release/deduct) happen inside orders.ts's flows, never through an action. */

export async function adjustStockAction(variantId: string, input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return { success: false, error: "Not authorized." };

  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    await adjustStock(variantId, parsed.data);
    // Stock changes flip storefront availability badges/buttons, not just admin tables.
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
