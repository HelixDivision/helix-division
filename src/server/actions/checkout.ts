"use server";

import { z } from "zod";

import { getEnabledProviders } from "@/lib/payments/provider";
import { checkoutInformationSchema } from "@/lib/validations/checkout";
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

export interface CreateOrderActionResult {
  success: boolean;
  orderId?: string;
  error?: string;
  paymentError?: string;
  fieldErrors?: Partial<Record<string, string>>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
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
    const fieldErrors: Partial<Record<string, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const providerCheck = paymentMethodSchema().safeParse(parsed.data.providerId);
  if (!providerCheck.success) {
    return { success: false, error: "Choose a valid payment method." };
  }

  if (cartLines.length === 0) {
    return { success: false, error: "Your cart is empty." };
  }

  let orderId: string;
  try {
    const order = await createOrder({
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

export interface ConfirmPaymentSentResult {
  success: boolean;
  error?: string;
}

export async function confirmPaymentSentAction(orderId: string): Promise<ConfirmPaymentSentResult> {
  try {
    await confirmPaymentSubmitted(orderId);
    return { success: true };
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }
}
