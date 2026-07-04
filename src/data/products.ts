// Product reference, from company-context/products/product-and-range-reference.md.
// NOTE: pricing is intentionally omitted — it is [TO CONFIRM] in the brand brain,
// so we never quote a number; the CTA sends to the live Shopify PDP which states
// the current price. PDP URLs below are [TO CONFIRM] placeholders — swap the
// handles for the real goodforpets.co product URLs when confirmed.

export const STORE_ORIGIN = "https://www.goodforpets.co";

// TODO[TO CONFIRM]: replace these product handles with the real Shopify handles.
export const PDP_URLS = {
  probioPlus: `${STORE_ORIGIN}/products/5-strain-probiotic-plus`,
  skinGutDuo: `${STORE_ORIGIN}/products/skin-and-gut-duo`,
} as const;

export type ProductKey = "probioPlus" | "skinGutDuo";

export interface Product {
  key: ProductKey;
  name: string;
  tagline: string;
  format: string;
  strength: string;
  supports: string;
  pdpUrl: string;
  contents: string[];
}

export const PRODUCTS: Record<ProductKey, Product> = {
  probioPlus: {
    key: "probioPlus",
    name: "5 Strain Probiotic+",
    tagline: "The probiotic that actually reaches your dog's gut.",
    format: "90 sprinkle capsules — twist open, mix into food. No crushing.",
    strength: "5 billion live bacteria per capsule",
    supports: "gut health, digestion and everyday comfort",
    pdpUrl: PDP_URLS.probioPlus,
    contents: [
      "5 live probiotic strains + 6 digestive enzymes",
      "Prebiotic inulin from chicory root",
      "Cold-pressed — never baked, so the bacteria stay alive",
      "UK-made to GMP standards",
    ],
  },
  skinGutDuo: {
    key: "skinGutDuo",
    name: "Skin & Gut Duo",
    tagline: "Calm the gut, feed the skin and coat.",
    format: "Probio+ sprinkle capsules + Omega 3-6-9 softgels",
    strength: "5 billion live bacteria + omega 3-6-9",
    supports: "gut health plus skin and coat condition",
    pdpUrl: PDP_URLS.skinGutDuo,
    contents: [
      "Everything in Probio+ (5 strains, enzymes, prebiotic)",
      "Omega 3-6-9 for skin, coat and general condition",
      "Our go-to pairing for itchy, flaky skin + dull coat",
      "UK-made to GMP standards",
    ],
  },
};
