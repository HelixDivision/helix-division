"use client";

import { useState } from "react";

type CheckoutStep = "address" | "review" | "payment";

/**
 * Checkout step state + active payment provider selection. The actual order
 * creation / payment-request calls go through Server Actions in
 * server/actions/checkout.ts once built (Phase 2) — this hook only owns
 * client-side wizard state.
 */
export function useCheckout() {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  return { step, setStep, selectedProviderId, setSelectedProviderId };
}
