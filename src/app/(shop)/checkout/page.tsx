import type { Metadata } from "next";

import { CheckoutWizard } from "@/components/checkout/CheckoutWizard";
import { getEnabledProviders } from "@/lib/payments/provider";
import { getPaymentProviderLabel } from "@/lib/payments/provider-labels";

export const metadata: Metadata = {
  title: "Checkout | Helix Division",
};

/**
 * Server Component so getEnabledProviders() (which pulls in the adapter
 * files — some of which read server-only env vars like WISE_IBAN) never
 * ends up in the client bundle. Only a plain {id,label} list crosses into
 * the client CheckoutWizard.
 */
export default function CheckoutPage() {
  const providers = getEnabledProviders().map((provider) => ({
    id: provider.id,
    label: getPaymentProviderLabel(provider.id),
  }));

  return (
    <div className="mx-auto max-w-(--breakpoint-lg) px-6 py-12 sm:px-8">
      <CheckoutWizard providers={providers} />
    </div>
  );
}
