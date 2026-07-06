import { AlertTriangle, Landmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmPaymentButton } from "@/components/checkout/ConfirmPaymentButton";
import { Button } from "@/components/ui/button";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";
import type { WiseInstructions } from "@/lib/payments/types";
import { getOrder } from "@/server/services/orders";

export const metadata: Metadata = {
  title: "Payment | Helix Division",
};

interface PaymentPageProps {
  params: Promise<{ orderId: string }>;
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function WiseInstructionsPanel({ instructions }: { instructions: WiseInstructions }) {
  const rows: { label: string; value: string }[] = [
    { label: "Account Holder", value: instructions.accountHolder },
    { label: "IBAN", value: instructions.iban },
    { label: "BIC", value: instructions.bic },
    { label: "Reference", value: instructions.referenceCode },
    { label: "Amount", value: `${instructions.amount} ${instructions.currency}` },
  ];

  return (
    <dl className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="border-border flex justify-between border-b py-2">
          <dt className="text-foreground-muted">{row.label}</dt>
          <dd className="text-foreground-primary font-medium">{row.value}</dd>
        </div>
      ))}
      <p className="text-foreground-muted mt-2 text-xs">
        Include the reference code above in your transfer so we can match your payment.
      </p>
    </dl>
  );
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-(--breakpoint-md) px-6 py-12 sm:px-8">
      <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
        Payment
      </h1>
      <p className="text-foreground-muted mt-2 text-sm">
        Order {order.orderNumber} — {formatPrice(order.total, order.currency)}
      </p>

      {!order.payment ? (
        <div className="border-border mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <AlertTriangle className="text-state-warning size-8" strokeWidth={1.5} />
          <p className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            This Payment Method Is Temporarily Unavailable
          </p>
          <p className="text-foreground-muted max-w-sm text-sm">
            We couldn&apos;t generate payment instructions for the selected method. Please choose a
            different payment method to complete your order — your order has been saved.
          </p>
          <Button variant="outline" render={<Link href="/checkout" />} nativeButton={false}>
            Choose Another Method
          </Button>
        </div>
      ) : (
        <div className="border-border mt-8 flex flex-col gap-6 rounded-lg border p-6">
          <div className="flex items-center gap-2">
            <Landmark className="text-accent-gunmetal size-5" strokeWidth={1.5} />
            <span className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
              {getPaymentProviderLabel(order.payment.method)}
            </span>
          </div>

          {order.payment.method === "wise" && (
            <WiseInstructionsPanel instructions={order.payment.instructions as WiseInstructions} />
          )}

          {order.payment.method === "manual" && (
            <p className="text-foreground-muted text-sm">
              {(order.payment.instructions as { note: string }).note}
            </p>
          )}

          <ConfirmPaymentButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
