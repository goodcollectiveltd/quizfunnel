// Product reference, from company-context/products/product-and-range-reference.md.
// NOTE: pricing is intentionally omitted — it is [TO CONFIRM] in the brand brain,
// so we never quote a number; the CTA sends to the live Shopify PDP which states
// the current price. PDP URLs below are [TO CONFIRM] placeholders — swap the
// handles for the real goodforpets.co product URLs when confirmed.

export const STORE_ORIGIN = "https://www.goodforpets.co";

// Live goodforpets.co product URLs. (Omega handle still [TO CONFIRM] — not yet
// surfaced in the UI, so harmless until we add an Omega-only recommendation.)
export const PDP_URLS = {
  probioPlus: `${STORE_ORIGIN}/products/5-strain-probiotic`,
  omega: `${STORE_ORIGIN}/products/omega-3-6-9-complex`,
  skinGutDuo: `${STORE_ORIGIN}/products/skin-and-gut-love`,
} as const;

export type ProductKey = "probioPlus" | "omega" | "skinGutDuo";

export interface Product {
  key: ProductKey;
  name: string;
  tagline: string;
  format: string;
  strength: string;
  supports: string;
  pdpUrl: string;
  image: string; // transparent PNG cutout — /images/products/<key>.png
  heroImage?: string; // rich lifestyle/product shot for the recommendation-card hero
  gallery?: string[]; // swipeable product-shot gallery for the result buy box (.png cutouts render contained)
  highlights?: string[]; // short keyword value-props, shown as scannable chips in the buy box
  contents: string[];
  // Upsell framing (used when a product is offered as an add-on, not the hero)
  addOnLabel?: string; // e.g. "Add Omega 3-6-9"
  addOnBlurb?: string; // one line on why to add it
}

export const PRODUCTS: Record<ProductKey, Product> = {
  probioPlus: {
    key: "probioPlus",
    name: "5 Strain Probiotic+",
    tagline: "The probiotic that actually reaches your dog's gut.",
    format: "90 sprinkle capsules: twist open, mix into food. No crushing.",
    strength: "5 billion live bacteria per capsule",
    supports: "gut health, digestion and everyday comfort",
    pdpUrl: PDP_URLS.probioPlus,
    image: "/images/products/probioPlus.png",
    heroImage: "/images/products/probio-sprinkle.jpg", // capsule sprinkling into food bowl, red bg
    gallery: ["/images/products/probio-sprinkle.jpg", "/images/products/probioPlus.png"],
    highlights: ["5 live strains + 6 enzymes", "Prebiotic inulin", "Cold-pressed, never baked", "UK-made · GMP"],
    contents: [
      "5 live probiotic strains + 6 digestive enzymes",
      "Prebiotic inulin from chicory root",
      "Cold-pressed, never baked, so the bacteria stay alive",
      "UK-made to GMP standards",
    ],
  },
  omega: {
    key: "omega",
    name: "Omega 3-6-9",
    tagline: "Feed the skin and coat from the inside.",
    format: "120 softgels: whole, or pierce and mix into food.",
    strength: "Omega 3, 6 & 9 from fish, flaxseed & sunflower oils",
    supports: "skin, coat and general condition",
    pdpUrl: PDP_URLS.omega,
    image: "/images/products/omega.png",
    contents: [
      "Omega 3-6-9 + vitamin E for skin and coat",
      "Works alongside 5 Strain Probiotic+ to settle the gut and feed the skin",
      "Whole or pierced into food",
      "UK-made to GMP standards",
    ],
    addOnLabel: "Add Omega 3-6-9",
    addOnBlurb:
      "For itchy, flaky skin and a dull coat. Feeds the skin while 5 Strain Probiotic+ settles the gut.",
  },
  skinGutDuo: {
    key: "skinGutDuo",
    name: "Skin & Gut Duo",
    tagline: "5 Strain Probiotic+ and Omega 3-6-9 together: our best value for skin.",
    format: "5 Strain Probiotic+ sprinkle capsules + Omega 3-6-9 softgels",
    strength: "5 billion live bacteria + omega 3-6-9",
    supports: "gut health plus skin and coat condition",
    pdpUrl: PDP_URLS.skinGutDuo,
    image: "/images/products/skinGutDuo.png",
    heroImage: "/images/products/skin-gut-duo-hero.jpg", // 5 Strain Probiotic+ & Omega tubs on red
    gallery: [
      "/images/products/skin-gut-duo-hero.jpg",
      "/images/products/skinGutDuo.png",
      "/images/products/probioPlus.png",
      "/images/products/omega.png",
    ],
    highlights: ["Everything in 5 Strain Probiotic+", "+ Omega 3-6-9 for skin & coat", "Our go-to for itchy skin", "Best value vs. buying both"],
    contents: [
      "Everything in 5 Strain Probiotic+ (5 strains, enzymes, prebiotic)",
      "Omega 3-6-9 for skin, coat and general condition",
      "Our go-to pairing for itchy, flaky skin + dull coat",
      "Better value than buying both separately",
    ],
    addOnLabel: "Make it the Skin & Gut Duo",
    addOnBlurb:
      "Add Omega 3-6-9 to 5 Strain Probiotic+ for extra skin & coat support, bundled at our best price.",
  },
};
