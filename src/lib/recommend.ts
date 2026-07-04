import type { SymptomTag, Testimonial } from "@/data/testimonials";
import { TESTIMONIALS } from "@/data/testimonials";
import { PRODUCTS, type Product, type ProductKey } from "@/data/products";
import { SYMPTOMS, symptomById, type Symptom } from "@/data/symptoms";

export type DogSize = "toy" | "small" | "medium" | "large";

export interface QuizAnswers {
  symptoms: SymptomTag[]; // all selected
  primary: SymptomTag | null; // the biggest issue → routes the lander
  size: DogSize | null;
  triedBefore: boolean | null;
  dogName: string;
}

export const emptyAnswers: QuizAnswers = {
  symptoms: [],
  primary: null,
  size: null,
  triedBefore: null,
  dogName: "",
};

export const SIZE_LABEL: Record<DogSize, string> = {
  toy: "Toy — under 10kg",
  small: "Small — 10–20kg",
  medium: "Medium — 20–40kg",
  large: "Large — over 40kg",
};

export interface Recommendation {
  primary: Symptom;
  product: Product;
  landerSlug: string;
  proof: Testimonial[]; // matched, de-duped, best first
  smallDog: boolean; // surface the sprinkle-capsule reassurance
  triedBefore: boolean;
}

/**
 * Choose the product. Every symptom in this cluster points at the hero Probio+
 * (the cold-press mechanism that settles the whole skin–gut–ear loop). We upgrade
 * to the Skin & Gut Duo only when there's a genuine skin/coat signal — itchy skin
 * as the biggest issue, or itchy skin + paw licking selected together.
 */
export function chooseProduct(a: QuizAnswers): ProductKey {
  const has = (s: SymptomTag) => a.symptoms.includes(s);
  const skinSignal =
    a.primary === "itchy-skin" || (has("itchy-skin") && has("paw-licking"));
  return skinSignal ? "skinGutDuo" : "probioPlus";
}

/** Rank matched testimonials: primary-symptom proof first, then secondary, de-duped. */
function matchedProof(a: QuizAnswers, primary: SymptomTag): Testimonial[] {
  const secondary = a.symptoms.filter((s) => s !== primary);
  const score = (t: Testimonial) => {
    let n = 0;
    if (t.symptoms.includes(primary)) n += 10;
    n += t.symptoms.filter((s) => secondary.includes(s)).length;
    if (a.triedBefore && t.angles?.includes("tried-everything")) n += 2;
    return n;
  };
  return TESTIMONIALS.filter((t) => score(t) > 0)
    .map((t) => ({ t, n: score(t) }))
    .sort((x, y) => y.n - x.n)
    .map((x) => x.t);
}

export function buildRecommendation(a: QuizAnswers): Recommendation {
  // Fall back to the first selected symptom, then to paw-licking, if none flagged.
  const primaryId: SymptomTag =
    a.primary ?? a.symptoms[0] ?? "paw-licking";
  const primary = symptomById(primaryId);
  const product = PRODUCTS[chooseProduct(a)];
  return {
    primary,
    product,
    landerSlug: primary.slug,
    proof: matchedProof(a, primaryId).slice(0, 6),
    smallDog: a.size === "toy" || a.size === "small",
    triedBefore: a.triedBefore === true,
  };
}

export { SYMPTOMS };
