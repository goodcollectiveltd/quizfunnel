// The six quiz symptoms. Each entry drives BOTH the quiz option AND its own
// tailored relief lander (/relief/:slug). Copy is grounded in the messaging bank
// (company-context/messaging-bank.md) — benefit-led headlines mapped to the top
// symptoms, never medical/cure claims. Order = survey prevalence.

import type { SymptomTag } from "./testimonials";
import type { ProductKey } from "./products";

export interface Symptom {
  id: SymptomTag;
  slug: string; // lander route: /relief/:slug
  emoji: string;
  // Quiz card
  label: string; // multi-select option
  noun: string; // short noun for natural lists, e.g. "paw licking"
  short: string; // one-line "the itch that…" descriptor
  // Lander
  eyebrow: string; // small kicker above the H1
  headline: string; // lander H1 — benefit-led
  subhead: string; // supporting promise
  agitate: string; // the pain, in the owner's world
  recommend: ProductKey; // hero product for this symptom — always 5 Strain Probiotic+
  skinUpsell: boolean; // offer the Omega / Skin & Gut Duo add-on
  // 3:2 photo for the "Sound familiar?" section. Optional: scooting & tear-staining
  // have no usable stock, so those landers stay text-only there.
  image?: string;
  // Real customer before/after (ears only) — a dedicated proof block.
  beforeAfter?: { image: string; caption: string };
}

export const SYMPTOMS: Symptom[] = [
  {
    id: "paw-licking",
    slug: "paw-licking",
    emoji: "🐾",
    label: "Licking or chewing his paws",
    noun: "paw licking",
    short: "That wet, repetitive licking while you're trying to watch telly.",
    eyebrow: "Paw licking & chewing",
    headline: "Still licking his paws? It might not be his skin. It might be his gut.",
    subhead:
      "The constant lick-chew-lick loop is one of the first things to settle once the gut is back in balance. See why, and the dogs it's already worked for.",
    agitate:
      "You've cleaned his paws, changed his food, maybe been to the vet, and he's still at it. The licking isn't a habit. It's usually the skin flaring from the inside out.",
    recommend: "probioPlus",
    skinUpsell: true,
    image: "/images/symptoms/paw-licking.jpg",
  },
  {
    id: "itchy-skin",
    slug: "itchy-skin",
    emoji: "🔴",
    label: "Itchy skin & scratching",
    noun: "itchy skin",
    short: "The itch no cream, spray or vet visit could fix.",
    eyebrow: "Itchy, scratchy skin",
    headline: "The itch that no cream, spray or vet visit could fix.",
    subhead:
      "When the scratching won't stop, the answer often isn't another lotion. It's calming the gut that's driving the flare. Feed the skin from the inside.",
    agitate:
      "You've watched him scratch himself raw. You've tried the sprays, the shampoos, maybe steroids or Apoquel. It quietens down, then it's back. The relief never lasts.",
    recommend: "probioPlus",
    skinUpsell: true,
    image: "/images/symptoms/itchy-skin.jpg",
  },
  {
    id: "gunky-ears",
    slug: "gunky-ears",
    emoji: "👂",
    label: "Gunky or smelly ears",
    noun: "gunky ears",
    short: "The head-shaking and the smell you can't get rid of.",
    eyebrow: "Gunky, smelly ears",
    headline: "Clean, clear ears in weeks, without another round of ear drops.",
    subhead:
      "The head-shaking, the black gunk, the smell. Owners tell us it's one of the fastest things to turn around once the gut is supported.",
    agitate:
      "You clean them and days later they're gunky and smelly again. More drops, more vet trips, and the head-shaking never really stops. It's exhausting, for both of you.",
    recommend: "probioPlus",
    skinUpsell: false,
    image: "/images/symptoms/gunky-ears.jpg",
    beforeAfter: {
      image: "/images/symptoms/gunky-ears-before-after.jpg",
      caption: "Murphy's ear, a 30-day transformation on Good for Pets.",
    },
  },
  {
    id: "tummy",
    slug: "tummy",
    emoji: "💩",
    label: "Sensitive tummy / messy poos",
    noun: "tummy troubles",
    short: "Sloppy poos, wind, and a tummy that never settles.",
    eyebrow: "Sensitive tummy",
    headline: "Firmer poos, calmer tummy, happier dog.",
    subhead:
      "Sloppy stools, wind and an unsettled gut are exactly what 5 billion live bacteria a day are built to help. Many owners see firmer poos within a couple of weeks.",
    agitate:
      "The sloppy poos, the rumbling tummy, the wind. You're second-guessing every meal and never quite sure what's setting him off.",
    recommend: "probioPlus",
    skinUpsell: false,
    image: "/images/symptoms/tummy.jpg",
  },
  {
    id: "scooting",
    slug: "scooting",
    emoji: "🐕",
    label: "Scooting / anal gland trouble",
    noun: "scooting",
    short: "The bum-shuffle across your carpet.",
    eyebrow: "Scooting & anal glands",
    headline: "Less scooting, settled glands, no more bum-shuffle across the carpet.",
    subhead:
      "Firmer, healthier stools help the glands empty naturally. Owners tell us the scooting eases off within a couple of weeks of a settled gut.",
    agitate:
      "The scoot across the carpet, the repeat trips to have his glands emptied. It's the kind of thing that never fully goes away, until the gut and the stools are right.",
    recommend: "probioPlus",
    skinUpsell: false,
  },
  {
    id: "tear-staining",
    slug: "tear-staining",
    emoji: "✨",
    label: "Tear staining / weepy eyes",
    noun: "tear staining",
    short: "The rusty stains under his eyes.",
    eyebrow: "Tear staining",
    headline: "Clearer eyes, less staining: the whole-dog glow-up owners keep noticing.",
    subhead:
      "Tear staining is one of those 'and another thing' wins owners mention once the gut settles: clearer eyes, less weeping, brighter overall.",
    agitate:
      "The rusty stains under his eyes that no amount of wiping shifts. It's not just cosmetic. It's usually one more sign the system's out of balance.",
    recommend: "probioPlus",
    skinUpsell: false,
  },
];

export const symptomBySlug = (slug: string) =>
  SYMPTOMS.find((s) => s.slug === slug);
export const symptomById = (id: SymptomTag) =>
  SYMPTOMS.find((s) => s.id === id)!;
