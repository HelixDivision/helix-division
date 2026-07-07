"use client";

import { Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { shipOrderAction, updateOrderStatusAction } from "@/server/actions/admin-orders";

/**
 * Admin order lifecycle controls (Phase 9). Renders one button per legal
 * transition (the whitelist lives in orders.ts and is passed down from the
 * server page — this component invents nothing), with confirmation for the
 * destructive ones and a tracking-number dialog for shipping. All side
 * effects (payment confirmation, inventory reserve/deduct/release) happen
 * inside orders.ts, not here.
 */

const TRANSITION_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: "Mark Awaiting Payment",
  PAYMENT_SUBMITTED: "Mark Payment Submitted",
  PAYMENT_CONFIRMED: "Confirm Payment",
  PROCESSING: "Start Processing",
  DELIVERED: "Mark Delivered",
  CANCELLED: "Cancel Order",
  REFUNDED: "Mark Refunded",
};

const DESTRUCTIVE = new Set(["CANCELLED", "REFUNDED"]);

const CONFIRM_COPY: Record<string, string> = {
  CANCELLED:
    "Cancel this order? Reserved (not yet deducted) stock goes back on sale automatically. Already-deducted stock is not restocked.",
  REFUNDED:
    "Mark this order refunded? Stock is not restocked automatically — adjust inventory manually if the items are resellable.",
};

interface ShipFormValues {
  trackingNumber: string;
  trackingCarrier: string;
}

export function OrderStatusControls({
  orderId,
  status,
  allowedTransitions,
}: {
  orderId: string;
  status: string;
  allowedTransitions: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);

  const shipForm = useForm<ShipFormValues>({
    defaultValues: { trackingNumber: "", trackingCarrier: "" },
  });

  async function applyTransition(nextStatus: string) {
    setBusy(true);
    const result = await updateOrderStatusAction(orderId, { status: nextStatus });
    setBusy(false);
    setConfirming(null);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(`Order updated: ${TRANSITION_LABELS[nextStatus] ?? nextStatus}.`);
    router.refresh();
  }

  async function onShip(values: ShipFormValues) {
    setBusy(true);
    const result = await shipOrderAction(orderId, values);
    setBusy(false);
    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) shipForm.setError(field as keyof ShipFormValues, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success("Order marked shipped — shipment notification sent.");
    setShipping(false);
    router.refresh();
  }

  if (allowedTransitions.length === 0 && status !== "PROCESSING") {
    return (
      <p className="text-foreground-muted text-sm">
        This order is in a terminal state — no further transitions.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PROCESSING" && (
        <Button size="sm" onClick={() => setShipping(true)} disabled={busy}>
          <Truck className="size-4" /> Mark Shipped
        </Button>
      )}
      {allowedTransitions.map((next) =>
        DESTRUCTIVE.has(next) ? (
          <Button
            key={next}
            size="sm"
            variant="outline"
            className="text-state-danger"
            disabled={busy}
            onClick={() => setConfirming(next)}
          >
            {TRANSITION_LABELS[next] ?? next}
          </Button>
        ) : (
          <Button
            key={next}
            size="sm"
            variant={next === "PAYMENT_CONFIRMED" ? "default" : "outline"}
            disabled={busy}
            onClick={() => applyTransition(next)}
          >
            {TRANSITION_LABELS[next] ?? next}
          </Button>
        ),
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirming ? TRANSITION_LABELS[confirming] : ""}</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            {confirming ? CONFIRM_COPY[confirming] : ""}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={busy}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => confirming && applyTransition(confirming)}
            >
              {busy ? "Applying..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipping} onOpenChange={setShipping}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Shipped</DialogTitle>
          </DialogHeader>
          <FormProvider {...shipForm}>
            <form onSubmit={shipForm.handleSubmit(onShip)} className="flex flex-col gap-4">
              <TextField name="trackingNumber" label="Tracking number" />
              <TextField
                name="trackingCarrier"
                label="Carrier (optional)"
                placeholder="e.g. UPS, FedEx, DHL"
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Confirm Shipment"}
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
