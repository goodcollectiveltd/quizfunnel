import type { SymptomTag, Testimonial } from "@/data/testimonials";
import { TESTIMONIALS } from "@/data/testimonials";
import { PRODUCTS, type Product } from "@/data/products";
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
  hero: Product; // always Probio+ — the foundation for the whole cluster
  upsell: Product | null; // Skin & Gut Duo add-on when there's a skin/coat signal
  landerSlug: string;
  proof: Testimonial[]; // matched, de-duped, best first
  smallDog: boolean; // surface the sprinkle-capsule reassurance
  triedBefore: boolean;
}

const SKIN_SYMPTOMS: SymptomTag[] = ["itchy-skin", "paw-licking"];

/**
 * Probio+ is the hero for every symptom in this cluster (the cold-press mechanism
 * settles the whole skin–gut–ear loop). When there's a genuine skin/coat signal —
 * itchy skin or paw licking anywhere in the answers — we offer the Skin & Gut Duo
 * (adds Omega 3-6-9) as an optional "add extra support" upsell on top.
 */
export function hasSkinSignal(a: QuizAnswers): boolean {
  return a.symptoms.some((s) => SKIN_SYMPTOMS.includes(s));
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
  return {
    primary,
    hero: PRODUCTS.probioPlus,
    upsell: hasSkinSignal(a) ? PRODUCTS.skinGutDuo : null,
    landerSlug: primary.slug,
    proof: matchedProof(a, primaryId).slice(0, 6),
    smallDog: a.size === "toy" || a.size === "small",
    triedBefore: a.triedBefore === true,
  };
}

export { SYMPTOMS };
