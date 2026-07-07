import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing use of the Helix Division website and purchases.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="July 2026"
      intro="These terms govern your access to and use of the Helix Division website and your purchase of research materials. By using the site or placing an order, you agree to these terms."
      sections={[
        {
          heading: "Eligibility",
          paragraphs: [
            "You must be of legal age in your jurisdiction and a qualified researcher or professional acting on behalf of a research institution. You agree that all products are purchased strictly for laboratory research use.",
          ],
        },
        {
          heading: "Products & Pricing",
          paragraphs: [
            "We strive for accuracy in product descriptions, specifications, and pricing. Some products are listed without finalized pricing and are marked accordingly. We reserve the right to correct errors and to update pricing and availability at any time.",
          ],
        },
        {
          heading: "Orders & Payment",
          paragraphs: [
            "An order is an offer to purchase, which we may accept or decline. Payment must be completed through an approved method before an order is processed. We reserve the right to cancel orders suspected of fraud or of intended misuse.",
          ],
        },
        {
          heading: "Acceptable Use",
          paragraphs: [
            "You agree not to purchase or use any product in violation of applicable law, and not to resell or redistribute products for human or animal consumption. You accept full responsibility for the safe and lawful handling of all materials.",
          ],
        },
        {
          heading: "Limitation of Liability",
          paragraphs: [
            "To the maximum extent permitted by law, Helix Division is not liable for any indirect, incidental, or consequential damages arising from the use or misuse of products or the website. Products are provided for research use only, without warranty of fitness for any particular purpose beyond the published specifications.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "We may update these terms from time to time. Continued use of the site after changes take effect constitutes acceptance of the revised terms.",
          ],
        },
      ]}
    />
  );
}
