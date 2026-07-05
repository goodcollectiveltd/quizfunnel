import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { buildRecommendation, type QuizAnswers } from "@/lib/recommend";
import { symptomById } from "@/data/symptoms";
import { track, withAttribution } from "@/lib/tracking";
import { subscribeEmail } from "@/lib/subscribe";

const VET_IMG = "/images/people/kishan.jpg";

export function Result({ answers }: { answers: QuizAnswers }) {
  const rec = buildRecommendation(answers);
  const dog = answers.dogName.trim() || "your dog";
  const dogPossessive = answers.dogName.trim() ? `${answers.dogName.trim()}'s` : "your dog's";
  const selected = answers.symptoms.map((s) => symptomById(s));

  // Personalised timeline: first significant change ~8 weeks; 90-day results guarantee.
  const now = new Date();
  const fmt = (days: number) =>
    new Date(now.getTime() + days * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const etaDate = fmt(56);
  const guaranteeDate = fmt(90);

  // Attribution-forwarded PDP links + funnel events
  const heroUrl = withAttribution(rec.hero.pdpUrl);
  const upsellUrl = rec.upsell ? withAttribution(rec.upsell.pdpUrl) : "#";
  useEffect(() => {
    track("Lead", { symptoms: answers.symptoms, product: rec.hero.name, gut_score: rec.gutScore });
  }, [answers.symptoms, rec.hero.name, rec.gutScore]);
  const onBuy = (product: string) => track("InitiateCheckout", { content_name: product });

  // Everything from the quiz, saved onto the Klaviyo customer profile (incl. dog's name).
  const profile: Record<string, unknown> = {
    dog_name: answers.dogName.trim() || undefined,
    dog_size: answers.size,
    dog_age: answers.age,
    symptoms: rec.symptoms.map((s) => s.noun),
    stool_consistency: answers.stool,
    poo_frequency: answers.pooFreq,
    wind: answers.wind,
    issue_duration: answers.duration,
    tried_before: answers.tried,
    diet: answers.diet,
    recommended_product: rec.hero.name,
    recommended_upsell: rec.upsell?.name ?? null,
    gut_score: rec.gutScore,
    gut_rating: rec.rating,
    quiz_source: "good-for-pets-quiz",
  };

  // Sticky CTA: appears once the main "Start plan" button has scrolled above the fold.
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = ctaRef.current;
      if (el) setShowSticky(el.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-dvh pb-20">
      <header className="container-page flex justify-center py-5"><Logo /></header>

      <main className="container-page">
        {/* Diagnosis header */}
        <div className="animate-fade-up text-center">
          <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red">
            {dogPossessive} gut health assessment
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-brand-ink">{rec.rating}</h1>
          <p className="mx-auto mt-3 max-w-md text-brand-ink/75">{rec.verdict}</p>
        </div>

        {/* Gut-health gauge */}
        <div className="mt-7 rounded-3xl bg-white p-6 shadow-card">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold uppercase tracking-wide text-brand-ink/50">Gut balance</span>
            <span className="text-2xl font-extrabold text-brand-red">{rec.gutScore}/100</span>
          </div>
          <div className="relative mt-3 h-3 rounded-full" style={{ background: "linear-gradient(90deg,#EF3824,#f5a623,#7bc043)" }}>
            <div className="absolute -top-1.5 h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-brand-ink shadow" style={{ left: `${rec.gutScore}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-brand-ink/50">
            <span>Needs support</span><span>Thriving</span>
          </div>
        </div>

        {/* Symptom recap — every selected symptom, addressed equally */}
        <div className="mt-6">
          <p className="text-center text-sm font-bold uppercase tracking-wide text-brand-ink/50">
            {dogPossessive} plan tackles all of this
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {selected.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-3 py-1 text-sm font-semibold text-brand-red">
                <span className="text-brand-red">✓</span> {s.emoji} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Root-cause cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {rec.rootCauses.map((c) => (
            <div key={c.label} className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-red">{c.label}</p>
              <p className="mt-1 font-semibold text-brand-ink">{c.value}</p>
            </div>
          ))}
        </div>

        {/* What's possible — personalised projection */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-brand-ink p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-sky">What's possible for {dog}</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight">
            Most owners see the first big change within <span className="text-brand-sky">8 weeks</span> — by {etaDate}.
          </h2>
          <svg viewBox="0 0 320 180" className="mt-5 w-full" role="img" aria-label={`Projected improvement for ${dog} over 90 days`}>
            <defs>
              <linearGradient id="proj-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#95D8E9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#95D8E9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="20" y1="34" x2="300" y2="34" stroke="#fff" strokeOpacity="0.15" strokeDasharray="4 4" />
            <text x="20" y="28" fill="#fff" fillOpacity="0.5" fontSize="9">Thriving</text>
            <path d="M24,140 C 120,138 150,96 300,40 L300,152 L24,152 Z" fill="url(#proj-area)" />
            <path d="M24,140 C 120,138 150,96 300,40" fill="none" stroke="#95D8E9" strokeWidth="3" />
            <circle cx="24" cy="140" r="5" fill="#EF3824" />
            <text x="33" y="133" fill="#fff" fontSize="9" fontWeight="bold">You are here</text>
            <line x1="196" y1="34" x2="196" y2="152" stroke="#fff" strokeOpacity="0.25" strokeDasharray="3 3" />
            <circle cx="196" cy="74" r="5" fill="#fff" />
            <text x="24" y="168" fill="#fff" fillOpacity="0.5" fontSize="9">Today</text>
            <text x="196" y="168" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">Week 8</text>
            <text x="300" y="168" fill="#fff" fillOpacity="0.5" fontSize="9" textAnchor="end">Day 90</text>
          </svg>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-4">
            <span className="text-2xl">🛡️</span>
            <p className="text-sm text-white/90">
              <strong>Results guaranteed in 90 days.</strong> If {dog} sees no difference by {guaranteeDate}, we'll refund you in full.
            </p>
          </div>
        </section>

        {rec.triedBefore && (
          <p className="mx-auto mt-6 max-w-md rounded-2xl bg-brand-pink/30 p-4 text-center text-[15px] text-brand-ink/80">
            You've tried things before that let you down — you're not alone. "The only thing that has worked, and I feel like I've tried every potion." — Kim B.
          </p>
        )}

        {/* Recommendation */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-brand-red px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white">
            {dogPossessive} recommended plan
          </div>
          <div className="p-6">
            <img src={rec.hero.image} alt={rec.hero.name} className="mx-auto mb-4 h-44 w-auto object-contain drop-shadow-md" />
            <h2 className="text-center text-2xl font-extrabold text-brand-ink">{rec.hero.name}</h2>
            <p className="mt-1 text-center font-semibold text-brand-red">{rec.hero.tagline}</p>
            <p className="mx-auto mt-3 max-w-xs rounded-xl bg-brand-cream p-2 text-center text-sm font-semibold text-brand-ink">
              For a {answers.size ?? "medium"} dog like {dog}: {rec.dose}
            </p>
            <ul className="mt-4 space-y-2">
              {rec.hero.contents.map((c) => (
                <li key={c} className="flex gap-2 text-[15px] text-brand-ink/80"><span className="text-brand-red">✓</span>{c}</li>
              ))}
            </ul>
            {rec.smallDog && (
              <p className="mt-4 rounded-xl bg-brand-sky/20 p-3 text-sm text-brand-ink/80">
                🐾 Because {dog} is on the smaller side: these are <strong>twist-open sprinkle capsules</strong> — no giant tablet to crush. Just open and mix into food.
              </p>
            )}
            <a ref={ctaRef} href={heroUrl} target="_blank" rel="noopener noreferrer" onClick={() => onBuy(rec.hero.name)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-cta transition-transform active:scale-[0.98] hover:brightness-105">
              Start {dogPossessive} plan →
            </a>
            <p className="mt-3 text-center text-xs text-brand-ink/50">
              Subscribe &amp; save — pause or cancel anytime · Most orders arrive in 2–3 working days
            </p>
          </div>
        </div>

        {/* Upsell */}
        {rec.upsell && (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-brand-red/40 bg-white/60 p-5">
            <div className="flex items-start gap-3">
              <img src={rec.upsell.image} alt={rec.upsell.name} className="h-16 w-16 shrink-0 object-contain drop-shadow" />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-red">Add extra support for {dog}</p>
                <h3 className="mt-1 text-lg font-extrabold text-brand-ink">{rec.upsell.addOnLabel}</h3>
                <p className="mt-1 text-sm text-brand-ink/70">{rec.upsell.addOnBlurb}</p>
                <a href={upsellUrl} target="_blank" rel="noopener noreferrer" onClick={() => onBuy(rec.upsell!.name)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-red underline underline-offset-4">
                  {rec.upsell.addOnLabel} →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Flexibility reassurance (guarantee lives in the projection above) */}
        <p className="mt-5 text-center text-sm font-semibold text-brand-ink/60">
          Subscribe &amp; save · pause or cancel anytime · backed by our 90-day results guarantee
        </p>

        {/* Matched proof */}
        {rec.proof.length > 0 && (
          <section className="mt-12">
            <h3 className="text-center text-xl font-extrabold text-brand-ink">Dogs just like {dog} — in their owners' words</h3>
            <div className="mt-5 space-y-4">
              {rec.proof.slice(0, 3).map((t) => (<TestimonialCard key={t.id} t={t} />))}
            </div>
          </section>
        )}

        {/* Vet authority */}
        <section className="mt-10 rounded-3xl bg-white p-6 shadow-card">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <img src={VET_IMG} alt="Dr Kishan Vara, veterinary partner" className="w-40 shrink-0 rounded-2xl" />
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-extrabold text-brand-ink">Guided by a vet, made in the UK</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-brand-ink/75">
                Dr Kishan Vara helps guide what goes into every product — evidence-based, cold-pressed so the bacteria stay alive, and made to GMP standards.
              </p>
              <p className="mt-2 text-sm font-bold text-brand-ink">Dr Kishan Vara</p>
              <p className="text-xs text-brand-ink/55">Veterinary surgeon, Royal Veterinary College · our veterinary partner</p>
            </div>
          </div>
        </section>

        <EmailCapture dog={dog} profile={profile} />

        <p className="mx-auto mt-10 max-w-md text-center text-sm text-brand-ink/60">
          Not baked. Not dressed up as a treat. Just what actually works — with 51% of profits going to animal rescue.
        </p>
      </main>

      {/* Sticky CTA — follows the user once the main button scrolls away */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-fade-up border-t border-brand-ink/10 bg-brand-cream/95 backdrop-blur">
          <div className="container-page py-3">
            <a href={heroUrl} target="_blank" rel="noopener noreferrer" onClick={() => onBuy(rec.hero.name)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-3.5 text-lg font-bold text-white shadow-cta transition-transform active:scale-[0.98] hover:brightness-105">
              Start {dogPossessive} plan →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function EmailCapture({ dog, profile }: { dog: string; profile: Record<string, unknown> }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!email.includes("@")) return;
    setSent(true); // optimistic — never block the user
    const ok = await subscribeEmail(email, profile);
    if (ok) track("CompleteRegistration", { dog_name: dog });
  };
  if (sent) {
    return (
      <div className="mt-12 rounded-2xl bg-white p-5 text-center shadow-card">
        <p className="font-semibold text-brand-ink">Done — {dog}'s plan is on its way. 🐾</p>
      </div>
    );
  }
  return (
    <div className="mt-12 rounded-2xl bg-white p-5 shadow-card">
      <p className="text-center font-semibold text-brand-ink">Want {dog}'s plan emailed to you?</p>
      <p className="mt-1 text-center text-sm text-brand-ink/50">Optional — no spam, unsubscribe anytime.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@email.com" className="flex-1 rounded-full border-2 border-brand-ink/15 bg-white px-4 py-3 outline-none focus:border-brand-red" />
        <Button size="md" onClick={submit} className="shrink-0">Email it</Button>
      </div>
    </div>
  );
}
