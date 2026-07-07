import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about Helix Division's research materials, ordering, shipping, payment, and research-use policy.",
};

const faqGroups: { heading: string; items: { question: string; answer: string }[] }[] = [
  {
    heading: "Products & Research Use",
    items: [
      {
        question: 'What does "research use only" mean?',
        answer:
          "Every product on Helix Division is sold strictly for in-vitro laboratory research. It is not approved or intended for human or animal consumption, diagnostic, or therapeutic use, and every order requires an explicit research-use acknowledgment at checkout.",
      },
      {
        question: "How is purity verified?",
        answer:
          "Each batch is tested using advanced analytical methods including HPLC, LC-MS, and NMR before it is released. Certificates of Analysis are reviewed and verified, and a downloadable COA is provided on product pages where available.",
      },
      {
        question: "Can I request a Certificate of Analysis?",
        answer:
          "Yes. Where a COA is published it appears as a download on the product page. For any batch-specific documentation not shown, contact us and we'll provide it.",
      },
    ],
  },
  {
    heading: "Orders & Shipping",
    items: [
      {
        question: "How is my order shipped?",
        answer:
          "Orders ship discreetly in plain packaging with no reference to product contents on the exterior. Tracking is provided once your order is dispatched.",
      },
      {
        question: "Do you offer free shipping?",
        answer:
          "Yes — orders over $200 qualify for free discreet shipping. Orders below the threshold are charged a flat shipping rate shown at checkout.",
      },
      {
        question: "Where do you ship?",
        answer:
          "We ship to research customers worldwide. Some materials may be restricted in certain regions; any restriction is applied at checkout.",
      },
    ],
  },
  {
    heading: "Payment & Account",
    items: [
      {
        question: "What payment methods are accepted?",
        answer:
          "We currently accept Wise bank transfer, with cryptocurrency options (NOW Payments and Coinbase Commerce) planned as they come online. The available methods are shown at checkout.",
      },
      {
        question: "Do I need an account to order?",
        answer:
          "You can check out as a guest. Creating an account lets you track orders, save addresses, and view your full order history from the customer dashboard.",
      },
    ],
  },
];

export default function FaqPage() {
  let index = 0;

  return (
    <div className="mx-auto max-w-(--breakpoint-md) px-6 py-16 sm:px-8 sm:py-20">
      <SectionHeading
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about ordering research materials from Helix Division."
      />

      <div className="mt-12 flex flex-col gap-10">
        {faqGroups.map((group) => (
          <FadeIn key={group.heading}>
            <h2 className="font-heading text-accent-crimson text-xs tracking-[0.2em] uppercase">
              {group.heading}
            </h2>
            <Accordion className="mt-3">
              {group.items.map((item) => {
                const value = `item-${index++}`;
                return (
                  <AccordionItem key={item.question} value={value}>
                    <AccordionTrigger className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-foreground-muted">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </FadeIn>
        ))}
      </div>

      <div className="border-border mt-12 flex flex-col items-center gap-4 border-t pt-10 text-center">
        <p className="text-foreground-muted text-sm">Still have a question?</p>
        <Button variant="outline" render={<Link href="/contact" />} nativeButton={false}>
          Contact Us
          <ChevronRight className="transition-transform duration-250 group-hover/button:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
