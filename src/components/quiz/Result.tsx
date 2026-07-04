import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { buildRecommendation, type QuizAnswers } from "@/lib/recommend";
import { symptomById } from "@/data/symptoms";

export function Result({ answers }: { answers: QuizAnswers }) {
  const rec = buildRecommendation(answers);
  const dog = answers.dogName.trim() || "your dog";
  const dogPossessive = answers.dogName.trim() ? `${answers.dogName.trim()}'s` : "your dog's";
  const selected = answers.symptoms.map((s) => symptomById(s));

  return (
    <div className="min-h-dvh pb-20">
      <header className="container-page flex justify-center py-5">
        <Logo />
      </header>

      <main className="container-page">
        {/* Personalised header */}
        <div className="animate-fade-up text-center">
          <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">
            {dogPossessive} plan is ready
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-brand-ink">
            Based on {dogPossessive} {rec.primary.emoji} {rec.primary.eyebrow.toLowerCase()},
            here's where we'd start.
          </h1>
        </div>

        {/* Symptom recap chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {selected.map((s) => (
            <span
              key={s.id}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                s.id === rec.primary.id ? "bg-brand-red text-white" : "bg-white text-brand-ink/70 ring-1 ring-brand-ink/10"
              }`}
            >
              {s.emoji} {s.label}
            </span>
          ))}
        </div>

        {/* Empathy line for the efficacy refugee */}
        {rec.triedBefore && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl bg-brand-pink/30 p-4 text-center text-[15px] text-brand-ink/80">
            You've tried things before that let you down — you're not alone. "The only thing that
            has worked, and I feel like I've tried every potion." — Kim B.
          </p>
        )}

        {/* Recommended product */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-brand-red px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white">
            Our recommendation for {dog}
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-extrabold text-brand-ink">{rec.product.name}</h2>
            <p className="mt-1 font-semibold text-brand-red">{rec.product.tagline}</p>
            <ul className="mt-4 space-y-2">
              {rec.product.contents.map((c) => (
                <li key={c} className="flex gap-2 text-[15px] text-brand-ink/80">
                  <span className="text-brand-red">✓</span>
                  {c}
                </li>
              ))}
            </ul>

            {rec.smallDog && (
              <p className="mt-4 rounded-xl bg-brand-sky/20 p-3 text-sm text-brand-ink/80">
                🐾 Because {dog} is on the smaller side: these are <strong>twist-open sprinkle
                capsules</strong> — no giant tablet to crush. Just open and mix into food.
              </p>
            )}

            <Link
              to={`/relief/${rec.landerSlug}`}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-cta transition-transform active:scale-[0.98] hover:brightness-105"
            >
              See {dogPossessive} {rec.primary.eyebrow.toLowerCase()} relief plan →
            </Link>
            <p className="mt-3 text-center text-xs text-brand-ink/50">
              Backed by real reviews · 51% of profits to animal charities
            </p>
          </div>
        </div>

        {/* Matched proof */}
        {rec.proof.length > 0 && (
          <section className="mt-12">
            <h3 className="text-center text-xl font-extrabold text-brand-ink">
              Dogs just like {dog} — in their owners' words
            </h3>
            <div className="mt-5 space-y-4">
              {rec.proof.slice(0, 3).map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}

        {/* Optional email capture — no gate, purely opt-in */}
        <EmailCapture dog={dog} />

        <p className="mx-auto mt-10 max-w-md text-center text-sm text-brand-ink/60">
          Most owners see a change in 2–6 weeks — give it the full window. Not baked, not dressed up
          as a treat. Just what actually works.
        </p>
      </main>
    </div>
  );
}

function EmailCapture({ dog }: { dog: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="mt-12 rounded-2xl bg-white p-5 text-center shadow-card">
        <p className="font-semibold text-brand-ink">Done — {dog}'s plan is on its way. 🐾</p>
      </div>
    );
  }
  // TODO: wire to a real list (Klaviyo/Shopify). No backend in this build.
  const submit = () => {
    if (email.includes("@")) setSent(true);
  };
  return (
    <div className="mt-12 rounded-2xl bg-white p-5 shadow-card">
      <p className="text-center font-semibold text-brand-ink">Want {dog}'s plan emailed to you?</p>
      <p className="mt-1 text-center text-sm text-brand-ink/50">Optional — no spam, unsubscribe anytime.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@email.com"
          className="flex-1 rounded-full border-2 border-brand-ink/15 bg-white px-4 py-3 outline-none focus:border-brand-red"
        />
        <Button size="md" onClick={submit} className="shrink-0">
          Email it
        </Button>
      </div>
    </div>
  );
}
