"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { getEnabledProviders } from "@/lib/payments/provider";
import { checkoutInformationSchema } from "@/lib/validations/checkout";
import { errorMessage, fieldErrorsFrom, type ActionResult } from "@/server/actions/shared";
import { recordAnalyticsEvent } from "@/server/services/analytics-capture";
import {
  confirmPaymentSubmitted,
  createOrder,
  createPaymentForOrder,
} from "@/server/services/orders";
import type { CartLine } from "@/store/cart-store";

const createOrderActionSchema = checkoutInformationSchema.extend({
  providerId: z.string().min(1, "Choose a payment method"),
});

/** Provider ids are only known at runtime (env-driven) — built lazily against the current registry, not a static literal union. */
function paymentMethodSchema() {
  const enabledIds = getEnabledProviders().map((p) => p.id);
  return z.enum(enabledIds as [string, ...string[]], { error: "Choose a payment method" });
}

export interface CreateOrderActionResult extends ActionResult {
  orderId?: string;
  paymentError?: string;
}

/**
 * The only entry point the Checkout Review step calls. Validates with the
 * zod schemas in src/lib/validations/checkout.ts, then delegates entirely to
 * src/server/services/orders.ts — nothing here touches the repository or the
 * payment registry directly.
 */
export async function createOrderAction(
  input: unknown,
  cartLines: CartLine[],
): Promise<CreateOrderActionResult> {
  const parsed = createOrderActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error.issues),
    };
  }

  const providerCheck = paymentMethodSchema().safeParse(parsed.data.providerId);
  if (!providerCheck.success) {
    return { success: false, error: "Choose a valid payment method." };
  }

  if (cartLines.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  // Authoritative order ownership (Phase 8): if the buyer is authenticated,
  // bind the order to their user id server-side — never trusted from client
  // input, and never inferred by matching email for guests. A guest checkout
  // (no session) leaves userId null.
  const session = await auth();

  let orderId: string;
  try {
    const order = await createOrder({
      userId: session?.user?.id ?? null,
      email: parsed.data.email,
      cartLines,
      shippingAddress: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        city: parsed.data.city,
        region: parsed.data.region,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        phone: parsed.data.phone,
      },
      researchAcknowledged: parsed.data.researchAcknowledged,
      providerId: parsed.data.providerId,
    });
    orderId = order.id;
    // First-party PURCHASE event (Phase 9.5) — closes the analytics funnel and
    // ties revenue to the visitor cookie. Best-effort; never fails the order.
    await recordAnalyticsEvent({ type: "PURCHASE", value: order.total, orderId: order.id });
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  // Payment-request creation is allowed to fail here (e.g. Bitcoin/Stripe/
  // Authorize are scaffolded, not implemented) — the order still exists.
  // The payment page detects a missing `payment` and shows a graceful
  // "choose another method" state instead of crashing.
  try {
    await createPaymentForOrder(orderId, parsed.data.providerId);
  } catch (error) {
    return { success: true, orderId, paymentError: errorMessage(error) };
  }

  return { success: true, orderId };
}

export async function confirmPaymentSentAction(orderId: string): Promise<ActionResult> {
  try {
    await confirmPaymentSubmitted(orderId);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
