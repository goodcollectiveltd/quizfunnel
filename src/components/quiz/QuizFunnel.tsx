import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TrustBar } from "@/components/ui/TrustBar";
import { StarRating } from "@/components/ui/StarRating";
import { SYMPTOMS, symptomById } from "@/data/symptoms";
import { HOOK_TESTIMONIAL, SCOOTING_PROOF, TESTIMONIALS, type SymptomTag } from "@/data/testimonials";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { getAttribution } from "@/lib/tracking";
import {
  beforeAfterKind,
  emptyAnswers,
  SIZE_LABEL,
  type DogSize,
  type Goal,
  type QuizAnswers,
  type Stool,
  type TriedOutcome,
} from "@/lib/recommend";
import { Analysing } from "./Analysing";
import { Result } from "./Result";
import { track } from "@/lib/tracking";

/* ------------------------- entry-symptom targeting ------------------------- */

/**
 * Symptom-led ads link with ?symptom=<id> (e.g. ?symptom=scooting) and the funnel
 * continues that ad's thought (Nick's rule: never let them land and think "what
 * did I click?"). Adapts the landing headline, floats + pre-ticks the symptom on
 * the checklist, and unlocks symptom-specific proof. Falls back to the persisted
 * attribution so a mid-quiz refresh keeps the targeting. Invalid values → null →
 * the generic funnel, unchanged.
 */
function readEntrySymptom(): SymptomTag | null {
  try {
    const raw = new URLSearchParams(window.location.search).get("symptom") ?? getAttribution().symptom;
    return SYMPTOMS.some((s) => s.id === raw) ? (raw as SymptomTag) : null;
  } catch {
    return null;
  }
}
// DEFAULT ENTRY = SCOOTING (Will, 13 Jul 2026): the only traffic for now is the
// "party trick" scooting ads, so bare quiz.goodforpets.co gets the full scooting
// experience even if the ad link drops the param. ?symptom=<id> still overrides
// for future ad angles; remove the fallback when traffic diversifies.
const ENTRY_SYMPTOM = readEntrySymptom() ?? "scooting";

// The symptom phrase dropped into the landing H1 ("Find the root cause of your dog's …").
const ENTRY_H1: Record<SymptomTag, string> = {
  "paw-licking": "paw licking & chewing",
  "itchy-skin": "itching & scratching",
  "gunky-ears": "gunky, smelly ears",
  tummy: "sloppy poos & unsettled tummy",
  scooting: "scooting & gland trouble",
  "tear-staining": "tear stains & weepy eyes",
};

// Full landing takeover for entries whose AD we know (keep-the-hook rule: the
// lander opens with the ad's exact headline, then pays off its promise). The
// scooting entry is matched to the "party trick" static from the ad factory
// (headline verbatim; its sub promised "Here's why" — the sub + CTA deliver it).
const ENTRY_HOOK: Partial<Record<SymptomTag, {
  badge: string;
  h1: React.ReactNode;
  sub: string;
  cta: string;
  testimonialId?: string; // symptom-matched hook review (falls back to HOOK_TESTIMONIAL)
}>> = {
  scooting: {
    badge: "Free 60-second scooting check",
    h1: <>The carpet shuffle isn't a party <span className="text-brand-red">trick.</span></>,
    sub: "It usually starts in the gut. Answer six quick questions and we'll show you why it's happening to your dog, and how owners stop it coming back.",
    cta: "Show me why →",
    testimonialId: "R6", // Elaine — "no more scooting or grass eating", real photo
  },
};

/* ------------------------------- options ------------------------------- */

// The emotional lead-in: she names the outcome she wants, then the "you're in the
// right place" card validates it (Mars-Men desire → validation beat). The options
// come ONLY from the symptoms she ticked — offering wins she never asked about
// breaks the "we heard you" thread — plus the universal "happy again" closer.
const GOAL_OPTION: Record<Goal, { label: string; emoji: string }> = {
  paws: { label: "No more paw licking or chewing", emoji: "🐾" },
  skin: { label: "Calm, itch-free skin", emoji: "🧴" },
  ears: { label: "Clean, comfortable ears", emoji: "👂" },
  tummy: { label: "A settled tummy & firmer poos", emoji: "💩" },
  scooting: { label: "No more scooting across the carpet", emoji: "🛋️" },
  tears: { label: "Clear, bright eyes", emoji: "✨" },
  happy: { label: "Just my dog, happy again", emoji: "💛" },
};
const GOAL_BY_SYMPTOM: Record<SymptomTag, Goal> = {
  "paw-licking": "paws",
  "itchy-skin": "skin",
  "gunky-ears": "ears",
  tummy: "tummy",
  scooting: "scooting",
  "tear-staining": "tears",
};
/** Goal options for HER symptoms, in her tick order, closed by "happy again". */
function goalsFor(a: QuizAnswers): { id: Goal; label: string; emoji: string }[] {
  const ids: Goal[] = [];
  a.symptoms.forEach((s) => {
    const g = GOAL_BY_SYMPTOM[s];
    if (!ids.includes(g)) ids.push(g);
  });
  ids.push("happy");
  return ids.map((id) => ({ id, ...GOAL_OPTION[id] }));
}
// One-liner the confirmation card echoes back, so it reflects what they just said.
const GOAL_ECHO: Record<Goal, string> = {
  paws: "No more licking, chewing, red-raw paws. Just calm and comfortable.",
  skin: "Calm, itch-free skin is absolutely within reach.",
  ears: "Clean, comfortable ears. Yes, really.",
  tummy: "A settled tummy and firmer poos. That's the goal.",
  scooting: "No more bum-shuffling across the carpet. Settled and comfortable again.",
  tears: "Brighter eyes, less staining. It's one of the first things owners notice.",
  happy: "Your dog, back to their bright, happy self.",
};
// Confirmation-card image per goal. Skin & ears are REAL customer before/afters
// (Bear, Murphy); the rest are honest aspirational shots (no fake before/after
// labels). Scooting has no photo asset at all, so its proof is a real REVIEW
// (SCOOTING_PROOF) — rendered as a testimonial card instead of an image.
const GOAL_CARD: Partial<Record<Goal, { img: string; beforeAfter: boolean; vertical?: boolean; name?: string; caption: string }>> = {
  skin: { img: "/images/symptoms/itchy-skin-before-after.jpg", beforeAfter: true, name: "Bear", caption: "Bear's skin, before and after Good for Pets." },
  ears: { img: "/images/symptoms/gunky-ears-before-after.jpg", beforeAfter: true, vertical: true, name: "Murphy", caption: "Murphy's ear, a 30-day transformation on Good for Pets." },
  paws: { img: "/images/goals/goal-paws.jpg", beforeAfter: false, caption: "Calm, comfortable, and no longer chewing at those paws." },
  tummy: { img: "/images/goals/goal-tummy.jpg", beforeAfter: false, caption: "Settled, relaxed and easy in their own tummy again." },
  happy: { img: "/images/goals/goal-happy.jpg", beforeAfter: false, caption: "Back to their bright, happy self." },
};
// Plain-English stool check (was a 6-option numbered Bristol scale — too long and
// clinical; same underlying values, so scoring is unchanged).
const STOOL: { id: Stool; label: string; emoji: string }[] = [
  { id: "ideal", label: "Usually solid and easy to pick up", emoji: "👍" },
  { id: "soft", label: "Often soft or sloppy", emoji: "😕" },
  { id: "runny", label: "Loose or runny more than not", emoji: "😖" },
  { id: "varies", label: "Honestly, it varies a lot", emoji: "🎲" },
];
// The universal impact beat: one emotional question that treats everything she
// ticked as ONE weight — no symptom ranked above another. Options in Sue's VOC.
const IMPACT: { id: string; label: string; emoji: string }[] = [
  { id: "constant-worry", label: "It's a constant background worry", emoji: "🫤" },
  { id: "upsetting", label: "Some days it's honestly upsetting to watch", emoji: "💔" },
  { id: "taken-over", label: "We've been fighting it for ages, it's exhausting", emoji: "😮‍💨" },
  { id: "early", label: "Mild so far, I want it sorted before it grows", emoji: "🌱" },
];
// Ad-continuity variant of the impact beat: when she arrived from a symptom ad
// (?symptom=), the question speaks that ad's language (Mars-Men style, sufferer
// wording). Used ONLY for the entry symptom — never to rank her list.
const SYMPTOM_DEPTH: Record<SymptomTag, { title: (dog: string) => string; options: { id: string; label: string }[] }> = {
  "paw-licking": {
    title: (d) => `When is ${d}'s licking at its worst?`,
    options: [
      { id: "evenings", label: "Evenings, that wet licking sound while you're trying to relax" },
      { id: "after-walks", label: "After walks or being outside" },
      { id: "night", label: "Through the night" },
      { id: "constant", label: "Honestly, it's constant" },
    ],
  },
  "itchy-skin": {
    title: (d) => `How bad is ${d}'s scratching right now?`,
    options: [
      { id: "raw", label: "Scratched red or raw in places" },
      { id: "daily", label: "Many times a day, every day" },
      { id: "flares", label: "It comes in flares, some weeks are terrible" },
      { id: "mild", label: "Mild, but it never fully goes" },
    ],
  },
  "gunky-ears": {
    title: (d) => `What are ${d}'s ears like at the moment?`,
    options: [
      { id: "gunk-smell", label: "Dark gunk and a smell that comes straight back" },
      { id: "head-shaking", label: "Constant head shaking and scratching at them" },
      { id: "recurring", label: "They clear up, then it's back within days" },
      { id: "red-sore", label: "Red and sore inside" },
    ],
  },
  tummy: {
    title: (d) => `What does a bad day look like for ${d}'s tummy?`,
    options: [
      { id: "sloppy", label: "Sloppy or runny poos" },
      { id: "wind", label: "Awful, room-clearing wind" },
      { id: "grass", label: "Off their food, or eating grass" },
      { id: "unpredictable", label: "We never know which day it'll be" },
    ],
  },
  scooting: {
    title: (d) => `How often is ${d} scooting?`,
    options: [
      { id: "daily", label: "Most days, across the carpet" },
      { id: "weekly", label: "Most weeks" },
      { id: "after-poos", label: "Mostly after poos" },
      { id: "vet-glands", label: "We're at the vet for their glands regularly" },
    ],
  },
  "tear-staining": {
    title: (d) => `What are ${d}'s eyes like?`,
    options: [
      { id: "rusty", label: "Rusty stains that wiping never shifts" },
      { id: "weepy", label: "Weepy most days" },
      { id: "gunky", label: "Gunky corners every morning" },
      { id: "worse", label: "Slowly getting worse" },
    ],
  },
};
const TRIED: { id: string; label: string }[] = [
  { id: "antibiotics", label: "Vet-prescribed antibiotics" },
  { id: "steroids", label: "Steroids / Apoquel" },
  { id: "topical", label: "Creams, sprays or shampoos" },
  { id: "chews", label: "Allergy chews / baked chews" },
  { id: "diet", label: "Special / hypoallergenic diet" },
  { id: "probiotic", label: "Another probiotic or supplement" },
  { id: "nothing", label: "Nothing yet, this is our first go" },
];
const TRIED_OUTCOME: { id: TriedOutcome; label: string; emoji: string }[] = [
  { id: "none", label: "No, no real difference", emoji: "😞" },
  { id: "temporary", label: "A little, but it came straight back", emoji: "🔁" },
  { id: "faded", label: "It worked for a while, then stopped", emoji: "📉" },
  { id: "mixed", label: "Some things helped, some didn't", emoji: "🤷" },
];
const TRIED_EXPLAINERS: Record<string, { title: string; body: string }> = {
  antibiotics: {
    title: "Antibiotics wipe out the good too",
    body: "They kill bad AND good bacteria, a sledgehammer where you need a scalpel. When the course ends, the bad bugs often surge back, because there's no good bacteria left to keep them in check. The gut needs rebuilding, not bombing.",
  },
  steroids: {
    title: "Steroids & Apoquel just mask it",
    body: "They quieten the immune response, so the itch calms, but the moment they stop, it's usually back, because the driver in the gut was never addressed. A band-aid on a leaky pipe.",
  },
  topical: {
    title: "Creams treat the surface only",
    body: "Sprays and shampoos work on the skin. If it keeps coming back, the cause is almost always internal, which is why it never fully clears.",
  },
  chews: {
    title: "Baked chews are mostly dead on arrival",
    body: "Most chews are baked, and the heat kills the live bacteria before they reach the gut. They're often padded with fillers and sugars that feed the bad bugs. Ours are cold-pressed, so 5 billion actually survive.",
  },
  diet: {
    title: "A special diet alone can't rebuild the gut",
    body: "Changing food can ease things for a while, but without restoring the balance of good bacteria, the same issues resurface. It's clean water poured into a polluted pool. The imbalance is still there.",
  },
  probiotic: {
    title: "Not all probiotics reach the gut",
    body: "Many are underdosed or heat-treated and pass straight through. Strength and format matter. Ours is 5 billion live CFU per capsule, cold-pressed and human-grade.",
  },
};

/* ------------------------------- engine ------------------------------- */

type StepKey =
  | "symptoms" | "impact" | "goal" | "card-beforeafter" | "size" | "stool"
  | "tried" | "tried-outcome" | "card-tried" | "card-firsttimer";

const QUESTION_KEYS: StepKey[] = [
  "symptoms", "impact", "goal", "size", "stool", "tried", "tried-outcome",
];

/**
 * Cold-traffic acquisition arc — every step buys conversion, and no symptom is
 * ranked above another: tick the symptoms (tension) → ONE emotional impact beat
 * that treats everything ticked as one weight (ad-specific wording when she came
 * from a symptom ad) → state the desire (goal) → proof card validates it →
 * size + poos (authority) → tried sequence (vindication).
 */
function buildSequence(a: QuizAnswers): StepKey[] {
  const seq: StepKey[] = ["symptoms", "impact", "goal", "card-beforeafter", "size", "stool", "tried"];
  const triedSomething = a.tried.some((t) => t !== "nothing");
  if (triedSomething) {
    // If they've tried something, ask how it went, then disarm it.
    seq.push("tried-outcome");
    if (a.tried.some((t) => TRIED_EXPLAINERS[t])) seq.push("card-tried");
  } else if (a.tried.includes("nothing")) {
    // First-timers get a positive "you're starting at the source" reframe instead.
    seq.push("card-firsttimer");
  }
  return seq;
}

export function QuizFunnel() {
  const [phase, setPhase] = useState<"hook" | "quiz" | "analysing" | "result">("hook");
  const [idx, setIdx] = useState(0);
  // A symptom-led entry arrives with their symptom already ticked — the ad told
  // us; making her re-declare it is friction. She can untick it if we're wrong.
  const [a, setA] = useState<QuizAnswers>(
    ENTRY_SYMPTOM ? { ...emptyAnswers, symptoms: [ENTRY_SYMPTOM] } : emptyAnswers,
  );
  const update = (patch: Partial<QuizAnswers>) => setA((p) => ({ ...p, ...patch }));

  const seq = useMemo(() => buildSequence(a), [a]);
  const key = seq[idx];
  const dog = a.dogName.trim() || "your dog";

  // Per-step event → PostHog funnel shows question-by-question drop-off. Each step
  // (questions AND the interstitial cards) fires once as it comes into view.
  useEffect(() => {
    if (phase !== "quiz") return;
    track("quiz_step_viewed", { step: key, index: idx });
  }, [phase, key, idx]);

  const next = () => {
    if (idx >= seq.length - 1) {
      track("quiz_completed", { symptoms: a.symptoms.length });
      setPhase("analysing");
    } else setIdx((i) => i + 1);
  };
  const back = () => {
    if (idx === 0) setPhase("hook");
    else setIdx((i) => i - 1);
  };

  if (phase === "hook")
    return <Hook a={a} update={update} onStart={() => { track("quiz_start"); setPhase("quiz"); }} />;
  if (phase === "analysing") return <Analysing dog={dog} onDone={() => setPhase("result")} />;
  if (phase === "result") return <Result answers={a} />;

  const qDone = seq.slice(0, idx + 1).filter((k) => QUESTION_KEYS.includes(k)).length;
  // The "tried" question adds one follow-up (did it work?) only once it's answered.
  // Until then, assume it so the bar can't hit 100% on "tried" and then jump backwards.
  const triedAnswered = a.tried.length > 0;
  const qTotal = seq.filter((k) => QUESTION_KEYS.includes(k)).length + (triedAnswered ? 0 : 1);

  return (
    <div className="min-h-dvh">
      <QuizHeader done={qDone} total={qTotal} onBack={back} />
      <main className="container-page pb-16 pt-6">
        {key === "symptoms" && <SymptomsStep a={a} update={update} onNext={next} />}
        {key === "impact" && (() => {
          // Ad-continuity wording when she came from a symptom ad AND kept that
          // symptom ticked; otherwise the universal all-symptoms impact beat.
          const entryDepth = ENTRY_SYMPTOM && a.symptoms.includes(ENTRY_SYMPTOM) ? SYMPTOM_DEPTH[ENTRY_SYMPTOM] : null;
          return entryDepth ? (
            <SingleStep title={entryDepth.title(dog)} eyebrow="We hear this a lot"
              options={entryDepth.options} value={a.symptomSeverity}
              onPick={(v) => { update({ symptomSeverity: v }); next(); }} />
          ) : (
            <SingleStep title="How much is it affecting you both, day to day?" eyebrow="Be honest"
              options={IMPACT} value={a.symptomSeverity}
              onPick={(v) => { update({ symptomSeverity: v }); next(); }} />
          );
        })()}
        {key === "goal" && (
          <SingleStep title={`What would mean the most for ${dog}?`} eyebrow="Picture the win"
            sub="Pick the one that matters most. (We build the plan around everything else too.)"
            options={goalsFor(a)} value={a.goal} onPick={(v) => { update({ goal: v as Goal }); next(); }} />
        )}
        {key === "size" && (
          <SingleStep title={`How big is ${dog}?`} sub="So we get the daily dose right."
            options={(["toy","small","medium","large"] as DogSize[]).map((s) => ({ id: s, label: SIZE_LABEL[s] }))}
            value={a.size} onPick={(v) => { update({ size: v as DogSize }); next(); }} />
        )}
        {key === "stool" && (
          <SingleStep title={`And ${dog}'s poos, how are they most days?`} eyebrow="The classic gut check"
            rationale="The clearest everyday window into gut balance."
            options={STOOL} value={a.stool} onPick={(v) => { update({ stool: v as Stool }); next(); }} />
        )}
        {key === "card-beforeafter" && <BeforeAfterCard a={a} dog={dog} onNext={next} />}
        {key === "card-firsttimer" && <FirstTimerCard dog={dog} onNext={next} />}
        {key === "tried" && <TriedStep a={a} dog={dog} update={update} onNext={next} />}
        {key === "tried-outcome" && (
          <SingleStep title={`Did any of it actually work for ${dog}?`} eyebrow="What you've tried"
            options={TRIED_OUTCOME} value={a.triedOutcome} onPick={(v) => { update({ triedOutcome: v as TriedOutcome }); next(); }} />
        )}
        {key === "card-tried" && <TriedExplainerCard a={a} dog={dog} onNext={next} />}
      </main>
    </div>
  );
}

/* ------------------------------- chrome ------------------------------- */

function QuizHeader({ done, total, onBack }: { done: number; total: number; onBack: () => void }) {
  const pct = Math.round((done / total) * 100);
  return (
    <header className="sticky top-0 z-10 border-b border-brand-ink/5 bg-brand-cream/90 backdrop-blur">
      <div className="container-page flex items-center gap-3 py-3">
        <button onClick={onBack} aria-label="Back"
          className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink">←</button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-ink/10">
          <div className="h-full rounded-full bg-brand-red transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-semibold text-brand-ink/50">{pct}%</span>
      </div>
    </header>
  );
}

function StepShell({ title, sub, eyebrow, rationale, children }: { title: string; sub?: string; eyebrow?: string; rationale?: string; children: React.ReactNode }) {
  return (
    <div key={title} className="animate-fade-up">
      {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-red">{eyebrow}</p>}
      {rationale && (
        <p className="mb-3 border-l-2 border-brand-red/40 pl-3 text-sm italic text-brand-ink/55">{rationale}</p>
      )}
      <h1 className="text-2xl font-extrabold leading-snug text-brand-ink">{title}</h1>
      {sub && <p className="mt-2 text-brand-ink/60">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionCard({ active, emoji, label, sub, onClick, multi }: { active: boolean; emoji?: string; label: string; sub?: string; onClick: () => void; multi?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all ${active ? "border-brand-red shadow-card" : "border-transparent hover:border-brand-red/30"}`}>
      {emoji && <span className="text-2xl">{emoji}</span>}
      <span className="flex-1">
        <span className="block font-semibold text-brand-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-sm text-brand-ink/50">{sub}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${multi ? "rounded-md" : "rounded-full"} ${active ? "border-brand-red bg-brand-red text-white" : "border-brand-ink/20"}`}>{active && "✓"}</span>
    </button>
  );
}

function StickyNext({ disabled, onNext, label }: { disabled: boolean; onNext: () => void; label: string }) {
  return (
    <div className="sticky bottom-0 mt-8 -mx-5 bg-gradient-to-t from-brand-cream via-brand-cream to-transparent px-5 pb-5 pt-3">
      <Button onClick={onNext} disabled={disabled} className="w-full">{label}</Button>
    </div>
  );
}

/* ------------------------------- steps ------------------------------- */

function SingleStep<T extends string>({ title, sub, eyebrow, rationale, options, value, onPick }: {
  title: string; sub?: string; eyebrow?: string; rationale?: string;
  options: { id: T; label: string; emoji?: string }[]; value: T | null; onPick: (v: T) => void;
}) {
  return (
    <StepShell title={title} sub={sub} eyebrow={eyebrow} rationale={rationale}>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionCard key={o.id} active={value === o.id} emoji={o.emoji} label={o.label} onClick={() => onPick(o.id)} />
        ))}
      </div>
    </StepShell>
  );
}

function SymptomsStep({ a, update, onNext }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const toggle = (id: SymptomTag) => {
    const has = a.symptoms.includes(id);
    update({ symptoms: has ? a.symptoms.filter((s) => s !== id) : [...a.symptoms, id] });
  };
  // A symptom-led entry sees their symptom first (and already ticked) — the
  // checklist confirms the ad's promise instead of burying it mid-list.
  const list = ENTRY_SYMPTOM
    ? [symptomById(ENTRY_SYMPTOM), ...SYMPTOMS.filter((s) => s.id !== ENTRY_SYMPTOM)]
    : SYMPTOMS;
  return (
    <StepShell title="Which of these is your dog dealing with?" sub="Tick everything that sounds familiar. We build the plan around all of it.">
      <div className="space-y-3">
        {list.map((s) => (
          <OptionCard key={s.id} multi active={a.symptoms.includes(s.id)} emoji={s.emoji} label={s.label} sub={s.short} onClick={() => toggle(s.id)} />
        ))}
      </div>
      <StickyNext disabled={a.symptoms.length === 0} onNext={onNext}
        label={a.symptoms.length ? `Continue (${a.symptoms.length} selected)` : "Select at least one"} />
    </StepShell>
  );
}

function TriedStep({ a, dog, update, onNext }: { a: QuizAnswers; dog: string; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const toggle = (id: string) => {
    if (id === "nothing") { update({ tried: a.tried.includes("nothing") ? [] : ["nothing"] }); return; }
    const base = a.tried.filter((t) => t !== "nothing");
    update({ tried: base.includes(id) ? base.filter((t) => t !== id) : [...base, id] });
  };
  return (
    <StepShell title={`What have you already tried for ${dog}?`} sub="Tick all that apply. This tells us a lot.">
      <div className="space-y-3">
        {TRIED.map((o) => (
          <OptionCard key={o.id} multi active={a.tried.includes(o.id)} label={o.label} onClick={() => toggle(o.id)} />
        ))}
      </div>
      <StickyNext disabled={a.tried.length === 0} onNext={onNext} label="Continue" />
    </StepShell>
  );
}

/* ------------------------------- cards ------------------------------- */

function BeforeAfterCard({ a, dog, onNext }: { a: QuizAnswers; dog: string; onNext: () => void }) {
  // Validate the desire she just stated: echo it back, then prove it's reachable.
  // Scooting has no photo proof, so it gets a real scooting REVIEW instead of an
  // image. Otherwise the image matches the goal, falling back to the
  // symptom-derived real before/after.
  const scootingProof = a.goal === "scooting" || (!a.goal && a.symptoms.length === 1 && a.symptoms[0] === "scooting");
  const card = (a.goal && GOAL_CARD[a.goal]) || GOAL_CARD[beforeAfterKind(a)]!;
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">You're in the right place</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">10,000+ UK dogs have been here, and turned it around.</h1>
      {a.goal && <p className="mx-auto mt-3 max-w-sm font-semibold text-brand-red">{GOAL_ECHO[a.goal]}</p>}
      {scootingProof ? (
        <div className="mx-auto mt-6 max-w-[340px] text-left">
          <TestimonialCard t={SCOOTING_PROOF} />
        </div>
      ) : (
      <figure className="mx-auto mt-6 max-w-[320px]">
        <div className="relative overflow-hidden rounded-2xl shadow-card">
          <img src={card.img} alt={card.beforeAfter ? "A real dog before and after Good for Pets" : "The kind of turnaround owners see"} className="block w-full" />
          {card.beforeAfter && (
            <>
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase text-white">Before</span>
              <span className={`absolute rounded-md bg-brand-red px-2 py-0.5 text-xs font-bold uppercase text-white ${card.vertical ? "bottom-2 left-2" : "right-2 top-2"}`}>After</span>
              {card.name && <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-brand-ink shadow">{card.name}</span>}
            </>
          )}
        </div>
        <figcaption className="mt-2 text-xs text-brand-ink/55">{card.caption}</figcaption>
      </figure>
      )}
      <div className="mt-7 flex flex-col items-center gap-2">
        <StarRating />
        <p className="text-sm text-brand-ink/60">Just a few quick ones left to finish {dog}'s assessment.</p>
        <Button onClick={onNext} className="mt-2 w-full max-w-xs">Continue →</Button>
      </div>
    </div>
  );
}

function TriedExplainerCard({ a, dog, onNext }: { a: QuizAnswers; dog: string; onNext: () => void }) {
  const explainers = a.tried.map((t) => TRIED_EXPLAINERS[t]).filter(Boolean).slice(0, 2);
  return (
    <div className="animate-fade-up pt-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">Here's the thing…</span>
        <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">No wonder it hasn't stuck for {dog}.</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-brand-ink/60">It's not that you didn't try hard enough. It's that these couldn't fix what's actually going on.</p>
      </div>
      <div className="mt-6 space-y-4">
        {explainers.map((e) => (
          <div key={e.title} className="rounded-2xl bg-white p-5 shadow-card">
            <p className="font-bold text-brand-ink">{e.title}</p>
            <p className="mt-1 text-[15px] leading-relaxed text-brand-ink/75">{e.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8"><Button onClick={onNext} className="w-full">Show me what actually works →</Button></div>
    </div>
  );
}

function FirstTimerCard({ dog, onNext }: { dog: string; onNext: () => void }) {
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-sky/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink">Good news</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">Starting fresh is actually the smart move.</h1>
      <p className="mx-auto mt-3 max-w-sm text-brand-ink/70">
        Most owners spend months on symptom treatments before anyone mentions the gut. Beginning at the root cause means {dog} skips the trial-and-error. You're not undoing damage from things that never worked.
      </p>
      <div className="mt-8"><Button onClick={onNext} className="w-full max-w-xs">Show me {dog}'s plan →</Button></div>
    </div>
  );
}

/* ------------------------------- hook (landing) ------------------------------- */

function Hook({ a, update, onStart }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onStart: () => void }) {
  // Ad-matched landing takeover when we know the creative behind this entry;
  // otherwise the generic hook (with the symptom phrase swapped in if targeted).
  const entryHook = ENTRY_SYMPTOM ? ENTRY_HOOK[ENTRY_SYMPTOM] : undefined;
  const t = (entryHook?.testimonialId && TESTIMONIALS.find((r) => r.id === entryHook.testimonialId)) || HOOK_TESTIMONIAL;
  const initials = t.author.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="min-h-dvh">
      <header className="container-page flex justify-center py-5"><Logo /></header>
      <main className="container-page flex flex-col pb-16 pt-2">
        <div className="text-center">
          <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">{entryHook?.badge ?? "Free 60-second vet-guided assessment"}</span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-[1.1] text-brand-ink sm:text-4xl">
            {entryHook ? entryHook.h1 : (
              <>Find the <span className="text-brand-red">root cause</span> of your dog's {ENTRY_SYMPTOM ? ENTRY_H1[ENTRY_SYMPTOM] : "itching, licking & gunky ears"}.</>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-brand-ink/70">
            {entryHook?.sub ?? "This quick assessment reads your dog's symptoms, gut signals and history to work out what's really driving it, then shows you the exact plan. It usually starts in the gut."}
          </p>
        </div>

        {/* Testimonial (Mars-Men style) */}
        <figure className="mt-6 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card">
          {t.image ? (
            <img src={t.image} alt={`${t.author}'s dog`} className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-red/15" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-xs font-bold text-brand-red">{initials}</span>
          )}
          <div>
            <StarRating className="mb-1" />
            <blockquote className="text-[15px] italic leading-snug text-brand-ink/90">"{t.quote}"</blockquote>
            <figcaption className="mt-1 text-xs font-semibold text-brand-ink/60">
              {t.author} · Verified review ✓
            </figcaption>
          </div>
        </figure>

        {/* First question — on the landing page */}
        <div className="mt-8">
          <label className="block text-lg font-extrabold text-brand-ink">First up, what's your dog's name?</label>
          <p className="mt-1 text-sm text-brand-ink/60">We'll build the whole assessment around them.</p>
          <input autoFocus value={a.dogName} onChange={(e) => update({ dogName: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onStart()} placeholder="e.g. Bella" maxLength={24}
            className="mt-3 w-full rounded-2xl border-2 border-brand-ink/15 bg-white px-4 py-4 text-lg font-semibold text-brand-ink outline-none placeholder:text-brand-ink/30 focus:border-brand-red" />
          <Button onClick={onStart} className="mt-4 w-full">{entryHook?.cta ?? "Start the assessment →"}</Button>
          <p className="mt-3 text-center text-xs text-brand-ink/50">Guided by our vet, Dr Kishan Vara · No email needed to see your result</p>
        </div>

        <div className="mt-8 border-t border-brand-ink/10 pt-6"><TrustBar /></div>
      </main>
    </div>
  );
}
