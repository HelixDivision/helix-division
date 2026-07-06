export const siteConfig = {
  name: "Helix Division",
  tagline: "Precision. Performance. Purpose.",
  description:
    "Premium research chemicals engineered for precision — peptides, SARMs, laboratory supplies, and accessories, for research purposes only.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/branding/assets/og-default.png",
  social: {
    instagram: "",
    x: "",
    tiktok: "",
  },
} as const;
