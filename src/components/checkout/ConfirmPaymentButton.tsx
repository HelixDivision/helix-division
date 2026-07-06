"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmPaymentSentAction } from "@/server/actions/checkout";

/** The Wise/Manual "I've sent it" confirmation step — moves the order to PAYMENT_SUBMITTED and continues to the confirmation page. */
export function ConfirmPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    const result = await confirmPaymentSentAction(orderId);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(`/checkout/confirmation/${orderId}`);
  }

  return (
    <Button size="lg" className="w-fit" onClick={handleConfirm} disabled={isSubmitting}>
      {isSubmitting ? "Confirming..." : "I've Sent the Transfer"}
    </Button>
  );
}
