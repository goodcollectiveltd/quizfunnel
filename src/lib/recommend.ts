import type { SymptomTag, Testimonial } from "@/data/testimonials";
import { TESTIMONIALS } from "@/data/testimonials";
import { PRODUCTS, type Product } from "@/data/products";
import { SYMPTOMS, symptomById, type Symptom } from "@/data/symptoms";

export type DogSize = "toy" | "small" | "medium" | "large";
export type AgeBand = "puppy" | "adult" | "senior";
export type Duration = "lt1m" | "1to6m" | "6to12m" | "gt1y";
export type Stool = "runny" | "soft" | "ideal" | "firm" | "hard" | "varies";
export type PooFreq = "none" | "1to2" | "3to4" | "more" | "irregular";
export type Wind = "rare" | "sometimes" | "often";

export interface QuizAnswers {
  dogName: string;
  size: DogSize | null;
  age: AgeBand | null;
  symptoms: SymptomTag[]; // all selected
  primary: SymptomTag | null; // the biggest issue → personalisation anchor
  stool: Stool | null;
  pooFreq: PooFreq | null;
  wind: Wind | null;
  duration: Duration | null;
  tried: string[]; // ids from TRIED options
  diet: string | null;
}

export const emptyAnswers: QuizAnswers = {
  dogName: "",
  size: null,
  age: null,
  symptoms: [],
  primary: null,
  stool: null,
  pooFreq: null,
  wind: null,
  duration: null,
  tried: [],
  diet: null,
};

export const SIZE_LABEL: Record<DogSize, string> = {
  toy: "Toy — under 10kg",
  small: "Small — 10–20kg",
  medium: "Medium — 20–40kg",
  large: "Large — over 40kg",
};

/** Capsules/day by size, from the product reference (roughly 1 per 25kg). */
export const DOSE_BY_SIZE: Record<DogSize, string> = {
  toy: "1 sprinkle capsule a day",
  small: "1 sprinkle capsule a day",
  medium: "1–2 sprinkle capsules a day",
  large: "2–3 sprinkle capsules a day",
};

export interface RootCause {
  label: string;
  value: string;
}

export interface Recommendation {
  primary: Symptom;
  hero: Product; // always Probio+ — the foundation for the whole cluster
  upsell: Product | null; // Skin & Gut Duo add-on when there's a skin/coat signal
  proof: Testimonial[]; // matched, de-duped, best first
  smallDog: boolean; // surface the sprinkle-capsule reassurance
  triedBefore: boolean;
  dose: string;
  // Diagnosis
  gutScore: number; // 0–100 (lower = more imbalance)
  rating: string; // e.g. "Out of balance"
  verdict: string; // one-line diagnosis
  rootCauses: RootCause[];
}

const SKIN_SYMPTOMS: SymptomTag[] = ["itchy-skin", "paw-licking"];

export function hasSkinSignal(a: QuizAnswers): boolean {
  return a.symptoms.some((s) => SKIN_SYMPTOMS.includes(s));
}

/** Rank matched testimonials: primary-symptom proof first, then secondary, de-duped. */
function matchedProof(a: QuizAnswers, primary: SymptomTag): Testimonial[] {
  const secondary = a.symptoms.filter((s) => s !== primary);
  const triedBefore = a.tried.some((t) => t !== "nothing");
  const score = (t: Testimonial) => {
    let n = 0;
    if (t.symptoms.includes(primary)) n += 10;
    n += t.symptoms.filter((s) => secondary.includes(s)).length;
    if (triedBefore && t.angles?.includes("tried-everything")) n += 2;
    return n;
  };
  return TESTIMONIALS.filter((t) => score(t) > 0)
    .map((t) => ({ t, n: score(t) }))
    .sort((x, y) => y.n - x.n)
    .map((x) => x.t);
}

/**
 * A believable "gut health" score. Everyone taking the quiz has symptoms, so it always
 * lands in the "needs support" zone — the score quantifies how far out of balance.
 */
function gutScore(a: QuizAnswers): number {
  let score = 82;
  score -= a.symptoms.length * 6; // each symptom = more imbalance
  if (a.stool && ["runny", "soft", "varies"].includes(a.stool)) score -= 10;
  if (a.pooFreq && ["more", "irregular", "none"].includes(a.pooFreq)) score -= 6;
  if (a.wind === "often") score -= 8;
  else if (a.wind === "sometimes") score -= 3;
  if (a.duration === "gt1y") score -= 10;
  else if (a.duration === "6to12m") score -= 6;
  const triedCount = a.tried.filter((t) => t !== "nothing").length;
  score -= Math.min(triedCount * 3, 12); // tried & failed = more entrenched
  return Math.max(18, Math.min(74, score));
}

function ratingFor(score: number): string {
  if (score < 40) return "Significantly out of balance";
  if (score < 58) return "Out of balance";
  return "Mildly out of balance";
}

function rootCausesFor(a: QuizAnswers): RootCause[] {
  const causes: RootCause[] = [
    { label: "Likely root cause", value: "Gut microbiome imbalance" },
  ];
  if (hasSkinSignal(a)) {
    causes.push({ label: "The mechanism", value: "The skin–gut axis" });
  } else if (a.primary === "gunky-ears") {
    causes.push({ label: "The mechanism", value: "Yeast & gut balance" });
  } else {
    causes.push({ label: "The mechanism", value: "Digestive imbalance" });
  }
  const triedCount = a.tried.filter((t) => t !== "nothing").length;
  causes.push({
    label: "Why it keeps coming back",
    value: triedCount >= 2 ? "Surface fixes, not the cause" : "Untreated at the source",
  });
  causes.push({
    label: "How long it's been building",
    value:
      a.duration === "gt1y"
        ? "Over a year"
        : a.duration === "6to12m"
        ? "6–12 months"
        : a.duration === "1to6m"
        ? "1–6 months"
        : "Recent",
  });
  return causes;
}

export function buildRecommendation(a: QuizAnswers): Recommendation {
  const primaryId: SymptomTag = a.primary ?? a.symptoms[0] ?? "paw-licking";
  const primary = symptomById(primaryId);
  const score = gutScore(a);
  const dog = a.dogName.trim() || "your dog";
  return {
    primary,
    hero: PRODUCTS.probioPlus,
    upsell: hasSkinSignal(a) ? PRODUCTS.skinGutDuo : null,
    proof: matchedProof(a, primaryId).slice(0, 6),
    smallDog: a.size === "toy" || a.size === "small",
    triedBefore: a.tried.some((t) => t !== "nothing"),
    dose: a.size ? DOSE_BY_SIZE[a.size] : "the right daily dose",
    gutScore: score,
    rating: ratingFor(score),
    verdict: `Based on ${dog}'s answers, their ${primary.eyebrow.toLowerCase()} is most likely being driven from the gut — and it's ${ratingFor(
      score
    ).toLowerCase()}.`,
    rootCauses: rootCausesFor(a),
  };
}

export { SYMPTOMS };
