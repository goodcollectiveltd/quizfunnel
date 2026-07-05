import { useMemo, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TrustBar } from "@/components/ui/TrustBar";
import { StarRating } from "@/components/ui/StarRating";
import { SYMPTOMS } from "@/data/symptoms";
import type { SymptomTag } from "@/data/testimonials";
import {
  emptyAnswers,
  SIZE_LABEL,
  type AgeBand,
  type DogSize,
  type Duration,
  type PooFreq,
  type QuizAnswers,
  type Stool,
  type Wind,
} from "@/lib/recommend";
import { Analysing } from "./Analysing";
import { Result } from "./Result";

/* ------------------------------- options ------------------------------- */

const AGES: { id: AgeBand; label: string }[] = [
  { id: "puppy", label: "Puppy — under 1 year" },
  { id: "adult", label: "Adult — 1 to 8 years" },
  { id: "senior", label: "Senior — 8 years+" },
];
const STOOL: { id: Stool; label: string }[] = [
  { id: "runny", label: "5 · Loose or runny (watery, hard to pick up)" },
  { id: "soft", label: "4 · Slightly soft (loses shape, leaves residue)" },
  { id: "ideal", label: "3 · Ideal (moist, formed, easy to pick up)" },
  { id: "firm", label: "2 · Firm (formed but dry or cracked)" },
  { id: "hard", label: "1 · Very hard or dry" },
  { id: "varies", label: "Varies a lot" },
];
const POO: { id: PooFreq; label: string }[] = [
  { id: "none", label: "None most days" },
  { id: "1to2", label: "1–2 a day" },
  { id: "3to4", label: "3–4 a day" },
  { id: "more", label: "More than 4 a day" },
  { id: "irregular", label: "Irregular — varies a lot" },
];
const WIND: { id: Wind; label: string; emoji: string }[] = [
  { id: "rare", label: "Rarely", emoji: "🌱" },
  { id: "sometimes", label: "Sometimes", emoji: "😬" },
  { id: "often", label: "Often — and it clears a room", emoji: "💨" },
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
const DIET: { id: string; label: string }[] = [
  { id: "raw", label: "Raw or fresh food" },
  { id: "kibble", label: "Dry kibble" },
  { id: "wet", label: "Wet / tinned food" },
  { id: "mix", label: "A mix" },
];

// The conditional "why it didn't work" explanations (Lunavia pattern).
const TRIED_EXPLAINERS: Record<string, { title: string; body: string }> = {
  antibiotics: {
    title: "Antibiotics can make it worse",
    body: "Antibiotics kill both the bad AND the good gut bacteria — which can leave yeast and skin flare-ups worse once the course ends. Rebuilding the gut is what's missing.",
  },
  steroids: {
    title: "Steroids mask, they don't fix",
    body: "Steroids and Apoquel calm the immune response, but the moment they stop, the itch is usually back — because the driver in the gut was never addressed.",
  },
  topical: {
    title: "Creams treat the surface",
    body: "Sprays and shampoos work on the skin. If it keeps coming back, the cause is almost always internal — which is why it never fully clears.",
  },
  chews: {
    title: "Baked chews are (mostly) dead on arrival",
    body: "Most chews are baked — and the heat kills the live bacteria before they ever reach the gut. Ours are cold-pressed, so 5 billion actually survive.",
  },
  probiotic: {
    title: "Not all probiotics reach the gut",
    body: "Strength and format matter. Many are underdosed or heat-treated. Ours is 5 billion live CFU per capsule, cold-pressed and human-grade.",
  },
};

/* ------------------------------- engine ------------------------------- */

type StepKey =
  | "name" | "size" | "age" | "symptoms" | "primary"
  | "card-stat" | "stool" | "poo" | "wind" | "duration"
  | "card-beforeafter" | "tried" | "card-tried" | "diet";

const QUESTION_KEYS: StepKey[] = [
  "name", "size", "age", "symptoms", "primary",
  "stool", "poo", "wind", "duration", "tried", "diet",
];

function buildSequence(a: QuizAnswers): StepKey[] {
  const seq: StepKey[] = ["name", "size", "age", "symptoms"];
  if (a.symptoms.length > 1) seq.push("primary");
  seq.push("card-stat", "stool", "poo", "wind", "duration", "card-beforeafter", "tried");
  const triedExplainable = a.tried.some((t) => TRIED_EXPLAINERS[t]);
  if (triedExplainable) seq.push("card-tried");
  seq.push("diet");
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
    if (idx >= seq.length - 1) setPhase("analysing");
    else setIdx((i) => i + 1);
  };
  const back = () => setIdx((i) => Math.max(0, i - 1));

  if (phase === "hook") return <Hook onStart={() => setPhase("quiz")} />;
  if (phase === "analysing") return <Analysing dog={dog} onDone={() => setPhase("result")} />;
  if (phase === "result") return <Result answers={a} />;

  // progress across question steps only
  const qTotal = seq.filter((k) => QUESTION_KEYS.includes(k)).length;
  const qDone = seq.slice(0, idx + 1).filter((k) => QUESTION_KEYS.includes(k)).length;

  return (
    <div className="min-h-dvh">
      <QuizHeader done={qDone} total={qTotal} onBack={back} canBack={idx > 0} />
      <main className="container-page pb-16 pt-6">
        {key === "name" && <NameStep a={a} update={update} onNext={next} />}
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
        {key === "primary" && <PrimaryStep a={a} dog={dog} update={update} onNext={next} />}
        {key === "card-stat" && (
          <InfoCard eyebrow="Did you know?" title="80% of your dog's immune system lives in the gut."
            body={`That's why skin, ears and paws so often trace back to gut balance — and why we start there for ${dog}.`}
            onNext={next} />
        )}
        {key === "stool" && (
          <SingleStep title={`What are ${dog}'s poos usually like?`}
            rationale="Using the Bristol Stool Chart for Dogs — type 3 (formed, moist, easy to pick up) is ideal."
            options={STOOL} value={a.stool} onPick={(v) => { update({ stool: v as Stool }); next(); }} />
        )}
        {key === "poo" && (
          <SingleStep title={`How often does ${dog} poo?`}
            rationale="1–3 well-formed poos a day is typical; more or irregular can signal an unsettled gut."
            options={POO} value={a.pooFreq} onPick={(v) => { update({ pooFreq: v as PooFreq }); next(); }} />
        )}
        {key === "wind" && (
          <SingleStep title={`How's ${dog}'s wind?`}
            rationale="Frequent, smelly wind is one of the clearest signs of a gut microbiome that's out of balance."
            options={WIND} value={a.wind} onPick={(v) => { update({ wind: v as Wind }); next(); }} />
        )}
        {key === "duration" && (
          <SingleStep title="How long has this been going on?" options={DURATION}
            value={a.duration} onPick={(v) => { update({ duration: v as Duration }); next(); }} />
        )}
        {key === "card-beforeafter" && <BeforeAfterCard a={a} dog={dog} onNext={next} />}
        {key === "tried" && <TriedStep a={a} dog={dog} update={update} onNext={next} />}
        {key === "card-tried" && <TriedExplainerCard a={a} onNext={next} />}
        {key === "diet" && (
          <SingleStep title={`What do you feed ${dog}?`}
            rationale="Diet shapes the gut microbiome — it helps us tailor the plan."
            options={DIET} value={a.diet} onPick={(v) => { update({ diet: v }); next(); }} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------- chrome ------------------------------- */

function QuizHeader({ done, total, onBack, canBack }: { done: number; total: number; onBack: () => void; canBack: boolean }) {
  const pct = Math.round((done / total) * 100);
  return (
    <header className="sticky top-0 z-10 border-b border-brand-ink/5 bg-brand-cream/90 backdrop-blur">
      <div className="container-page flex items-center gap-3 py-3">
        <button onClick={onBack} disabled={!canBack} aria-label="Back"
          className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink disabled:opacity-0">←</button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-ink/10">
          <div className="h-full rounded-full bg-brand-red transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-semibold text-brand-ink/50">{pct}%</span>
      </div>
    </header>
  );
}

function StepShell({ title, sub, rationale, children }: { title: string; sub?: string; rationale?: string; children: React.ReactNode }) {
  return (
    <div key={title} className="animate-fade-up">
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

function SingleStep<T extends string>({ title, sub, rationale, options, value, onPick }: {
  title: string; sub?: string; rationale?: string;
  options: { id: T; label: string; emoji?: string }[]; value: T | null; onPick: (v: T) => void;
}) {
  return (
    <StepShell title={title} sub={sub} rationale={rationale}>
      <div className="space-y-3">
        {options.map((o) => (
          <OptionCard key={o.id} active={value === o.id} emoji={o.emoji} label={o.label} onClick={() => onPick(o.id)} />
        ))}
      </div>
    </StepShell>
  );
}

function NameStep({ a, update, onNext }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  return (
    <StepShell title="First up — what's your dog's name?" sub="We'll build the whole plan around them.">
      <input autoFocus value={a.dogName} onChange={(e) => update({ dogName: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onNext()} placeholder="e.g. Bella" maxLength={24}
        className="w-full rounded-2xl border-2 border-brand-ink/15 bg-white px-4 py-4 text-lg font-semibold text-brand-ink outline-none placeholder:text-brand-ink/30 focus:border-brand-red" />
      <div className="mt-6"><Button onClick={onNext} className="w-full">Continue →</Button></div>
    </StepShell>
  );
}

function SymptomsStep({ a, update, onNext }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const toggle = (id: SymptomTag) => {
    const has = a.symptoms.includes(id);
    const symptoms = has ? a.symptoms.filter((s) => s !== id) : [...a.symptoms, id];
    const primary = a.primary && symptoms.includes(a.primary) ? a.primary : null;
    update({ symptoms, primary: symptoms.length === 1 ? symptoms[0] : primary });
  };
  return (
    <StepShell title="Which of these is your dog dealing with?" sub="Tick all that sound familiar — most dogs have more than one.">
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

function PrimaryStep({ a, dog, update, onNext }: { a: QuizAnswers; dog: string; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const chosen = SYMPTOMS.filter((s) => a.symptoms.includes(s.id));
  return (
    <StepShell title={`Which bothers ${dog} the most?`} sub="This is what we'll build the plan around.">
      <div className="space-y-3">
        {chosen.map((s) => (
          <OptionCard key={s.id} active={a.primary === s.id} emoji={s.emoji} label={s.label} onClick={() => update({ primary: s.id })} />
        ))}
      </div>
      <StickyNext disabled={!a.primary} onNext={onNext} label="Continue" />
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
  const primary = a.primary ?? a.symptoms[0] ?? "itchy-skin";
  const isEars = primary === "gunky-ears";
  const img = isEars ? "/images/symptoms/gunky-ears-before-after.jpg" : "/images/symptoms/itchy-skin-before-after.jpg";
  const vertical = isEars; // ears asset is a vertical 2-panel; skin is side-by-side
  return (
    <div className="animate-fade-up pt-6 text-center">
      <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">You're in the right place</span>
      <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">10,000+ UK dogs have been here — and turned it around.</h1>
      <figure className="mx-auto mt-6 max-w-[320px]">
        <div className="relative overflow-hidden rounded-2xl shadow-card">
          <img src={img} alt="A real dog before and after Good for Pets" className="block w-full" />
          {!vertical && (
            <>
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase text-white">Before</span>
              <span className="absolute right-2 top-2 rounded-md bg-brand-red px-2 py-0.5 text-xs font-bold uppercase text-white">After</span>
            </>
          )}
          {vertical && (
            <>
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-bold uppercase text-white">Before</span>
              <span className="absolute bottom-2 left-2 rounded-md bg-brand-red px-2 py-0.5 text-xs font-bold uppercase text-white">After</span>
            </>
          )}
        </div>
        <figcaption className="mt-2 text-xs text-brand-ink/55">A real customer's dog — {isEars ? "the same ear" : "the same skin"}, before and after.</figcaption>
      </figure>
      <div className="mt-7 flex flex-col items-center gap-2">
        <StarRating />
        <p className="text-sm text-brand-ink/60">Let's finish {dog}'s assessment →</p>
        <Button onClick={onNext} className="mt-2 w-full max-w-xs">Continue →</Button>
      </div>
    </div>
  );
}

function TriedExplainerCard({ a, onNext }: { a: QuizAnswers; onNext: () => void }) {
  const explainers = a.tried.map((t) => TRIED_EXPLAINERS[t]).filter(Boolean).slice(0, 2);
  return (
    <div className="animate-fade-up pt-6">
      <div className="text-center">
        <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">Here's the thing…</span>
        <h1 className="mt-4 text-2xl font-extrabold leading-snug text-brand-ink">No wonder it hasn't stuck.</h1>
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

/* ------------------------------- hook ------------------------------- */

function Hook({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-dvh">
      <header className="container-page flex justify-center py-5"><Logo /></header>
      <main className="container-page flex flex-col items-center pb-16 pt-4 text-center">
        <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">Free 60-second vet-guided quiz</span>
        <h1 className="mt-5 text-[32px] font-extrabold leading-[1.1] text-brand-ink sm:text-4xl">
          Find the <span className="text-brand-red">root cause</span> of your dog's itching, licking &amp; gunky ears.
        </h1>
        <p className="mt-4 max-w-md text-lg text-brand-ink/70">
          This quick assessment looks at your dog's symptoms, gut and history to find what's really driving it — then shows you the exact plan for their needs. It usually starts in the gut.
        </p>
        <Button onClick={onStart} className="mt-8 w-full max-w-xs">Start the quiz →</Button>
        <p className="mt-3 text-xs text-brand-ink/50">Guided by our vet, Dr Kishan Vara · No email needed to see your result</p>
        <div className="mt-10 w-full border-t border-brand-ink/10 pt-6"><TrustBar /></div>
      </main>
    </div>
  );
}
