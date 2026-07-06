import { Headphones, Mail, ShieldCheck, Truck } from "lucide-react";

import { FeatureItem } from "@/components/home/FeatureItem";
import { StaggerReveal } from "@/components/motion/StaggerReveal";

const operationalTrust = [
  { icon: Mail, label: "Discreet Packaging", description: "Plain & secure" },
  { icon: Truck, label: "Fast & Reliable", description: "Global shipping" },
  { icon: ShieldCheck, label: "Secure Payments", description: "Trusted & encrypted" },
  { icon: Headphones, label: "Dedicated Support", description: "Here to help" },
];

/** Bottom operational trust bar — sits directly below the Research/Manufacturing split band in the approved mockup. */
export function OperationalTrustStrip() {
  return (
    <section className="border-border bg-background-raised border-b">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-8 sm:px-8 sm:py-10">
        <StaggerReveal className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {operationalTrust.map((item) => (
            <FeatureItem key={item.label} {...item} />
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
