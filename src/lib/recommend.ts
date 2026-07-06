import type { SymptomTag, Testimonial } from "@/data/testimonials";
import { TESTIMONIALS } from "@/data/testimonials";
import { PRODUCTS, type Product } from "@/data/products";
import { SYMPTOMS, symptomById, type Symptom } from "@/data/symptoms";

export type DogSize = "toy" | "small" | "medium" | "large";
export type AgeBand = "puppy" | "adult" | "senior";
export type Duration = "lt1m" | "1to6m" | "6to12m" | "gt1y";
export type Stool = "runny" | "soft" | "ideal" | "firm" | "hard" | "varies";
export type Wind = "rare" | "sometimes" | "often";
export type Breath = "fresh" | "sometimes" | "bad";
export type Coat = "shiny" | "normal" | "dull";
export type Energy = "bright" | "normal" | "low";
export type Grass = "no" | "sometimes" | "often";
export type Treats = "rarely" | "sometimes" | "daily";

export interface QuizAnswers {
  dogName: string;
  size: DogSize | null;
  age: AgeBand | null;
  symptoms: SymptomTag[]; // ALL selected — every one is used to tailor the plan
  // Diet
  diet: string | null;
  treats: Treats | null;
  // Owner-observable gut signals (the broader diagnostic — not just stool)
  breath: Breath | null;
  coat: Coat | null;
  energy: Energy | null;
  grass: Grass | null;
  wind: Wind | null;
  stool: Stool | null;
  // Timeline + history
  duration: Duration | null;
  tried: string[];
}

export const emptyAnswers: QuizAnswers = {
  dogName: "",
  size: null,
  age: null,
  symptoms: [],
  diet: null,
  treats: null,
  breath: null,
  coat: null,
  energy: null,
  grass: null,
  wind: null,
  stool: null,
  duration: null,
  tried: [],
};

export const SIZE_LABEL: Record<DogSize, string> = {
  toy: "Toy — under 10kg",
  small: "Small — 10–20kg",
  medium: "Medium — 20–40kg",
  large: "Large — over 40kg",
};

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
  symptoms: Symptom[];
  hero: Product;
  upsell: Product | null;
  proof: Testimonial[];
  smallDog: boolean;
  triedBefore: boolean;
  dose: string;
  beforeAfterKind: "skin" | "ears";
  // Diagnosis
  gutScore: number; // 0–100 (lower = more imbalance)
  rating: string;
  verdict: string;
  rootCauses: RootCause[];
  signals: string[]; // the concerning signs we detected — evidence for the diagnosis
}

const SKIN_SYMPTOMS: SymptomTag[] = ["itchy-skin", "paw-licking"];

export function hasSkinSignal(a: QuizAnswers): boolean {
  return a.symptoms.some((s) => SKIN_SYMPTOMS.includes(s));
}

export function beforeAfterKind(a: QuizAnswers): "skin" | "ears" {
  if (hasSkinSignal(a)) return "skin";
  if (a.symptoms.includes("gunky-ears")) return "ears";
  return "skin";
}

function joinNouns(nouns: string[]): string {
  if (nouns.length === 0) return "the symptoms you mentioned";
  if (nouns.length === 1) return nouns[0];
  if (nouns.length === 2) return `${nouns[0]} and ${nouns[1]}`;
  return `${nouns.slice(0, -1).join(", ")} and ${nouns[nouns.length - 1]}`;
}

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

/**
 * Multi-factor gut-health score. Draws on the whole picture — symptoms plus the
 * owner-observable signals (breath, coat, energy, grass, wind, stool), diet and
 * how long it's gone on — so the diagnosis reads as genuinely computed, not guessed.
 */
function gutScore(a: QuizAnswers): number {
  let s = 88;
  s -= a.symptoms.length * 5;
  if (a.breath === "bad") s -= 8;
  else if (a.breath === "sometimes") s -= 3;
  if (a.coat === "dull") s -= 6;
  else if (a.coat === "shiny") s += 3;
  if (a.energy === "low") s -= 7;
  else if (a.energy === "bright") s += 3;
  if (a.grass === "often") s -= 5;
  else if (a.grass === "sometimes") s -= 2;
  if (a.wind === "often") s -= 6;
  else if (a.wind === "sometimes") s -= 2;
  if (a.stool && ["runny", "soft", "varies"].includes(a.stool)) s -= 8;
  if (a.duration === "gt1y") s -= 8;
  else if (a.duration === "6to12m") s -= 5;
  if (a.treats === "daily") s -= 4;
  else if (a.treats === "sometimes") s -= 1;
  if (a.diet === "kibble") s -= 2;
  const tried = a.tried.filter((t) => t !== "nothing").length;
  s -= Math.min(tried * 2, 8);
  return Math.max(20, Math.min(78, s));
}

function ratingFor(score: number): string {
  if (score < 40) return "Significantly out of balance";
  if (score < 58) return "Out of balance";
  return "Mildly out of balance";
}

/** The concerning signs we picked up — shown as evidence on the result. */
function signalsFor(a: QuizAnswers): string[] {
  const out: string[] = [];
  a.symptoms.forEach((id) => out.push(symptomById(id).noun));
  if (a.breath === "bad") out.push("bad breath");
  if (a.coat === "dull") out.push("a dull or flaky coat");
  if (a.energy === "low") out.push("low energy or mood");
  if (a.grass === "often") out.push("eating grass often");
  if (a.wind === "often") out.push("frequent, smelly wind");
  if (a.stool && ["runny", "soft", "varies"].includes(a.stool)) out.push("soft or unsettled stools");
  return out;
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
  const signals = signalsFor(a);
  const list = joinNouns(signals.length ? signals : symptoms.map((s) => s.noun));
  const many = signals.length > 1;
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
      many ? "together they point" : "it points"
    } to one place: a gut that's ${ratingFor(score).toLowerCase()}.`,
    rootCauses: rootCausesFor(a),
    signals,
  };
}

export { SYMPTOMS };
