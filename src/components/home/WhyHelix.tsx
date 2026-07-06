import {
  BadgeCheck,
  ChevronRight,
  FlaskConical,
  Globe,
  Package,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";
import { StaggerReveal } from "@/components/motion/StaggerReveal";
import { Button } from "@/components/ui/button";

// Icon set matches public/branding/sections/section-2-why-choose.png.
const reasons = [
  { icon: FlaskConical, label: "Lab Tested", description: "For purity & potency" },
  { icon: BadgeCheck, label: "Premium Quality", description: "Pharmaceutical grade" },
  { icon: Sparkles, label: "High Purity", description: "99%+ purity guaranteed" },
  { icon: Package, label: "Discreet Shipping", description: "Secure & confidential" },
  { icon: ShieldAlert, label: "Research Only", description: "Not for human consumption" },
  { icon: Globe, label: "Global Standard", description: "Trusted by professionals" },
];

/** "Why Choose Helix Division" — matches the approved mockup's copy, icon grid, and imagery. */
export function WhyHelix() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto grid max-w-(--breakpoint-xl) gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1.4fr_0.8fr] lg:items-center">
        <FadeIn>
          <h2 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase sm:text-3xl">
            Why Choose
            <br />
            Helix Division
          </h2>
          <p className="text-foreground-muted mt-4 max-w-xs text-sm">
            We don&apos;t follow trends. We follow science. Every product is developed with
            precision, tested for purity, and built for real-world results.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            render={<Link href="/quality" />}
            nativeButton={false}
          >
            Our Standards
            <ChevronRight className="transition-transform duration-250 group-hover/button:translate-x-0.5" />
          </Button>
        </FadeIn>

        <StaggerReveal className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <div key={reason.label} className="flex items-start gap-3">
                <span className="border-border flex size-9 shrink-0 items-center justify-center rounded-full border">
                  <Icon className="text-accent-gunmetal size-4" strokeWidth={1.5} />
                </span>
                <div className="flex flex-col">
                  <span className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
                    {reason.label}
                  </span>
                  <span className="text-foreground-muted text-xs">{reason.description}</span>
                </div>
              </div>
            );
          })}
        </StaggerReveal>

        {/*
          "Operator 2" portrait from HOMEPAGE RESOURSES/IMAGE ASSETS TO USE —
          a full atmospheric night-vision/city-smoke composition (unlike the
          prior cutout, this one already has its own background baked in),
          so it's treated like ResearchQuality/ManufacturingStandards:
          object-cover fill rather than a floating contain + watermark.
        */}
        <FadeIn
          delay={0.1}
          className="border-border bg-background-raised relative hidden aspect-square overflow-hidden rounded-lg border lg:block"
        >
          <Image
            src="/branding/photography/operator-2.png"
            alt="Helix Division field operator"
            fill
            className="object-cover object-[65%_40%] transition-transform duration-500 ease-out hover:scale-105"
            sizes="20vw"
          />
        </FadeIn>
      </div>
    </section>
  );
}
