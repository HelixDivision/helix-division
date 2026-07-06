export interface NavItem {
  label: string;
  href: string;
}

// Primary header nav — matches the approved homepage mockup exactly
// (Home / Peptides / Research / Quality / About Us / Contact). "Peptides"
// points at the generic /shop route (see ARCHITECTURE.md#product--catalog-model)
// — the nav label reflects the current flagship category, not the route shape.
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Peptides", href: "/shop" },
  { label: "Research", href: "/research" },
  { label: "Quality", href: "/quality" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// Footer columns — matches the approved mockup's Peptides/Company/Support
// layout. Legal/policy links live in the bottom bar (see Footer.tsx) rather
// than their own column, since the mockup doesn't carry a fourth link column.
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Peptides",
    items: [
      { label: "All Peptides", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=new" },
      { label: "Best Sellers", href: "/shop?sort=best-sellers" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Research", href: "/research" },
      { label: "Quality Standards", href: "/quality" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "FAQs", href: "/faq" },
      { label: "Shipping & Delivery", href: "/legal/shipping" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

export const legalNav: NavItem[] = [
  { label: "Terms", href: "/legal/terms" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Research Disclaimer", href: "/legal/research-disclaimer" },
];
