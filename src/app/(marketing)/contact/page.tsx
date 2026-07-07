import { Mail } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/ContactForm";
import { CrestShowcase } from "@/components/marketing/CrestShowcase";
import { HexIcon } from "@/components/marketing/HexIcon";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { FadeIn } from "@/components/motion/FadeIn";
import { env } from "@/lib/env";
import { getContactRecipientEmail } from "@/server/services/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about our peptide research materials? Contact the Helix Division team — we're here to support your research.",
};

// The displayed recipient email is admin-configurable at runtime, so render
// per-request rather than caching a build-time value.
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const recipient = await getContactRecipientEmail();

  return (
    <div className="flex flex-col">
      <MarketingHero
        eyebrow="We're Here to Support Your Research."
        title="Contact Us"
        subtitle="Precision Support. Fast Response."
        paragraphs={[
          "Have a question or need more information about our peptide research materials? Our team is ready to assist you.",
          "Reach out to us and we'll get back to you as soon as possible.",
        ]}
        media={<CrestShowcase />}
      />

      <section>
        <div className="mx-auto grid max-w-(--breakpoint-xl) gap-12 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Get in touch */}
          <FadeIn>
            <h2 className="font-heading text-foreground-primary text-lg tracking-[0.2em] uppercase">
              Get in Touch
            </h2>
            <span className="bg-accent-crimson mt-3 block h-0.5 w-12" />

            <div className="mt-8 flex items-center gap-4">
              <HexIcon icon={Mail} size={56} />
              <div>
                <p className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
                  Email Us
                </p>
                <a
                  href={`mailto:${recipient}`}
                  className="text-foreground-muted hover:text-accent-crimson text-sm transition-colors"
                >
                  {recipient}
                </a>
              </div>
            </div>

            <p className="text-foreground-muted mt-8 max-w-xs text-sm leading-relaxed">
              All products are supplied strictly for laboratory research purposes and are not for
              human or animal consumption.
            </p>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.1}>
            <h2 className="font-heading text-foreground-primary text-lg tracking-[0.2em] uppercase">
              Send Us a Message
            </h2>
            <p className="text-foreground-muted mt-2 text-sm">
              Fill out the form below and a member of our team will get back to you.
            </p>
            <div className="mt-6">
              <ContactForm recaptchaSiteKey={env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
