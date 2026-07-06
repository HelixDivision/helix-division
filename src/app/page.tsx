import { LogoMark } from "@/branding/logo/LogoMark";
import { CTA } from "@/components/home/CTA";
import { FAQPreview } from "@/components/home/FAQPreview";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Hero } from "@/components/home/Hero";
import { ManufacturingStandards } from "@/components/home/ManufacturingStandards";
import { OperationalTrustStrip } from "@/components/home/OperationalTrustStrip";
import { ResearchQuality } from "@/components/home/ResearchQuality";
import { TrustBar } from "@/components/home/TrustBar";
import { WhyHelix } from "@/components/home/WhyHelix";

// Homepage — section order and content per the approved mockup
// (public/branding/source/mockup-homepage.png) and Phase 3 scope. Each
// section is its own component under components/home/, independently
// maintainable per ARCHITECTURE.md#homepage-organization.
export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedCategories />
      <FeaturedProducts />
      <WhyHelix />

      {/* Combined split band — matches the mockup's single 3-column row (photo · crest · photo) rather than stacking Research/Manufacturing as separate full-width sections. */}
      <section className="border-border border-b lg:grid lg:grid-cols-3">
        <ResearchQuality />
        <div className="bg-background-raised border-border hidden items-center justify-center border-x lg:flex">
          <LogoMark size={96} />
        </div>
        <ManufacturingStandards />
      </section>

      <OperationalTrustStrip />
      <FAQPreview />
      <CTA />
    </>
  );
}
