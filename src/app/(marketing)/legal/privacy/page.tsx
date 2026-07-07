import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Helix Division collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="July 2026"
      intro="This policy explains what information we collect, how we use it, and the choices you have. We collect only what we need to operate the store and support your research."
      sections={[
        {
          heading: "Information We Collect",
          paragraphs: [
            "Account & order information: name, email, shipping address, and order history when you create an account or place an order.",
            "Contact submissions: the name, email, and message you send us through the contact form.",
            "Usage data: first-party, cookie-based analytics (page views, device type, and referral source) used to understand and improve the site. This data is not sold and contains no sensitive personal information.",
          ],
        },
        {
          heading: "How We Use It",
          paragraphs: [
            "To process and ship orders, provide customer support, communicate about your orders, prevent fraud and abuse, and improve the website and our products.",
          ],
        },
        {
          heading: "Payment Data",
          paragraphs: [
            "Payments are handled through our approved payment providers. We do not store full payment credentials on our servers; only the reference information needed to reconcile your order is retained.",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "We use essential cookies for authentication and cart functionality, and first-party analytics cookies to measure site usage. If Google Analytics is enabled, aggregate traffic data may also be processed by Google.",
          ],
        },
        {
          heading: "Your Choices",
          paragraphs: [
            "You can update your account details or request deletion of your account by contacting us. You may unsubscribe from newsletters at any time using the link in the email or by contacting support.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [
            "Questions about this policy? Reach us through the contact page and we'll respond as soon as possible.",
          ],
        },
      ]}
    />
  );
}
