import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TrustBar } from "@/components/ui/TrustBar";
import { SYMPTOMS } from "@/data/symptoms";
import type { SymptomTag } from "@/data/testimonials";
import {
  emptyAnswers,
  SIZE_LABEL,
  type DogSize,
  type QuizAnswers,
} from "@/lib/recommend";
import { Analysing } from "./Analysing";
import { Result } from "./Result";

type Step = "hook" | "symptoms" | "primary" | "size" | "tried" | "name" | "analysing" | "result";
const FLOW: Step[] = ["symptoms", "primary", "size", "tried", "name"];

export function QuizFunnel() {
  const [step, setStep] = useState<Step>("hook");
  const [a, setA] = useState<QuizAnswers>(emptyAnswers);
  const update = (patch: Partial<QuizAnswers>) => setA((prev) => ({ ...prev, ...patch }));

  const flowIndex = FLOW.indexOf(step as Step);
  const dog = a.dogName.trim() || "your dog";

  const goNext = () => {
    const order: Step[] = ["hook", ...FLOW, "analysing", "result"];
    setStep(order[order.indexOf(step) + 1]);
  };
  const goBack = () => {
    const order: Step[] = ["hook", ...FLOW, "analysing", "result"];
    setStep(order[Math.max(0, order.indexOf(step) - 1)]);
  };

  if (step === "hook") return <Hook onStart={() => setStep("symptoms")} />;
  if (step === "analysing")
    return <Analysing dog={dog} onDone={() => setStep("result")} />;
  if (step === "result") return <Result answers={a} />;

  return (
    <div className="min-h-dvh">
      <QuizHeader index={flowIndex} total={FLOW.length} onBack={goBack} />
      <main className="container-page pb-16 pt-6">
        {step === "symptoms" && <StepSymptoms a={a} update={update} onNext={goNext} />}
        {step === "primary" && <StepPrimary a={a} dog={dog} update={update} onNext={goNext} />}
        {step === "size" && <StepSize a={a} dog={dog} update={update} onNext={goNext} />}
        {step === "tried" && <StepTried dog={dog} update={update} onNext={goNext} />}
        {step === "name" && <StepName a={a} update={update} onNext={goNext} />}
      </main>
    </div>
  );
}

/* ------------------------------- chrome ------------------------------- */

function QuizHeader({ index, total, onBack }: { index: number; total: number; onBack: () => void }) {
  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <header className="sticky top-0 z-10 border-b border-brand-ink/5 bg-brand-cream/90 backdrop-blur">
      <div className="container-page flex items-center gap-3 py-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-8 w-8 place-items-center rounded-full text-brand-ink/50 hover:bg-brand-ink/5 hover:text-brand-ink"
        >
          ←
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-ink/10">
          <div className="h-full rounded-full bg-brand-red transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-14 text-right text-xs font-semibold text-brand-ink/50">
          {index + 1} / {total}
        </span>
      </div>
    </header>
  );
}

function StepShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div key={title} className="animate-fade-up">
      <h1 className="text-2xl font-extrabold leading-snug text-brand-ink">{title}</h1>
      {sub && <p className="mt-2 text-brand-ink/60">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionCard({
  active,
  emoji,
  label,
  sub,
  onClick,
  multi,
}: {
  active: boolean;
  emoji?: string;
  label: string;
  sub?: string;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all ${
        active ? "border-brand-red shadow-card" : "border-transparent hover:border-brand-red/30"
      }`}
    >
      {emoji && <span className="text-2xl">{emoji}</span>}
      <span className="flex-1">
        <span className="block font-semibold text-brand-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-sm text-brand-ink/50">{sub}</span>}
      </span>
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${multi ? "rounded-md" : "rounded-full"} ${
          active ? "border-brand-red bg-brand-red text-white" : "border-brand-ink/20"
        }`}
      >
        {active && "✓"}
      </span>
    </button>
  );
}

/* ------------------------------- hook ------------------------------- */

function Hook({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-dvh">
      <header className="container-page flex justify-center py-5">
        <Logo />
      </header>
      <main className="container-page flex flex-col items-center pb-16 pt-4 text-center">
        <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">
          Free 60-second quiz
        </span>
        <h1 className="mt-5 text-[32px] font-extrabold leading-[1.1] text-brand-ink sm:text-4xl">
          Still licking his paws?
          <span className="mt-1 block text-brand-red">It might not be his skin — it might be his gut.</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-brand-ink/70">
          Answer 5 quick questions about your dog's itching, paw-licking and gunky ears. We'll show
          you the right plan — and the real dogs it's already worked for.
        </p>
        <Button onClick={onStart} className="mt-8 w-full max-w-xs">
          Start the quiz →
        </Button>
        <p className="mt-3 text-xs text-brand-ink/50">No email needed to see your result.</p>
        <div className="mt-10 w-full border-t border-brand-ink/10 pt-6">
          <TrustBar />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------- steps ------------------------------- */

function StepSymptoms({ a, update, onNext }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const toggle = (id: SymptomTag) => {
    const has = a.symptoms.includes(id);
    const symptoms = has ? a.symptoms.filter((s) => s !== id) : [...a.symptoms, id];
    // keep primary valid
    const primary = a.primary && symptoms.includes(a.primary) ? a.primary : null;
    update({ symptoms, primary });
  };
  return (
    <StepShell title="What's your dog dealing with?" sub="Pick everything that sounds familiar — most dogs have more than one.">
      <div className="space-y-3">
        {SYMPTOMS.map((s) => (
          <OptionCard key={s.id} multi active={a.symptoms.includes(s.id)} emoji={s.emoji} label={s.label} sub={s.short} onClick={() => toggle(s.id)} />
        ))}
      </div>
      <StickyNext disabled={a.symptoms.length === 0} onNext={onNext} label={a.symptoms.length ? `Continue (${a.symptoms.length} selected)` : "Select at least one"} />
    </StepShell>
  );
}

function StepPrimary({ a, dog, update, onNext }: { a: QuizAnswers; dog: string; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const chosen = SYMPTOMS.filter((s) => a.symptoms.includes(s.id));
  // If only one symptom, auto-set and let them tap through.
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

function StepSize({ a, dog, update, onNext }: { a: QuizAnswers; dog: string; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const sizes: DogSize[] = ["toy", "small", "medium", "large"];
  return (
    <StepShell title={`How big is ${dog}?`} sub="So we get the dose — and the easiest format — right.">
      <div className="space-y-3">
        {sizes.map((s) => (
          <OptionCard key={s} active={a.size === s} label={SIZE_LABEL[s]} onClick={() => update({ size: s })} />
        ))}
      </div>
      <StickyNext disabled={!a.size} onNext={onNext} label="Continue" />
    </StepShell>
  );
}

function StepTried({ dog, update, onNext }: { dog: string; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  const pick = (v: boolean) => {
    update({ triedBefore: v });
    onNext();
  };
  return (
    <StepShell title={`Have you tried other things for ${dog} already?`} sub="Creams, sprays, vet meds, other supplements, baked chews…">
      <div className="space-y-3">
        <OptionCard active={false} emoji="😮‍💨" label="Yes — and nothing's really worked" onClick={() => pick(true)} />
        <OptionCard active={false} emoji="🆕" label="No — this is our first proper go" onClick={() => pick(false)} />
      </div>
    </StepShell>
  );
}

function StepName({ a, update, onNext }: { a: QuizAnswers; update: (p: Partial<QuizAnswers>) => void; onNext: () => void }) {
  return (
    <StepShell title="Last one — what's your dog's name?" sub="We'll use it to personalise the plan. (Optional.)">
      <input
        autoFocus
        value={a.dogName}
        onChange={(e) => update({ dogName: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        placeholder="e.g. Bella"
        maxLength={24}
        className="w-full rounded-2xl border-2 border-brand-ink/15 bg-white px-4 py-4 text-lg font-semibold text-brand-ink outline-none placeholder:text-brand-ink/30 focus:border-brand-red"
      />
      <div className="mt-6">
        <Button onClick={onNext} className="w-full">
          See {a.dogName.trim() || "my dog"}'s plan →
        </Button>
      </div>
    </StepShell>
  );
}

function StickyNext({ disabled, onNext, label }: { disabled: boolean; onNext: () => void; label: string }) {
  return (
    <div className="sticky bottom-0 mt-8 -mx-5 bg-gradient-to-t from-brand-cream via-brand-cream to-transparent px-5 pb-5 pt-3">
      <Button onClick={onNext} disabled={disabled} className="w-full">
        {label}
      </Button>
    </div>
  );
}
