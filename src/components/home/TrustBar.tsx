import { Award, Dna, FlaskConical, Globe } from "lucide-react";

import { FeatureItem } from "@/components/home/FeatureItem";
import { FadeIn } from "@/components/motion/FadeIn";

// Icon set matches public/branding/sections/section-1-trust-research.png exactly.
const trustItems = [
  { icon: FlaskConical, label: "Lab Verified", description: "Quality assured" },
  { icon: Dna, label: "Research Driven", description: "Science first" },
  { icon: Globe, label: "Elite Standards", description: "Global quality" },
  { icon: Award, label: "Professional Grade", description: "Results matter" },
];

/** "Trusted by researchers..." trust bar — matches the approved mockup, positioned right after Hero per Phase 3 section order. */
export function TrustBar() {
  return (
    <section className="bg-background-raised border-border border-b">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-10 sm:px-8 sm:py-12">
        <FadeIn>
          <p className="font-heading text-foreground-primary text-center text-sm tracking-[0.15em] uppercase">
            Trusted by Researchers. Chosen by Performers.
          </p>
          <div className="border-border mt-8 grid grid-cols-2 gap-8 rounded-lg border p-6 sm:grid-cols-4 sm:gap-4">
            {trustItems.map((item) => (
              <FeatureItem key={item.label} {...item} />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
