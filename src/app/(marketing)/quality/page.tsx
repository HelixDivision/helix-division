import {
  Activity,
  Atom,
  AudioWaveform,
  ClipboardCheck,
  Droplet,
  FileCheck2,
  FlaskConical,
  Hexagon,
  Lock,
  Microscope,
  PackageCheck,
  PackageSearch,
  ShieldCheck,
  Sun,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { LogoMark } from "@/branding/logo/LogoMark";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Quality",
  description:
    "Helix Division follows rigorous, multi-stage testing protocols and industry-leading analytical methods so every research material meets the highest standard of purity, accuracy, and reliability.",
};

const commitments = [
  {
    icon: ShieldCheck,
    title: "Premium Raw Materials",
    description: "We source only the highest-grade raw materials from trusted, verified suppliers.",
  },
  {
    icon: FlaskConical,
    title: "Rigorous Testing",
    description:
      "Each batch undergoes extensive analytical testing to verify identity, purity, and potency.",
  },
  {
    icon: Target,
    title: "Accurate Results",
    description:
      "We ensure precise composition and consistency you can rely on for reproducible research outcomes.",
  },
  {
    icon: ClipboardCheck,
    title: "Full Transparency",
    description:
      "Certificates of Analysis (COA) are provided with every batch for complete traceability.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    description: "Our processes adhere to strict quality standards and regulatory requirements.",
  },
  {
    icon: Users,
    title: "Researcher Focused",
    description:
      "We are dedicated to supporting the research community with safe, reliable, and effective materials.",
  },
];

const testingSteps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: PackageSearch,
    title: "Receipt & Inspection",
    description: "Raw materials are received and inspected to verify identity and specifications.",
  },
  {
    icon: FlaskConical,
    title: "In-Process Testing",
    description: "Samples are tested during synthesis to monitor purity and consistency.",
  },
  {
    icon: Microscope,
    title: "Final Analytical Testing",
    description: "Each batch is tested using advanced methods including HPLC, LC-MS, and NMR.",
  },
  {
    icon: FileCheck2,
    title: "COA Verification",
    description: "Results are reviewed and approved. Certificates of Analysis are issued.",
  },
  {
    icon: PackageCheck,
    title: "Release & Packaging",
    description: "Only batches that meet our strict standards are released and securely packaged.",
  },
];

const methods = [
  { icon: Activity, title: "HPLC", description: "High-Performance Liquid Chromatography" },
  { icon: Hexagon, title: "LC-MS", description: "Liquid Chromatography Mass Spectrometry" },
  { icon: AudioWaveform, title: "NMR", description: "Nuclear Magnetic Resonance" },
  { icon: Sun, title: "UV-VIS", description: "Ultraviolet-Visible Spectroscopy" },
  { icon: Atom, title: "ICP-MS", description: "Inductively Coupled Plasma Mass Spectrometry" },
  { icon: Droplet, title: "Karl Fischer", description: "Moisture Content Analysis" },
];

export default function QualityPage() {
  return (
    <div className="flex flex-col">
      <MarketingHero
        eyebrow="Our Standard. Your Advantage."
        title="Quality"
        subtitle="Tested. Verified. Trusted."
        paragraphs={[
          "At Helix Division, quality is at the core of everything we do. We follow rigorous testing protocols and industry-leading standards to ensure every product meets the highest level of purity, accuracy, and reliability for your research.",
        ]}
        media={
          <div className="border-border bg-background-raised relative aspect-4/3 w-full overflow-hidden rounded-xl border">
            <Image
              src="/branding/photography/lab-tech-flask.png"
              alt="Helix Division laboratory testing"
              fill
              priority
              className="object-cover object-center"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="from-background-base/60 absolute inset-0 bg-gradient-to-tr to-transparent" />
            <div className="absolute right-4 bottom-4 aspect-square w-24 sm:w-28 lg:w-32">
              <Image
                src="/products/bpc-157.png"
                alt="Helix Division research peptide vial"
                fill
                sizes="128px"
                className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              />
            </div>
          </div>
        }
      />

      {/* Commitment */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
          <SectionHeading
            title="Our Commitment to Quality"
            subtitle="We are committed to providing research materials of unmatched quality and consistency."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {commitments.map((c) => (
              <FeatureCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* Testing process — circular icon steps with arrows (per mockup) */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
          <SectionHeading
            title="Our Testing Process"
            subtitle="Every batch is tested at multiple stages to ensure the highest level of quality and consistency."
          />
          <ol className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {testingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <FadeIn
                  key={step.title}
                  delay={index * 0.08}
                  className="flex flex-col items-center text-center"
                >
                  <span className="border-accent-crimson/50 bg-background-raised flex size-20 items-center justify-center rounded-full border">
                    <Icon className="text-accent-crimson size-8" strokeWidth={1.5} />
                  </span>
                  <span className="text-accent-crimson font-heading mt-3 text-sm tracking-widest">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-foreground-primary mt-1 text-sm tracking-wide uppercase">
                    {step.title}
                  </h3>
                  <p className="text-foreground-muted mt-2 max-w-[14rem] text-sm leading-relaxed">
                    {step.description}
                  </p>
                </FadeIn>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Analytical methods */}
      <section className="border-border border-b">
        <div className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 sm:px-8 sm:py-20">
          <SectionHeading
            title="Advanced Analytical Methods"
            subtitle="We utilize state-of-the-art instrumentation to deliver accurate and reliable results."
          />
          <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.title} className="flex flex-col items-center gap-2 text-center">
                  <Icon className="text-accent-crimson size-8" strokeWidth={1.5} />
                  <h3 className="font-heading text-foreground-primary mt-1 text-sm tracking-wide uppercase">
                    {method.title}
                  </h3>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    {method.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-(--breakpoint-xl) items-center gap-8 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
          <FadeIn className="flex items-center gap-6">
            <div className="hidden shrink-0 opacity-60 sm:block">
              <LogoMark size={96} />
            </div>
            <div>
              <h2 className="font-heading text-foreground-primary text-2xl tracking-wide uppercase sm:text-3xl">
                Quality You Can Trust.
              </h2>
              <span className="bg-accent-crimson mt-3 block h-0.5 w-12" />
              <p className="text-foreground-muted mt-4 max-w-md text-sm leading-relaxed">
                At Helix Division, we don&apos;t compromise on quality — ever. Our materials are
                developed and tested to empower researchers to achieve breakthrough results with
                confidence.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="border-border bg-background-raised flex items-start gap-3 rounded-lg border p-6">
              <FileCheck2
                className="text-accent-crimson mt-0.5 size-6 shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-foreground-muted text-sm leading-relaxed">
                Every batch is backed by transparent data and a commitment to scientific excellence.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
