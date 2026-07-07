import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description:
    "How Helix Division ships research materials — discreet packaging, free shipping over $200, tracking, and delivery expectations.",
};

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping & Delivery"
      updated="July 2026"
      intro="We ship research materials discreetly and reliably to qualified researchers worldwide."
      sections={[
        {
          heading: "Discreet Packaging",
          paragraphs: [
            "All orders ship in plain, unbranded packaging with no reference to the contents on the exterior. Your privacy is a priority at every step.",
          ],
        },
        {
          heading: "Rates & Free Shipping",
          paragraphs: [
            "Orders over $200 qualify for free discreet shipping. Orders below the threshold are charged a flat shipping rate calculated and shown at checkout before you pay.",
          ],
        },
        {
          heading: "Processing & Tracking",
          paragraphs: [
            "Orders are typically processed within 1–2 business days after payment is confirmed. Once dispatched, a tracking number is issued so you can follow your shipment to delivery.",
            "You can view order status and tracking any time from your account dashboard.",
          ],
        },
        {
          heading: "International Orders",
          paragraphs: [
            "We ship to research customers worldwide. Some materials may be restricted in certain regions; any applicable restriction is applied automatically at checkout. The recipient is responsible for ensuring import compliance in their jurisdiction.",
          ],
        },
      ]}
    />
  );
}
