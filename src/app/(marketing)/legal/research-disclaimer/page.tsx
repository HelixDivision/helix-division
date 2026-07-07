import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Research Disclaimer",
  description:
    "All Helix Division products are supplied strictly for laboratory research use only and are not for human or animal consumption.",
};

export default function ResearchDisclaimerPage() {
  return (
    <LegalPage
      title="Research Disclaimer"
      updated="July 2026"
      intro="All products offered by Helix Division are intended and sold strictly for in-vitro laboratory and scientific research purposes only."
      sections={[
        {
          heading: "Not for Human or Animal Use",
          paragraphs: [
            "Products are NOT for human or animal consumption of any kind. They are not drugs, foods, cosmetics, or medical devices, and may not be used to prevent, diagnose, treat, or cure any medical condition.",
            "Nothing on this website should be interpreted as a recommendation to use any product in a manner that violates applicable law or the terms of sale.",
          ],
        },
        {
          heading: "Qualified Researchers Only",
          paragraphs: [
            "By purchasing, you represent that you are a qualified researcher or professional acting on behalf of a research institution, and that you have the training and facilities to handle research materials safely and lawfully.",
            "You accept full responsibility for the safe handling, storage, use, and disposal of any product purchased, and for compliance with all applicable laws and regulations in your jurisdiction.",
          ],
        },
        {
          heading: "Acknowledgment Required",
          paragraphs: [
            "Every order requires an explicit acknowledgment of this research-use policy at checkout. Placing an order confirms that you have read, understood, and agree to these terms.",
          ],
        },
      ]}
    />
  );
}
