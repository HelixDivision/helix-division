"use server";

import { revalidatePath } from "next/cache";

import { orderTransitionSchema, shipOrderSchema } from "@/lib/validations/admin";
import {
  errorMessage,
  fieldErrorsFrom,
  requireAdmin,
  type ActionResult,
} from "@/server/actions/shared";
import { shipOrder, updateOrderStatusAsAdmin } from "@/server/services/orders";

/**
 * Admin order actions (Phase 9). Both delegate to orders.ts's admin
 * orchestration — the transition whitelist, payment confirmation, and the
 * inventory side effects (reserve/deduct on confirm, release on cancel) all
 * live there, never here. Revalidates the whole tree: a cancellation
 * releases stock, which flips storefront availability.
 */

const NOT_AUTHORIZED: ActionResult = { success: false, error: "Not authorized." };

export async function updateOrderStatusAction(
  orderId: string,
  input: unknown,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = orderTransitionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Choose a valid status." };
  }

  try {
    await updateOrderStatusAsAdmin(orderId, parsed.data.status);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}

export async function shipOrderAction(orderId: string, input: unknown): Promise<ActionResult> {
  if (!(await requireAdmin())) return NOT_AUTHORIZED;

  const parsed = shipOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  try {
    await shipOrder(orderId, {
      trackingNumber: parsed.data.trackingNumber,
      trackingCarrier: parsed.data.trackingCarrier ?? undefined,
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
