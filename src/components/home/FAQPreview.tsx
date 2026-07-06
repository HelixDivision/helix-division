import Link from "next/link";

import { FadeIn } from "@/components/motion/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: 'What does "research use only" mean?',
    answer:
      "Every product on Helix Division is sold strictly for in-vitro laboratory research. It is not approved for human or animal consumption, and every order requires a research-use acknowledgment.",
  },
  {
    question: "How is purity verified?",
    answer:
      "Each batch is third-party lab tested for purity and potency before it's listed, with certificates of analysis available on request.",
  },
  {
    question: "How is my order shipped?",
    answer:
      "Orders ship discreetly in plain packaging with no reference to product contents on the exterior.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We currently accept Wise bank transfer and Bitcoin, with more methods planned.",
  },
];

/** FAQ preview — new section per Phase 3 scope, styled to match the mockup's dark/hairline-divider language. Links out to the full FAQ page. */
export function FAQPreview() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-(--breakpoint-md) px-6 py-16 sm:px-8 sm:py-20">
        <FadeIn>
          <p className="font-heading text-foreground-primary text-center text-xl tracking-wide uppercase sm:text-2xl">
            Frequently Asked Questions
            <span className="bg-accent-crimson mx-auto mt-4 block h-px w-12" />
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10">
          <Accordion defaultValue={["item-0"]}>
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-foreground-muted">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>

        <p className="mt-8 text-center">
          <Link
            href="/faq"
            className="text-accent-crimson group/link inline-flex items-center gap-1 text-sm font-medium"
          >
            View all FAQs
            <span className="transition-transform duration-250 group-hover/link:translate-x-0.5">
              →
            </span>
          </Link>
        </p>
      </div>
    </section>
  );
}
