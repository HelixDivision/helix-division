import type { CatalogCategory, CatalogProduct } from "@/types/catalog";

// Bootstrap-only. The database is now the single source of truth for the
// catalog (see src/lib/catalog.ts) — this module's only remaining consumer
// is prisma/seed.ts, which used it to populate the initial Postgres data.
// Do not import this from application code, and do not add a fallback path
// that reads from here if a Prisma query comes back empty. To change product
// data now, write to the database (re-run the seed, or use the Admin
// Dashboard's product CRUD once it exists) — don't edit this file expecting
// it to affect the running app.

export const categories: CatalogCategory[] = [
  {
    id: "cat-research-peptides",
    name: "Research Peptides",
    slug: "research-peptides",
    description: "Lab-verified peptides for in-vitro research use.",
    attributeSchema: [{ key: "dosage", label: "Dosage" }],
  },
  {
    id: "cat-sarms",
    name: "SARMs",
    slug: "sarms",
    description: "Selective androgen receptor modulators for research use.",
    attributeSchema: [{ key: "dosage", label: "Dosage" }],
  },
  {
    id: "cat-laboratory-supplies",
    name: "Laboratory Supplies",
    slug: "laboratory-supplies",
    description: "Reconstitution and handling supplies for research use.",
    attributeSchema: [{ key: "volume", label: "Volume" }],
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    description: "Research-lab accessories and hardware.",
    attributeSchema: [{ key: "type", label: "Type" }],
  },
  {
    id: "cat-merchandise",
    name: "Merchandise",
    slug: "merchandise",
    description: "Helix Division apparel and branded goods.",
    attributeSchema: [
      { key: "size", label: "Size" },
      { key: "color", label: "Color" },
    ],
  },
];

const STANDARD_STORAGE =
  "Store lyophilized vial at -20°C. Once reconstituted, refrigerate at 2–8°C and use within 2–4 weeks.";
const STANDARD_PURITY = "≥98% (HPLC)";
const RESEARCH_DESCRIPTION = (name: string) =>
  `${name} is offered strictly for in-vitro laboratory research. Not for human or animal consumption.`;

interface SeedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  dosage: string;
  image: string;
  price: number | null;
  compareAtPrice?: number;
  featured?: boolean;
  badge?: "new" | "research-grade";
  purity?: string;
  molecularWeight?: string;
  casNumber?: string;
  sequence?: string;
}

// The 6 already-approved products keep their exact copy/pricing from
// src/components/home/FeaturedProducts.tsx — nothing re-derived here.
// The other 16 have never had pricing decided anywhere in the project, so
// `price: null` — the UI renders "Contact for Pricing" / "Coming Soon"
// rather than an invented number (see PriceDisplay.tsx, getStockStatus()).
const seedProducts: SeedProduct[] = [
  {
    name: "BPC-157",
    slug: "bpc-157",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/bpc-157.png",
    price: 59,
    featured: true,
    badge: "new",
    purity: STANDARD_PURITY,
    molecularWeight: "1419.53 g/mol",
    casNumber: "137525-51-0",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
  },
  {
    name: "Retatrutide",
    slug: "retatrutide",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/retatrutide.png",
    price: 129,
    compareAtPrice: 149,
    featured: true,
    purity: STANDARD_PURITY,
  },
  {
    name: "NAD+",
    slug: "nad",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/nad.png",
    price: 79,
    featured: true,
    purity: STANDARD_PURITY,
  },
  {
    name: "Ipamorelin",
    slug: "ipamorelin",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/ipamorelin.png",
    price: 55,
    featured: true,
    badge: "research-grade",
    purity: STANDARD_PURITY,
  },
  {
    name: "GHK-Cu",
    slug: "ghk-cu",
    categorySlug: "research-peptides",
    dosage: "50MG",
    image: "/products/ghk-cu.png",
    price: 69,
    featured: true,
    purity: STANDARD_PURITY,
  },
  {
    name: "DSIP",
    slug: "dsip",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/dsip.png",
    price: 49,
    featured: true,
    purity: STANDARD_PURITY,
  },
  {
    name: "5-Amino-1MQ",
    slug: "5-amino-1mq",
    categorySlug: "research-peptides",
    dosage: "50MG",
    image: "/products/5-amino-1mq.png",
    price: null,
  },
  {
    name: "AOD-9604",
    slug: "aod-9604",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/aod-9604.png",
    price: null,
  },
  {
    name: "Bacteriostatic Water",
    slug: "bacteriostatic-water",
    categorySlug: "laboratory-supplies",
    dosage: "10ML",
    image: "/products/bacteriostatic-water.png",
    price: null,
  },
  {
    name: "CJC-1295 (No DAC) / IPA Blend",
    slug: "cjc-1295-no-dac-ipa",
    categorySlug: "research-peptides",
    dosage: "5MG",
    image: "/products/cjc-no-dac-ipa-5mg.png",
    price: null,
  },
  {
    name: "Epithalon",
    slug: "epithalon",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/epithalon.png",
    price: null,
  },
  {
    name: "KLOW Blend",
    slug: "klow-blend",
    categorySlug: "research-peptides",
    dosage: "80MG",
    image: "/products/klow-blend.png",
    price: null,
  },
  {
    name: "KPV",
    slug: "kpv",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/kpv.png",
    price: null,
  },
  {
    name: "Melanotan II (MT2)",
    slug: "melanotan-ii-mt2",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/melanotan-ii-mt2.png",
    price: null,
  },
  {
    name: "MOTS-C",
    slug: "mots-c",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/motsc.png",
    price: null,
  },
  {
    // Kept as printed on the approved product label, per project convention
    // of trusting the label as source of truth (not "corrected" to Oxytocin).
    name: "Oxytoxin",
    slug: "oxytoxin",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/oxytoxin.png",
    price: null,
  },
  {
    name: "PT-141",
    slug: "pt-141",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/pt-141.png",
    price: null,
  },
  {
    name: "Selank",
    slug: "selank",
    categorySlug: "research-peptides",
    dosage: "5MG",
    image: "/products/selank-5mg.png",
    price: null,
  },
  {
    name: "Semax",
    slug: "semax",
    categorySlug: "research-peptides",
    dosage: "5MG",
    image: "/products/semax-5mg.png",
    price: null,
  },
  {
    name: "Sernorellin",
    slug: "sernorellin",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/sernorellin.png",
    price: null,
  },
  {
    name: "SS-31 (Elamipretide)",
    slug: "ss-31-elamipretide",
    categorySlug: "research-peptides",
    dosage: "50MG",
    image: "/products/ss-31-elamipretide.png",
    price: null,
  },
  {
    name: "Thymosin Alpha-1",
    slug: "thymosin-alpha-1",
    categorySlug: "research-peptides",
    dosage: "10MG",
    image: "/products/thymosin-alpha-1.png",
    price: null,
  },
];

export const products: CatalogProduct[] = seedProducts.map((seed, index) => {
  const isPriced = seed.price !== null;
  return {
    id: `prod-${seed.slug}`,
    name: seed.name,
    slug: seed.slug,
    categorySlug: seed.categorySlug,
    description: RESEARCH_DESCRIPTION(seed.name),
    status: "ACTIVE",
    purity: seed.purity,
    molecularWeight: seed.molecularWeight,
    casNumber: seed.casNumber,
    sequence: seed.sequence,
    storageInstructions: STANDARD_STORAGE,
    // Intentionally unset — no real lab report/COA exists yet; the PDP
    // renders an honest "available upon request" / "pending publication"
    // fallback rather than a fabricated document.
    labTestingSummary: undefined,
    documents: undefined,
    featured: seed.featured ?? false,
    newArrival: false,
    bestSeller: false,
    shippingClass: "STANDARD",
    seoTitle: `${seed.name} | Helix Division`,
    seoDescription: RESEARCH_DESCRIPTION(seed.name),
    reviewCount: undefined,
    averageRating: undefined,
    images: [
      {
        id: `img-${seed.slug}-1`,
        url: seed.image,
        alt: `Helix Division ${seed.name} vial`,
        position: 0,
        kind: "primary",
      },
    ],
    variants: [
      {
        id: `var-${seed.slug}`,
        sku: `HD-${seed.slug.toUpperCase()}`,
        label: seed.dosage,
        price: seed.price,
        compareAtPrice: seed.compareAtPrice ?? null,
        attributes: { dosage: seed.dosage },
        availableQuantity: isPriced ? 50 - index : 0,
        lowStockThreshold: 10,
        backorderAllowed: false,
        restockDate: null,
      },
    ],
  };
});
