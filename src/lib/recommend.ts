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
  symptoms: SymptomTag[]; // ALL selected — every one is used to tailor the plan
  stool: Stool | null;
  pooFreq: PooFreq | null;
  wind: Wind | null;
  duration: Duration | null;
  tried: string[];
  diet: string | null;
}

export const emptyAnswers: QuizAnswers = {
  dogName: "",
  size: null,
  age: null,
  symptoms: [],
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
  symptoms: Symptom[]; // all selected, resolved — the plan addresses every one
  hero: Product; // always Probio+ — the foundation for the whole cluster
  upsell: Product | null; // Skin & Gut Duo add-on when there's a skin/coat signal
  proof: Testimonial[]; // matched across ALL symptoms, best first
  smallDog: boolean;
  triedBefore: boolean;
  dose: string;
  beforeAfterKind: "skin" | "ears";
  // Diagnosis
  gutScore: number; // 0–100 (lower = more imbalance)
  rating: string;
  verdict: string;
  rootCauses: RootCause[];
}

const SKIN_SYMPTOMS: SymptomTag[] = ["itchy-skin", "paw-licking"];

export function hasSkinSignal(a: QuizAnswers): boolean {
  return a.symptoms.some((s) => SKIN_SYMPTOMS.includes(s));
}

/** Which before/after to show: skin transformation for a skin signal, else ears if relevant. */
export function beforeAfterKind(a: QuizAnswers): "skin" | "ears" {
  if (hasSkinSignal(a)) return "skin";
  if (a.symptoms.includes("gunky-ears")) return "ears";
  return "skin";
}

/** Natural language list of the selected symptoms, e.g. "paw licking, itchy skin and gunky ears". */
function joinNouns(nouns: string[]): string {
  if (nouns.length === 0) return "the symptoms you mentioned";
  if (nouns.length === 1) return nouns[0];
  if (nouns.length === 2) return `${nouns[0]} and ${nouns[1]}`;
  return `${nouns.slice(0, -1).join(", ")} and ${nouns[nouns.length - 1]}`;
}

/**
 * Rank testimonials by how many of the dog's symptoms they cover — every selected
 * symptom counts equally, so the proof reflects the whole picture, not one symptom.
 */
function matchedProof(a: QuizAnswers): Testimonial[] {
  const triedBefore = a.tried.some((t) => t !== "nothing");
  const score = (t: Testimonial) => {
    let n = t.symptoms.filter((s) => a.symptoms.includes(s)).length * 3;
    if (triedBefore && t.angles?.includes("tried-everything")) n += 2;
    return n;
  };
  return TESTIMONIALS.filter((t) => score(t) > 0)
    .map((t) => ({ t, n: score(t) }))
    .sort((x, y) => y.n - x.n)
    .map((x) => x.t);
}

function gutScore(a: QuizAnswers): number {
  let score = 82;
  score -= a.symptoms.length * 6;
  if (a.stool && ["runny", "soft", "varies"].includes(a.stool)) score -= 10;
  if (a.pooFreq && ["more", "irregular", "none"].includes(a.pooFreq)) score -= 6;
  if (a.wind === "often") score -= 8;
  else if (a.wind === "sometimes") score -= 3;
  if (a.duration === "gt1y") score -= 10;
  else if (a.duration === "6to12m") score -= 6;
  const triedCount = a.tried.filter((t) => t !== "nothing").length;
  score -= Math.min(triedCount * 3, 12);
  return Math.max(18, Math.min(74, score));
}

function ratingFor(score: number): string {
  if (score < 40) return "Significantly out of balance";
  if (score < 58) return "Out of balance";
  return "Mildly out of balance";
}

function rootCausesFor(a: QuizAnswers): RootCause[] {
  const mechanism = hasSkinSignal(a)
    ? "The skin–gut axis"
    : a.symptoms.includes("gunky-ears")
    ? "Yeast & gut balance"
    : "Digestive imbalance";
  const triedCount = a.tried.filter((t) => t !== "nothing").length;
  return [
    { label: "Likely root cause", value: "Gut microbiome imbalance" },
    { label: "The mechanism", value: mechanism },
    {
      label: "Why it keeps coming back",
      value: triedCount >= 2 ? "Surface fixes, not the cause" : "Untreated at the source",
    },
    {
      label: "How long it's been building",
      value:
        a.duration === "gt1y" ? "Over a year"
        : a.duration === "6to12m" ? "6–12 months"
        : a.duration === "1to6m" ? "1–6 months"
        : "Recent",
    },
  ];
}

export function buildRecommendation(a: QuizAnswers): Recommendation {
  const symptoms = a.symptoms.map(symptomById);
  const dog = a.dogName.trim() || "your dog";
  const score = gutScore(a);
  const list = joinNouns(symptoms.map((s) => s.noun));
  const many = symptoms.length > 1;
  return {
    symptoms,
    hero: PRODUCTS.probioPlus,
    upsell: hasSkinSignal(a) ? PRODUCTS.skinGutDuo : null,
    proof: matchedProof(a).slice(0, 6),
    smallDog: a.size === "toy" || a.size === "small",
    triedBefore: a.tried.some((t) => t !== "nothing"),
    dose: a.size ? DOSE_BY_SIZE[a.size] : "the right daily dose",
    beforeAfterKind: beforeAfterKind(a),
    gutScore: score,
    rating: ratingFor(score),
    verdict: `We looked at everything you told us about ${dog} — ${list} — and ${
      many ? "they all point" : "it points"
    } to one place: a gut that's ${ratingFor(score).toLowerCase()}.`,
    rootCauses: rootCausesFor(a),
  };
}

export { SYMPTOMS };
