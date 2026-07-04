import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { StarRating } from "@/components/ui/StarRating";
import { TrustBar } from "@/components/ui/TrustBar";
import type { Symptom } from "@/data/symptoms";
import { PRODUCTS } from "@/data/products";
import { testimonialsFor } from "@/data/testimonials";

export function SymptomLander({ symptom }: { symptom: Symptom }) {
  const product = PRODUCTS[symptom.recommend];
  const upsell = symptom.skinUpsell ? PRODUCTS.skinGutDuo : null;
  const proof = testimonialsFor(symptom.id);
  const cta = (label: string) => (
    <Button href={product.pdpUrl} className="w-full max-w-sm">
      {label}
    </Button>
  );

  return (
    <div className="min-h-dvh">
      {/* Hero */}
      <header className="bg-brand-red text-white">
        <div className="container-wide flex items-center justify-between py-4">
          <Logo variant="white" />
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
            51% of profits to charity
          </span>
        </div>
        <div className="container-page pb-14 pt-6 text-center">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {symptom.emoji} {symptom.eyebrow}
          </span>
          <h1 className="mt-4 text-[30px] font-extrabold leading-[1.12] sm:text-[38px]">
            {symptom.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/90">{symptom.subhead}</p>
          <div className="mt-7 flex flex-col items-center gap-3">
            {cta(`Get ${product.name} →`)}
            <div className="flex items-center gap-2 text-sm text-white/90">
              <StarRating className="text-white" />
              <span>Rated 5★ by real dog owners</span>
            </div>
          </div>
        </div>
      </header>

      {/* Agitate */}
      <section className="container-page py-14 text-center">
        <h2 className="text-2xl font-extrabold text-brand-ink">Sound familiar?</h2>
        <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-brand-ink/75">
          {symptom.agitate}
        </p>
      </section>

      {/* Mechanism — the #1 differentiator */}
      <section className="bg-white py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-extrabold text-brand-ink">
            Why it keeps coming back
          </h2>
          <p className="mt-3 text-center text-brand-ink/75">
            So much of the itching, licking and gunk starts in the gut. But here's the catch most
            owners never hear:
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-brand-cream p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-ink/50">Baked chews</p>
              <p className="mt-2 font-semibold text-brand-ink">
                Heat-treated — which kills the live bacteria before they ever reach your dog's gut.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-red p-5 text-white">
              <p className="text-sm font-bold uppercase tracking-wide text-white/70">Our cold-press</p>
              <p className="mt-2 font-semibold">
                Never baked — so 5 billion live bacteria actually survive to do their job.
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-brand-ink/75">
            That's the difference owners feel when they switch. Not dressed up as a treat — just what
            actually works.
          </p>
          <div className="mt-8 flex justify-center">{cta(`Try ${product.name} →`)}</div>
        </div>
      </section>

      {/* Proof — matched to this exact symptom */}
      {proof.length > 0 && (
        <section className="py-14">
          <div className="container-wide">
            <h2 className="text-center text-2xl font-extrabold text-brand-ink">
              Real owners, this exact problem
            </h2>
            <p className="mt-2 text-center text-brand-ink/60">
              Verified reviews from Facebook &amp; Trustpilot.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {proof.slice(0, 4).map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offer / product */}
      <section className="bg-white py-14">
        <div className="container-page">
          <div className="overflow-hidden rounded-3xl bg-brand-cream shadow-card">
            <div className="bg-brand-ink px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white">
              The plan for {symptom.eyebrow.toLowerCase()}
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-extrabold text-brand-ink">{product.name}</h3>
              <p className="mt-1 font-semibold text-brand-red">{product.tagline}</p>
              <p className="mt-3 text-sm text-brand-ink/70">{product.format}</p>
              <ul className="mt-4 space-y-2">
                {product.contents.map((c) => (
                  <li key={c} className="flex gap-2 text-[15px] text-brand-ink/80">
                    <span className="text-brand-red">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-center">{cta("See price & subscribe →")}</div>
              <p className="mt-3 text-center text-xs text-brand-ink/50">
                Subscribe &amp; save — pause or cancel anytime. Most orders arrive in 2–3 working days.
              </p>
            </div>
          </div>

          {/* Add-on upsell — extra skin & coat support */}
          {upsell && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-dashed border-brand-red/40 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-red">
                Want to go further?
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-brand-ink">{upsell.addOnLabel}</h3>
              <p className="mt-1 text-sm text-brand-ink/70">{upsell.addOnBlurb}</p>
              <a
                href={upsell.pdpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-red underline underline-offset-4"
              >
                {upsell.addOnLabel} →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Expectation-setting (prevents efficacy churn) + charity closer */}
      <section className="container-page py-14 text-center">
        <h2 className="text-2xl font-extrabold text-brand-ink">Give it the full window</h2>
        <p className="mx-auto mt-3 max-w-md text-brand-ink/75">
          Many owners see a change in 2–6 weeks — some sooner, some a little longer. It's working from
          the inside out, so give it the time it needs.
        </p>
        <div className="mx-auto mt-8 max-w-md rounded-2xl bg-brand-pink/30 p-5">
          <p className="font-semibold text-brand-ink">Every order does double good</p>
          <p className="mt-1 text-sm text-brand-ink/75">
            51% of our annual profit goes to animal welfare charities. Help your dog, help others.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-red py-14 text-center text-white">
        <div className="container-page">
          <h2 className="text-3xl font-extrabold">Ready to stop guessing?</h2>
          <p className="mx-auto mt-3 max-w-sm text-white/90">
            Give {product.name} a proper go — backed by real reviews and a wall of happy dogs.
          </p>
          <div className="mt-7 flex flex-col items-center gap-4">
            <Button href={product.pdpUrl} variant="ghost" className="w-full max-w-sm">
              Get {product.name} →
            </Button>
            <Link to="/" className="text-sm text-white/80 underline underline-offset-4">
              ← Retake the quiz
            </Link>
          </div>
        </div>
      </section>

      <footer className="container-page py-8">
        <TrustBar />
        <p className="mt-4 text-center text-xs text-brand-ink/40">
          Good for Pets supplements help support everyday health &amp; comfort. They are not intended
          to diagnose, treat, cure or prevent any condition. For a specific medical concern, speak to
          your vet.
        </p>
      </footer>
    </div>
  );
}
