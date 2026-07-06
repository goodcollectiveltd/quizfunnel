import { useMemo, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TrustBar } from "@/components/ui/TrustBar";
import { StarRating } from "@/components/ui/StarRating";
import { SYMPTOMS } from "@/data/symptoms";
import { byId, avatarFor, type SymptomTag } from "@/data/testimonials";
import {
  beforeAfterKind,
  emptyAnswers,
  SIZE_LABEL,
  type AgeBand,
  type Breath,
  type Coat,
  type DogSize,
  type Duration,
  type Energy,
  type Grass,
  type QuizAnswers,
  type Spend,
  type Stool,
  type Treats,
  type TriedOutcome,
  type Wind,
} from "@/lib/recommend";
import { Analysing } from "./Analysing";
import { Result } from "./Result";
import { track } from "@/lib/tracking";

/* ------------------------------- options ------------------------------- */

const AGES: { id: AgeBand; label: string }[] = [
  { id: "puppy", label: "Puppy — under 1 year" },
  { id: "adult", label: "Adult — 1 to 8 years" },
  { id: "senior", label: "Senior — 8 years+" },
];
const DIET: { id: string; label: string }[] = [
  { id: "raw", label: "Raw or fresh food" },
  { id: "kibble", label: "Dry kibble" },
  { id: "wet", label: "Wet / tinned food" },
  { id: "mix", label: "A mix" },
];
const TREATS: { id: Treats; label: string }[] = [
  { id: "rarely", label: "Rarely — the odd one" },
  { id: "sometimes", label: "A few times a week" },
  { id: "daily", label: "Daily — treats or table scraps" },
];
const BREATH: { id: Breath; label: string; emoji: string }[] = [
  { id: "fresh", label: "Normal — nothing unusual", emoji: "🌿" },
  { id: "sometimes", label: "A bit whiffy sometimes", emoji: "😬" },
  { id: "bad", label: "Often strong or bad", emoji: "🤢" },
];
const COAT: { id: Coat; label: string; emoji: string }[] = [
  { id: "shiny", label: "Shiny and healthy", emoji: "✨" },
  { id: "normal", label: "Alright — nothing special", emoji: "🐕" },
  { id: "dull", label: "Dull, dry or flaky", emoji: "🍂" },
];
const ENERGY: { id: Energy; label: string; emoji: string }[] = [
  { id: "bright", label: "Bright and playful", emoji: "⚡" },
  { id: "normal", label: "About normal", emoji: "🙂" },
  { id: "low", label: "Flat, tired or low mood", emoji: "😔" },
];
const GRASS: { id: Grass; label: string; emoji: string }[] = [
  { id: "no", label: "Rarely or never", emoji: "🚫" },
  { id: "sometimes", label: "Now and then", emoji: "🌱" },
  { id: "often", label: "A lot", emoji: "🌾" },
];
const WIND: { id: Wind; label: string; emoji: string }[] = [
  { id: "rare", label: "Rarely", emoji: "🌱" },
  { id: "sometimes", label: "Sometimes", emoji: "😬" },
  { id: "often", label: "Often — and it clears a room", emoji: "💨" },
];
const STOOL: { id: Stool; label: string }[] = [
  { id: "runny", label: "5 · Loose or runny (watery, hard to pick up)" },
  { id: "soft", label: "4 · Slightly soft (loses shape, leaves residue)" },
  { id: "ideal", label: "3 · Ideal (moist, formed, easy to pick up)" },
  { id: "firm", label: "2 · Firm (formed but dry or cracked)" },
  { id: "hard", label: "1 · Very hard or dry" },
  { id: "varies", label: "Varies a lot" },
];
const DURATION: { id: Duration; label: string }[] = [
  { id: "lt1m", label: "Less than a month" },
  { id: "1to6m", label: "1–6 months" },
  { id: "6to12m", label: "6–12 months" },
  { id: "gt1y", label: "Over a year" },
];
const TRIED: { id: string; label: string }[] = [
  { id: "antibiotics", label: "Vet-prescribed antibiotics" },
  { id: "steroids", label: "Steroids / Apoquel" },
  { id: "topical", label: "Creams, sprays or shampoos" },
  { id: "chews", label: "Allergy chews / baked chews" },
  { id: "diet", label: "Special / hypoallergenic diet" },
  { id: "probiotic", label: "Another probiotic or supplement" },
  { id: "nothing", label: "Nothing yet — this is our first go" },
];
const TRIED_OUTCOME: { id: TriedOutcome; label: string; emoji: string }[] = [
  { id: "none", label: "No — no real difference", emoji: "😞" },
  { id: "temporary", label: "A little — but it came straight back", emoji: "🔁" },
  { id: "faded", label: "It worked for a while, then stopped", emoji: "📉" },
  { id: "mixed", label: "Some things helped, some didn't", emoji: "🤷" },
];
const SPEND: { id: Spend; label: string }[] = [
  { id: "lt50", label: "Under £50" },
  { id: "50to200", label: "£50–£200" },
  { id: "200to500", label: "£200–£500" },
  { id: "gt500", label: "£500 or more" },
];

const TRIED_EXPLAINERS: Record<string, { title: string; body: string }> = {
  antibiotics: {
    title: "Antibiotics wipe out the good too",
    body: "They kill bad AND good bacteria — a sledgehammer where you need a scalpel. When the course ends, the bad bugs often surge back, because there's no good bacteria left to keep them in check. The gut needs rebuilding, not bombing.",
  },
  steroids: {
    title: "Steroids & Apoquel just mask it",
    body: "They quieten the immune response, so the itch calms — but the moment they stop, it's usually back, because the driver in the gut was never addressed. A band-aid on a leaky pipe.",
  },
  topical: {
    title: "Creams treat the surface only",
    body: "Sprays and shampoos work on the skin. If it keeps coming back, the cause is almost always internal — which is why it never fully clears.",
  },
  chews: {
    title: "Baked chews are mostly dead on arrival",
    body: "Most chews are baked — the heat kills the live bacteria before they reach the gut, and they're often padded with fillers and sugars that feed the bad bugs. Ours are cold-pressed, so 5 billion actually survive.",
  },
  diet: {
    title: "A special diet alone can't rebuild the gut",
    body: "Changing food can ease things for a while, but without restoring the balance of good bacteria, the same issues resurface. It's clean water poured into a polluted pool — the imbalance is still there.",
  },
  probiotic: {
    title: "Not all probiotics reach the gut",
    body: "Many are underdosed or heat-treated and pass straight through. Strength and format matter — ours is 5 billion live CFU per capsule, cold-pressed and human-grade.",
  },
};

/* ------------------------------- engine ------------------------------- */

type StepKey =
  | "size" | "age" | "symptoms" | "card-stat"
  | "diet" | "treats" | "card-beforeafter"
  | "breath" | "coat" | "energy" | "card-midsignals" | "grass" | "wind" | "stool"
  | "duration" | "tried" | "tried-outcome" | "tried-spend" | "card-tried" | "card-firsttimer";

const QUESTION_KEYS: StepKey[] = [
  "size", "age", "symptoms", "diet", "treats",
  "breath", "coat", "energy", "grass", "wind", "stool",
  "duration", "tried", "tried-outcome", "tried-spend",
];

function buildSequence(a: QuizAnswers): StepKey[] {
  const seq: StepKey[] = [
    "size", "age", "symptoms", "card-stat",
    "diet", "treats", "card-beforeafter",
    // A proof/progress breather splits the six gut-signal questions 3-and-3.
    "breath", "coat", "energy", "card-midsignals", "grass", "wind", "stool",
    "duration", "tried",
  ];
  const triedSomething = a.tried.some((t) => t !== "nothing");
  if (triedSomething) {
    // If they've tried something, dig into how it went, then disarm it.
    seq.push("tried-outcome", "tried-spend");
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
  const [a, setA] = useState<QuizAnswers>(emptyAnswers);
  const update = (patch: Partial<QuizAnswers>) => setA((p) => ({ ...p, ...patch }));

  const seq = useMemo(() => buildSequence(a), [a]);
  const key = seq[idx];
  const dog = a.dogName.trim() || "your dog";

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

  const qTotal = seq.filter((k) => QUESTION_KEYS.includes(k)).length;
  const qDone = seq.slice(0, idx + 1).filter((k) => QUESTION_KEYS.includes(k)).length;

  return (
    <div className="min-h-dvh">
      <QuizHeader done={qDone} total={qTotal} onBack={back} />
      <main className="container-page pb-16 pt-6">
        {key === "size" && (
          <SingleStep title={`How big is ${dog}?`} sub="So we get the daily dose right."
            options={(["toy","small","medium","large"] as DogSize[]).map((s) => ({ id: s, label: SIZE_LABEL[s] }))}
            value={a.size} onPick={(v) => { update({ size: v as DogSize }); next(); }} />
        )}
        {key === "age" && (
          <SingleStep title={`How old is ${dog}?`} options={AGES}
            value={a.age} onPick={(v) => { update({ age: v as AgeBand }); next(); }} />
        )}
        {key === "symptoms" && <SymptomsStep a={a} update={update} onNext={next} />}
        {key === "card-stat" && (
          <InfoCard eyebrow="Did you know?" title="80% of your dog's immune system lives in the gut."
            body={`That's why skin, ears, coat, energy — even breath — so often trace back to gut balance. Let's check ${dog}'s.`}
            onNext={next} />
        )}
        {key === "diet" && (
          <SingleStep title={`What do you feed ${dog}?`} eyebrow="Diet & the gut"
            rationale="Diet is the single biggest thing shaping the gut microbiome — so we start here."
            options={DIET} value={a.diet} onPick={(v) => { update({ diet: v }); next(); }} />
        )}
        {key === "treats" && (
          <SingleStep title="How often do treats or table scraps sneak in?"
            rationale="Rich, fatty treats and scraps can tip a balanced gut over the edge."
            options={TREATS} value={a.treats} onPick={(v) => { update({ treats: v as Treats }); next(); }} />
        )}
        {key === "breath" && (
          <SingleStep title={`How's ${dog}'s breath?`} eyebrow="Small signs, big clues"
            rationale="Persistent bad breath usually starts in the gut, not the mouth."
            options={BREATH} value={a.breath} onPick={(v) => { update({ breath: v as Breath }); next(); }} />
        )}
        {key === "coat" && (
          <SingleStep title={`What's ${dog}'s coat like?`}
            rationale="Skin and coat are a window into the gut — dull or flaky often tracks imbalance."
            options={COAT} value={a.coat} onPick={(v) => { update({ coat: v as Coat }); next(); }} />
        )}
        {key === "energy" && (
          <SingleStep title={`How are ${dog}'s energy and mood?`}
            rationale="The gut and brain are linked — flat mood and low energy can trace back to the gut."
            options={ENERGY} value={a.energy} onPick={(v) => { update({ energy: v as Energy }); next(); }} />
        )}
        {key === "grass" && (
          <SingleStep title={`Does ${dog} eat grass?`}
            rationale="Dogs often eat grass to settle an unsettled gut."
            options={GRASS} value={a.grass} onPick={(v) => { update({ grass: v as Grass }); next(); }} />
        )}
        {key === "wind" && (
          <SingleStep title={`How's ${dog}'s wind?`}
            rationale="Frequent, smelly wind is one of the clearest signs of a gut out of balance."
            options={WIND} value={a.wind} onPick={(v) => { update({ wind: v as Wind }); next(); }} />
        )}
        {key === "stool" && (
          <SingleStep title={`And ${dog}'s poos — what are they usually like?`} eyebrow="The classic gut check"
            rationale="Using the Bristol Stool Chart for Dogs — type 3 (formed, moist, easy to pick up) is ideal."
            options={STOOL} value={a.stool} onPick={(v) => { update({ stool: v as Stool }); next(); }} />
        )}
        {key === "duration" && (
          <SingleStep title="When did you first notice these changes?"
            rationale="The longer it's been building, the more the gut has drifted out of balance."
            options={DURATION} value={a.duration} onPick={(v) => { update({ duration: v as Duration }); next(); }} />
        )}
        {key === "card-beforeafter" && <BeforeAfterCard a={a} dog={dog} onNext={next} />}
        {key === "card-midsignals" && <MidSignalsCard dog={dog} onNext={next} />}
        {key === "card-firsttimer" && <FirstTimerCard dog={dog} onNext={next} />}
        {key === "tried" && <TriedStep a={a} dog={dog} update={update} onNext={next} />}
        {key === "tried-outcome" && (
          <SingleStep title={`Did any of it actually work for ${dog}?`} eyebrow="What you've tried"
            options={TRIED_OUTCOME} value={a.triedOutcome} onPick={(v) => { update({ triedOutcome: v as TriedOutcome }); next(); }} />
        )}
        {key === "tried-spend" && (
          <SingleStep title="Roughly how much have you spent trying to sort it so far?"
            rationale="Vet visits, meds, chews, special food — it adds up fast."
            options={SPEND} value={a.spend} onPick={(v) => { update({ spend: v as Spend }); next(); }} />
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
  return (
    <StepShell title="Which of these is your dog dealing with?" sub="Tick everything that sounds familiar — we build the plan around all of it.">
      <div className="space-y-3">
        {SYMPTOMS.map((s) => (
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
    <StepShell title={`What have you already tried for ${dog}?`} sub="Tick all that apply — this tells us a lot.">
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

function InfoCard({ eyebrow, title, body, onNext }: { eyebrow: string; title: string; body: string; onNext: () => void }) {
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">{eyebrow}</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-brand-ink/70">{body}</p>
      <div className="mt-8"><Button onClick={onNext} className="w-full max-w-xs">Continue →</Button></div>
    </div>
  );
}

function BeforeAfterCard({ a, dog, onNext }: { a: QuizAnswers; dog: string; onNext: () => void }) {
  const isEars = beforeAfterKind(a) === "ears";
  const img = isEars ? "/images/symptoms/gunky-ears-before-after.jpg" : "/images/symptoms/itchy-skin-before-after.jpg";
  const vertical = isEars;
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">You're in the right place</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">10,000+ UK dogs have been here — and turned it around.</h1>
      <figure className="mx-auto mt-6 max-w-[320px]">
        <div className="relative overflow-hidden rounded-2xl shadow-card">
          <img src={img} alt="A real dog before and after Good for Pets" className="block w-full" />
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase text-white">Before</span>
          <span className={`absolute rounded-md bg-brand-red px-2 py-0.5 text-xs font-bold uppercase text-white ${vertical ? "bottom-2 left-2" : "right-2 top-2"}`}>After</span>
        </div>
        <figcaption className="mt-2 text-xs text-brand-ink/55">A real customer's dog — {isEars ? "the same ear" : "the same skin"}, before and after.</figcaption>
      </figure>
      <div className="mt-7 flex flex-col items-center gap-2">
        <StarRating />
        <p className="text-sm text-brand-ink/60">Nearly done — let's finish {dog}'s assessment.</p>
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
        <p className="mx-auto mt-2 max-w-sm text-sm text-brand-ink/60">It's not that you didn't try hard enough — it's that these couldn't fix what's actually going on.</p>
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

function MidSignalsCard({ dog, onNext }: { dog: string; onNext: () => void }) {
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">You're over halfway</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">These little signs are the real clues.</h1>
      <p className="mx-auto mt-3 max-w-sm text-brand-ink/70">
        Breath, coat, energy — on their own they're easy to brush off. Together they show us exactly where {dog}'s gut balance is. A few more and we'll have the full picture.
      </p>
      <div className="mx-auto mt-6 flex max-w-xs flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-card">
        <StarRating />
        <p className="text-sm font-semibold text-brand-ink/70">Trusted by 10,000+ UK dog owners</p>
      </div>
      <div className="mt-7"><Button onClick={onNext} className="w-full max-w-xs">Keep going →</Button></div>
    </div>
  );
}

function FirstTimerCard({ dog, onNext }: { dog: string; onNext: () => void }) {
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-sky/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-ink">Good news</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">Starting fresh is actually the smart move.</h1>
      <p className="mx-auto mt-3 max-w-sm text-brand-ink/70">
        Most owners spend months on symptom treatments before anyone mentions the gut. Beginning at the root cause means {dog} skips the trial-and-error — you're not undoing damage from things that never worked.
      </p>
      <div className="mt-8"><Button onClick={onNext} className="w-full max-w-xs">Show me {dog}'s plan →</Button></div>
    </div>
  );
}

/* ------------------------------- hook (landing) ------------------------------- */

function Hook({ a, update, onStart }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onStart: () => void }) {
  const t = byId("T38"); // short, punchy "tried everything" review
  const avatar = avatarFor("T38");
  return (
    <div className="min-h-dvh">
      <header className="container-page flex justify-center py-5"><Logo /></header>
      <main className="container-page flex flex-col pb-16 pt-2">
        <div className="text-center">
          <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">Free 60-second vet-guided assessment</span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-[1.1] text-brand-ink sm:text-4xl">
            Find the <span className="text-brand-red">root cause</span> of your dog's itching, licking &amp; gunky ears.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-brand-ink/70">
            This quick assessment reads your dog's symptoms, gut signals and history to work out what's really driving it — then shows you the exact plan. It usually starts in the gut.
          </p>
        </div>

        {/* Testimonial (Mars-Men style) */}
        <figure className="mt-6 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-card">
          {avatar && <img src={avatar} alt={`${t.author}'s dog`} className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-red/15" />}
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
          <label className="block text-lg font-extrabold text-brand-ink">First up — what's your dog's name?</label>
          <p className="mt-1 text-sm text-brand-ink/60">We'll build the whole assessment around them.</p>
          <input autoFocus value={a.dogName} onChange={(e) => update({ dogName: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onStart()} placeholder="e.g. Bella" maxLength={24}
            className="mt-3 w-full rounded-2xl border-2 border-brand-ink/15 bg-white px-4 py-4 text-lg font-semibold text-brand-ink outline-none placeholder:text-brand-ink/30 focus:border-brand-red" />
          <Button onClick={onStart} className="mt-4 w-full">Start the assessment →</Button>
          <p className="mt-3 text-center text-xs text-brand-ink/50">Guided by our vet, Dr Kishan Vara · No email needed to see your result</p>
        </div>

        <div className="mt-8 border-t border-brand-ink/10 pt-6"><TrustBar /></div>
      </main>
    </div>
  );
}
