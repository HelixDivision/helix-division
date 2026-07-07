import {
  Award,
  ChevronRight,
  FileCheck2,
  FlaskConical,
  Lock,
  Package,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CrestShowcase } from "@/components/marketing/CrestShowcase";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { ProcessTimeline, type ProcessStep } from "@/components/marketing/ProcessTimeline";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Helix Division is a veteran-owned supplier of high-purity peptide research materials — advancing research and accelerating discovery for the scientific community.",
};

const processSteps: ProcessStep[] = [
  {
    icon: Search,
    title: "Sourcing",
    description:
      "We partner with trusted manufacturers that meet our rigorous standards for raw materials.",
  },
  {
    icon: FlaskConical,
    title: "Testing",
    description:
      "Each batch is subjected to extensive analytical testing for identity, purity, and potency.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    description:
      "Certificates of Analysis are reviewed and verified to ensure full compliance with specifications.",
  },
  {
    icon: Package,
    title: "Packaging",
    description:
      "Materials are securely packaged to maintain stability, integrity, and chain of custody.",
  },
  {
    icon: Truck,
    title: "Delivery",
    description: "Orders are shipped discreetly and reliably to researchers worldwide.",
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    description: "High-purity peptides manufactured and tested to the highest industry standards.",
  },
  {
    icon: FlaskConical,
    title: "Research Only",
    description: "Our products are intended strictly for laboratory research purposes.",
  },
  {
    icon: FileCheck2,
    title: "Transparency",
    description: "Comprehensive Certificates of Analysis with every batch we provide.",
  },
  {
    icon: Lock,
    title: "Discreet & Secure",
    description: "Confidential ordering and shipping with secure payment options.",
  },
  {
    icon: Users,
    title: "Researcher Focused",
    description: "Dedicated support for the scientific community and research institutions.",
  },
  {
    icon: Award,
    title: "Veteran Owned",
    description: "Built on values of honor, discipline, and a commitment to excellence.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <MarketingHero
        eyebrow="Advancing Research. Accelerating Discovery."
        title="About Us"
        subtitle="Precision. Performance. Purpose."
        paragraphs={[
          "Helix Division provides high-purity peptide research materials to support scientific innovation and breakthroughs in life-science research.",
          "Our mission is to empower researchers with reliable products, unmatched quality, and a relentless commitment to scientific progress.",
        ]}
        media={<CrestShowcase />}
      />

      {/* Veteran owned / mission focused */}
      <section className="border-border border-b">
        <div className="mx-auto grid max-w-(--breakpoint-xl) items-center gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
          <FadeIn className="order-2 lg:order-1">
            <div className="border-border bg-background-raised mb-6 inline-flex flex-col items-center gap-1 rounded-lg border px-6 py-4">
              <Award className="text-accent-gunmetal size-7" strokeWidth={1.5} />
              <span className="font-heading text-foreground-primary text-xs tracking-[0.2em] uppercase">
                Veteran Owned
              </span>
              <span className="text-foreground-muted text-[0.6rem] tracking-[0.2em] uppercase">
                Business
              </span>
              <div className="text-accent-crimson mt-1 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-2.5 fill-current" />
                ))}
              </div>
            </div>
            <h2 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase sm:text-3xl">
              <span className="text-accent-crimson">Veteran Owned.</span>
              <br />
              Mission Focused.
            </h2>
            <span className="bg-accent-crimson mt-4 block h-0.5 w-12" />
            <p className="text-foreground-muted mt-5 max-w-lg text-sm leading-relaxed">
              Founded and operated by a U.S. Veteran, Helix Division upholds the values of
              discipline, integrity, and excellence in everything we do. We apply the same
              mission-driven mindset from military service to support researchers and advance
              science through premium peptide research materials.
            </p>
          </FadeIn>

          <FadeIn
            delay={0.1}
            className="border-border relative order-1 aspect-4/3 overflow-hidden rounded-xl border lg:order-2"
          >
            <Image
              src="/branding/photography/spec-ops-team-walking.png"
              alt="Helix Division — veteran-owned, mission-focused operations"
              fill
              className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="from-background-base/70 absolute inset-0 bg-gradient-to-r to-transparent" />
          </FadeIn>
        </div>
      </section>

      {/* Our process */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
          <SectionHeading
            title="Our Process"
            subtitle="Quality by design. Trusted by researchers."
          />
          <div className="mt-14">
            <ProcessTimeline steps={processSteps} />
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
          <SectionHeading
            title="Why Choose Helix Division?"
            subtitle="Research deserves reliability."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason) => (
              <FeatureCard key={reason.title} {...reason} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(179,18,27,0.12),transparent_55%)]"
        />
        <div className="relative mx-auto flex max-w-(--breakpoint-xl) flex-col items-center gap-6 px-6 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase sm:text-3xl">
            Built for Research. Driven by Purpose.
          </h2>
          <p className="text-foreground-muted max-w-xl text-sm leading-relaxed">
            Join researchers around the world who trust Helix Division for premium peptide research
            materials.
          </p>
          <Button variant="outline" size="lg" render={<Link href="/shop" />} nativeButton={false}>
            Browse the Catalog
            <ChevronRight className="transition-transform duration-250 group-hover/button:translate-x-0.5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
