import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { buildRecommendation, hasSkinSignal, SPEND_LABEL, type QuizAnswers } from "@/lib/recommend";
import { track, withAttribution } from "@/lib/tracking";
import { subscribeEmail } from "@/lib/subscribe";
import { saveSubmission } from "@/lib/submissions";
import { fetchDonationTotal } from "@/lib/donation";
import { CHECKOUT, heroCommerceFor, tierCartAdd, submitCartAdd, deliveryLabel, pricePerDay, heroCheckoutReady } from "@/lib/commerce";

const VET_IMG = "/images/people/kishan.jpg";

// Real-customer photos (product visible) for the social-proof wall on the result page.
const UGC_WALL = [
  "/images/ugc/grid-dachshund.jpg",
  "/images/ugc/grid-golden.jpg",
  "/images/ugc/grid-beagle.jpg",
  "/images/ugc/grid-trio.jpg",
];

export function Result({ answers }: { answers: QuizAnswers }) {
  const rec = buildRecommendation(answers);
  const dog = answers.dogName.trim() || "your dog";
  const dogPossessive = answers.dogName.trim() ? `${answers.dogName.trim()}'s` : "your dog's";

  // Swipeable product gallery for the buy box: the hero's product shots, then a real
  // before/after proof slide when the case genuinely matches (skin → Bear, ears → Murphy).
  const productShots = rec.hero.gallery ?? [rec.hero.heroImage ?? rec.hero.image, rec.hero.image];
  const gallerySlides: GallerySlide[] = productShots.map((src) => ({ src, alt: rec.hero.name }));
  if (hasSkinSignal(answers)) {
    gallerySlides.push({ src: "/images/symptoms/itchy-skin-before-after.jpg", alt: "Bear's skin before and after Good for Pets", badge: "h", name: "Bear", caption: "Bear's skin, before & after Good for Pets" });
  } else if (answers.symptoms.includes("gunky-ears")) {
    gallerySlides.push({ src: "/images/symptoms/gunky-ears-before-after.jpg", alt: "Murphy's ear before and after Good for Pets", badge: "v", name: "Murphy", caption: "Murphy's ear, a 30-day transformation" });
  }
  const personalNote = rec.dietNote ?? rec.ageNote;

  // Personalised timeline: first significant change ~8 weeks; 90-day results guarantee.
  const now = new Date();
  const fmt = (days: number) =>
    new Date(now.getTime() + days * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const etaDate = fmt(56);
  const guaranteeDate = fmt(90);

  // Direct-to-cart checkout — product-aware: the hero may be 5 Strain Probiotic+ (gut) or the
  // Skin & Gut Duo (skin), each with its own tiers, prices and Loop plans.
  const [subscribe, setSubscribe] = useState(CHECKOUT.defaultSubscribe);
  const [tierIdx, setTierIdx] = useState(CHECKOUT.defaultTierIndex);
  const hc = heroCommerceFor(rec.hero.key);
  const tiers = hc?.tiers ?? [];
  const tier = tiers[tierIdx] ?? tiers[0] ?? null;
  const heroPdpUrl = withAttribution(rec.hero.pdpUrl);
  const heroAdd = hc && tier ? tierCartAdd(hc, tier, subscribe, answers.size) : null;
  const cadence = tier ? deliveryLabel(answers.size, tier.qty) : null;
  // Show the subscribe/one-time toggle whenever we have both price sets.
  const showPlanToggle = tiers.length > 0 && tiers.every((t) => t.subPrice && t.oncePrice);
  const directReady = heroCheckoutReady(hc);
  // Add to the Shopify cart via a first-party form POST (so the subscription plan
  // attaches), opening the store in a new tab so the result page stays put.
  const goToCheckout = () => {
    onBuy(`${rec.hero.name}${tier ? ` · ${tier.label}` : ""} · ${subscribe ? "sub" : "once"}`);
    if (heroAdd) submitCartAdd(heroAdd, { target: "_blank" });
    else window.open(heroPdpUrl, "_blank", "noopener");
  };
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
    hoped_outcome: answers.goal,
    diet: answers.diet,
    treats: answers.treats,
    breath: answers.breath,
    coat: answers.coat,
    energy: answers.energy,
    eats_grass: answers.grass,
    wind: answers.wind,
    stool_consistency: answers.stool,
    issue_duration: answers.duration,
    tried_before: answers.tried,
    tried_outcome: answers.triedOutcome,
    amount_spent: answers.spend,
    signals_detected: rec.signals,
    recommended_product: rec.hero.name,
    recommended_upsell: rec.upsell?.name ?? null,
    gut_score: rec.gutScore,
    gut_rating: rec.rating,
    quiz_source: "good-for-pets-quiz",
  };

  // Capture EVERY completed quiz (email or not) to the results backend, once, on
  // reaching the result. No-op until the backend is wired; never blocks the page.
  const capturedRef = useRef(false);
  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    saveSubmission({ profile });
  }, [profile]);

  // Live donation total from the published Google Sheet (null until loaded / if it fails).
  const [donated, setDonated] = useState<string | null>(null);
  useEffect(() => { fetchDonationTotal().then(setDonated); }, []);

  // Sticky CTA: appears once the main "Start plan" button has scrolled above the fold.
  const ctaRef = useRef<HTMLButtonElement>(null);
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

        {/* Signals we detected — the evidence behind the diagnosis */}
        {rec.signals.length > 0 && (
          <div className="mt-6">
            <p className="text-center text-sm font-bold uppercase tracking-wide text-brand-ink/50">
              What we picked up on for {dog}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {rec.signals.map((sig) => (
                <span key={sig} className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-3 py-1 text-sm font-semibold capitalize text-brand-red">
                  <span>✓</span> {sig}
                </span>
              ))}
            </div>
            <p className="mx-auto mt-3 max-w-md text-center text-xs text-brand-ink/50">
              Each of these can trace back to the gut, and every one fed into {dogPossessive} score above.
            </p>
          </div>
        )}

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
            Most owners see the first big change within <span className="text-brand-sky">8 weeks</span>, by {etaDate}.
          </h2>
          {rec.benefits.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-sky">What better could look like for {dog}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {rec.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-[15px] text-white/90"><span className="text-brand-sky">✓</span>{b}</li>
                ))}
              </ul>
            </div>
          )}
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
            <rect x="14" y="111" width="72" height="15" rx="7.5" fill="#EF3824" />
            <text x="50" y="121.5" fill="#fff" fontSize="8.5" fontWeight="bold" textAnchor="middle">You are here</text>
            <line x1="34" y1="126" x2="26" y2="136" stroke="#EF3824" strokeWidth="1.5" />
            <circle cx="24" cy="140" r="4.5" fill="#EF3824" stroke="#282C5F" strokeWidth="1.5" />
            <line x1="196" y1="34" x2="196" y2="152" stroke="#fff" strokeOpacity="0.25" strokeDasharray="3 3" />
            <circle cx="196" cy="74" r="5" fill="#fff" />
            <text x="24" y="168" fill="#fff" fillOpacity="0.5" fontSize="9">Today</text>
            <text x="196" y="168" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">Week 8</text>
            <text x="300" y="168" fill="#fff" fillOpacity="0.5" fontSize="9" textAnchor="end">Day 90</text>
          </svg>
          <div className="mt-5 flex items-center gap-4 rounded-2xl border-2 border-brand-sky bg-brand-sky/15 p-5">
            <span className="text-4xl">🛡️</span>
            <p className="text-base leading-snug text-white">
              <strong className="text-brand-sky">90-day money-back guarantee.</strong> If {dog} sees no difference by {guaranteeDate}, we'll refund every penny. No quibbles.
            </p>
          </div>
        </section>

        {rec.triedBefore && (() => {
          const count = answers.tried.filter((t) => t !== "nothing").length;
          const spend = answers.spend ? SPEND_LABEL[answers.spend] : null;
          const outcome = {
            none: "and seen no real difference",
            temporary: "but it keeps coming straight back",
            faded: "but the results never lasted",
            mixed: "with mixed results at best",
          }[answers.triedOutcome ?? "temporary"];
          return (
            <div className="mx-auto mt-6 max-w-md rounded-2xl bg-brand-pink/30 p-4 text-center">
              <p className="text-[15px] font-semibold text-brand-ink/85">
                You've already tried {count} {count === 1 ? "thing" : "things"}
                {spend ? ` and spent ${spend}` : ""}, {outcome}. You're not alone.
              </p>
              <p className="mt-2 text-sm italic text-brand-ink/70">
                "My Frenchie had £120-a-month vet injections. Two months on Good for Pets and the change is amazing."
                <span className="mt-1 block text-xs font-semibold not-italic text-brand-ink/55">Shaun M.</span>
              </p>
            </div>
          );
        })()}

        {/* Recommendation */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="bg-brand-red px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white">
            {dogPossessive} recommended plan
          </div>
          {/* Swipeable product gallery (product shots + a matching real before/after) */}
          <ProductGallery slides={gallerySlides} />
          <div className="p-6">
            <h2 className="text-center text-2xl font-extrabold text-brand-ink">{rec.hero.name}</h2>
            <p className="mt-1 text-center font-semibold text-brand-red">{rec.hero.tagline}</p>
            {/* Personalised note — one tidy block instead of a stack of ticks */}
            <div className="mx-auto mt-4 max-w-sm rounded-xl bg-brand-cream p-3 text-center">
              <p className="text-sm font-semibold text-brand-ink">For a {answers.size ?? "medium"} dog like {dog}: {rec.dose}</p>
              {personalNote && <p className="mt-1.5 text-xs leading-snug text-brand-ink/65">{personalNote}</p>}
            </div>
            {/* What's inside — scannable chips, not a wall of sentences */}
            {rec.hero.highlights && rec.hero.highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {rec.hero.highlights.map((h) => (
                  <span key={h} className="inline-flex items-center gap-1 rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-semibold text-brand-ink/80">
                    <span className="text-brand-red">✓</span>{h}
                  </span>
                ))}
              </div>
            )}
            {rec.smallDog && (
              <p className="mt-4 rounded-xl bg-brand-sky/20 p-3 text-sm text-brand-ink/80">
                🐾 Because {dog} is on the smaller side: these are <strong>twist-open sprinkle capsules</strong>. No giant tablet to crush. Just open and mix into food.
              </p>
            )}
            {/* Buy box — plan toggle → quantity tiers → one-tap direct-to-cart */}
            <div className="mt-6">
              {showPlanToggle && (
                <div className="grid grid-cols-2 gap-1 rounded-full bg-brand-ink/5 p-1" role="tablist" aria-label="Purchase type">
                  <button type="button" role="tab" aria-selected={subscribe} onClick={() => setSubscribe(true)}
                    className={`rounded-full py-2 text-sm font-bold transition-all ${subscribe ? "bg-brand-red text-white shadow" : "text-brand-ink/60"}`}>
                    Subscribe &amp; Save
                  </button>
                  <button type="button" role="tab" aria-selected={!subscribe} onClick={() => setSubscribe(false)}
                    className={`rounded-full py-2 text-sm font-bold transition-all ${!subscribe ? "bg-brand-red text-white shadow" : "text-brand-ink/60"}`}>
                    One-time
                  </button>
                </div>
              )}

              <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="Choose quantity">
                {tiers.map((t, i) => {
                  const selected = i === tierIdx;
                  const price = subscribe ? t.subPrice : t.oncePrice;
                  const tPerDay = pricePerDay(price, answers.size, t.qty);
                  return (
                    <button key={t.label} type="button" role="radio" aria-checked={selected} onClick={() => setTierIdx(i)}
                      className={`relative flex w-full items-center gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition-all ${selected ? "border-brand-red shadow-card" : "border-brand-ink/15 hover:border-brand-red/30"}`}>
                      {t.badge && (
                        <span className="absolute -top-2.5 right-3 rounded-full bg-brand-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">{t.badge}</span>
                      )}
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[11px] ${selected ? "border-brand-red bg-brand-red text-white" : "border-brand-ink/25"}`}>{selected && "✓"}</span>
                      <img src={rec.hero.image} alt="" aria-hidden className="h-10 w-10 shrink-0 object-contain" />
                      <span className="flex-1 font-extrabold text-brand-ink">{t.label}</span>
                      <span className="text-right leading-tight">
                        {tPerDay ? (
                          <>
                            <span className="block text-lg font-extrabold text-brand-ink">{tPerDay}<span className="text-sm font-bold text-brand-ink/70"> /day</span></span>
                            <span className="block text-xs font-semibold text-brand-ink/55">
                              {price} today{t.compareAt && <span className="ml-1 text-brand-ink/35 line-through">{t.compareAt}</span>}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block text-lg font-extrabold text-brand-ink">{price}</span>
                            {t.compareAt && <span className="block text-xs font-semibold text-brand-ink/40 line-through">{t.compareAt}</span>}
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {subscribe && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl bg-brand-cream/70 px-3 py-2.5 text-center text-xs font-semibold text-brand-ink/70">
                  {cadence && <span>🔁 Delivered {cadence}</span>}
                  <span>🏷️ {CHECKOUT.subscription.firstOrderOff}% off first order, {CHECKOUT.subscription.futureOff}% off after</span>
                  {CHECKOUT.subscription.freeShipping && <span>🚚 Free shipping · cancel anytime</span>}
                </div>
              )}

              <button ref={ctaRef} type="button" onClick={goToCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-cta transition-transform active:scale-[0.98] hover:brightness-105">
                {directReady && tier ? `Add ${tier.label} to basket →` : `Start ${dogPossessive} plan →`}
              </button>
              <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-xs text-brand-ink/50">
                <span>🛡️ 90-day money-back guarantee</span>
                <span aria-hidden>·</span>
                <span>🚚 2–3 working days</span>
              </p>
            </div>
          </div>
        </div>

        {/* Flexibility reassurance (guarantee lives in the projection above) */}
        <p className="mt-5 text-center text-sm font-semibold text-brand-ink/60">
          Subscribe &amp; save · pause or cancel anytime · backed by our 90-day results guarantee
        </p>

        {/* Real-customer photo wall — social proof from actual owners */}
        <section className="mt-12">
          <h3 className="text-center text-xl font-extrabold text-brand-ink">Join thousands of UK dogs on Good for Pets</h3>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-brand-ink/60">
            Real dogs, real homes, sent in by their owners. {dog} would be in good company.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {UGC_WALL.map((src) => (
              <img key={src} src={src} alt="A real customer's dog with Good for Pets" loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-card" />
            ))}
          </div>
        </section>

        {/* Matched proof */}
        {rec.proof.length > 0 && (
          <section className="mt-12">
            <h3 className="text-center text-xl font-extrabold text-brand-ink">Dogs just like {dog}, in their owners' words</h3>
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
                Dr Kishan Vara helps guide what goes into every product: evidence-based, cold-pressed so the bacteria stay alive, and made to GMP standards.
              </p>
              <p className="mt-2 text-sm font-bold text-brand-ink">Dr Kishan Vara</p>
              <p className="text-xs text-brand-ink/55">Veterinary surgeon, Royal Veterinary College · our veterinary partner</p>
            </div>
          </div>
        </section>

        {/* 51% mission — links out to the live Our Mission page (current totals live there) */}
        <a href="https://goodforpets.co/pages/our-mission" target="_blank" rel="noopener noreferrer"
          className="mt-10 flex items-center gap-4 rounded-3xl bg-brand-ink p-5 text-left text-white shadow-card transition-transform hover:scale-[0.99]">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-red text-lg font-extrabold">51%</span>
          <span className="flex-1">
            <span className="block font-extrabold">Still making up your mind? Here's one more reason.</span>
            <span className="mt-1 block text-sm text-white/75">
              We give 51% of our profits to animal welfare, so helping {dog} helps thousands of rescue dogs too. See where it goes →
            </span>
            {donated && <span className="mt-1.5 block text-sm font-bold text-brand-sky">{donated} donated so far</span>}
          </span>
        </a>

        <EmailCapture dog={dog} profile={profile} />

        <p className="mx-auto mt-10 max-w-md text-center text-sm text-brand-ink/60">
          Not baked. Not dressed up as a treat. Just what actually works.
        </p>
      </main>

      {/* Sticky CTA — follows the user once the main button scrolls away */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-fade-up border-t border-brand-ink/10 bg-brand-cream/95 backdrop-blur">
          <div className="container-page py-3">
            <button type="button" onClick={goToCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red px-8 py-3.5 text-lg font-bold text-white shadow-cta transition-transform active:scale-[0.98] hover:brightness-105">
              {directReady ? "Add to basket →" : `Start ${dogPossessive} plan →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface GallerySlide {
  src: string;
  alt: string;
  badge?: "h" | "v"; // real before/after slide → show Before/After labels (h=side-by-side, v=stacked)
  name?: string; // the dog in a before/after photo (e.g. "Bear", "Murphy") → labelled on the image
  caption?: string; // shown under the active slide
}

/** Swipeable product-image gallery (native scroll-snap, no library). */
function ProductGallery({ slides }: { slides: GallerySlide[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const go = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = scroller.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const many = slides.length > 1;
  return (
    <div className="relative bg-brand-cream">
      <div ref={scroller} onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s, i) => {
          const contain = s.src.endsWith(".png"); // transparent cutouts render padded, not full-bleed
          return (
            <div key={s.src} className="relative aspect-square w-full shrink-0 snap-center">
              <img src={s.src} alt={s.alt} loading={i === 0 ? "eager" : "lazy"}
                className={`h-full w-full ${contain ? "object-contain p-8" : "object-cover"}`} />
              {s.badge && (
                <>
                  <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Before</span>
                  <span className={`absolute rounded-md bg-brand-red px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${s.badge === "v" ? "bottom-3 left-3" : "right-3 top-3"}`}>After</span>
                  {s.name && <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-ink shadow">{s.name}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {many && (
        <>
          <button type="button" onClick={() => go(active - 1)} aria-label="Previous image"
            className={`absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl leading-none text-brand-ink shadow transition hover:bg-white sm:grid ${active === 0 ? "pointer-events-none opacity-0" : ""}`}>‹</button>
          <button type="button" onClick={() => go(active + 1)} aria-label="Next image"
            className={`absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl leading-none text-brand-ink shadow transition hover:bg-white sm:grid ${active === slides.length - 1 ? "pointer-events-none opacity-0" : ""}`}>›</button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => go(i)} aria-label={`Go to image ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-2 bg-white/55"}`} />
              ))}
            </div>
          </div>
        </>
      )}
      {slides[active]?.caption && (
        <p className="px-4 py-2 text-center text-xs font-medium text-brand-ink/60">{slides[active].caption}</p>
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
    saveSubmission({ profile, email }); // attach the email to this quiz_id row
    const ok = await subscribeEmail(email, profile);
    if (ok) track("CompleteRegistration", { dog_name: dog });
  };
  if (sent) {
    return (
      <div className="mt-12 rounded-2xl bg-white p-5 text-center shadow-card">
        <p className="font-semibold text-brand-ink">Done! {dog}'s plan is on its way. 🐾</p>
      </div>
    );
  }
  return (
    <div className="mt-12 rounded-2xl bg-white p-5 shadow-card">
      <p className="text-center font-semibold text-brand-ink">Want {dog}'s plan emailed to you?</p>
      <p className="mt-1 text-center text-sm text-brand-ink/50">Optional. No spam, unsubscribe anytime.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="you@email.com" className="flex-1 rounded-full border-2 border-brand-ink/15 bg-white px-4 py-3 outline-none focus:border-brand-red" />
        <Button size="md" onClick={submit} className="shrink-0">Email it</Button>
      </div>
    </div>
  );
}
