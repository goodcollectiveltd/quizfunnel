# GFP Quiz Funnel

A quiz-funnel landing page for **Good for Pets**. A dog owner answers 5 quick
questions about their dog's symptoms; we recommend the right product/bundle and
route them into a **symptom-tailored relief lander** that clicks through to the
Shopify PDP.

> Separate repo from `GFP-Landing-Hub` (that's the AI advertorial *generator*).
> This is a hand-built, bespoke marketing funnel. Shares the `company-context/`
> brand brain and the Vite+React+TS+Tailwind stack shape.

## The flow

```
Hook  →  Quiz (symptoms → biggest issue → size → tried-before → name)
      →  "Analysing…" beat
      →  Personalised result (recommendation + matched proof)
      →  /relief/:slug  (symptom-tailored advertorial lander)
      →  Shopify PDP
```

## Run it

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # type-check + production build
```

## Structure

| Path | What it is |
|---|---|
| `src/data/symptoms.ts` | The six symptoms. Each drives **both** a quiz option and its own `/relief/:slug` lander (headline, agitate copy, recommended product). Edit copy here. |
| `src/data/testimonials.ts` | Real reviews from the testimonials bank, tagged by symptom so proof auto-matches. |
| `src/data/products.ts` | Probio+ (hero) and Skin & Gut Duo. **PDP URLs + pricing live here.** |
| `src/lib/recommend.ts` | Quiz state + recommendation engine (product choice, matched/ranked proof). |
| `src/components/quiz/` | The quiz state machine, steps, analysing beat, result page. |
| `src/components/landers/SymptomLander.tsx` | One component renders all six landers from `symptoms.ts`. |

## Recommendation logic

Every symptom in this cluster points at the hero **Probio+** (the cold-press
mechanism that settles the whole skin–gut–ear loop). We upgrade to the **Skin &
Gut Duo** only on a genuine skin/coat signal — itchy skin as the biggest issue,
or itchy skin + paw-licking selected together. Small dogs get a sprinkle-capsule
reassurance (defuses the #1 friction: tablet size).

## Grounding

All copy is drawn from `company-context/` (messaging-bank, personas, testimonials,
product reference). Benefit-led, never medical/cure claims — supplements *support*,
they don't *treat/cure/prevent*. Brand red `#EF3824`.

## Images

The **landers** carry imagery (the quiz stays text-only by design). All assets live in
`public/images/` (web-optimised, ~2.4MB total) and are wired via data:

- **Product cut-outs** (`products/*.png`) — `Product.image` in [products.ts](src/data/products.ts); shown on the offer card and the quiz result.
- **Symptom photos** (`symptoms/*.jpg`, 3:2) — `Symptom.image` in [symptoms.ts](src/data/symptoms.ts), in the "Sound familiar?" section. `scooting` & `tear-staining` have no photo (none exists on free stock) and render text-only.
- **Ears before/after** (`symptoms/gunky-ears-before-after.jpg`) — real customer proof, a dedicated "Real result" block on the ears lander (`Symptom.beforeAfter`).
- **Vet** (`people/kishan.jpg`) and **UGC dog** (`ugc/happy-dog.jpg`) — shared trust strip + final-CTA image (constants in [SymptomLander.tsx](src/components/landers/SymptomLander.tsx)).
- **Review avatars** (`reviews/*.jpg`) — real community dogs used as testimonial profile photos, mapped per review in the `AVATARS` table in [testimonials.ts](src/data/testimonials.ts) (breed-matched where known; assigned so no two dogs collide on a lander). Decorative authenticity — not a claim that a given dog is that reviewer's.

Team names/titles/accreditations for on-page use: `company-context/people-and-team.md` (e.g. "Dr Kishan Vara, our veterinary partner").

Source & captions: `company-context/image-bank/INDEX.md`. To re-crop from full-res originals, use `company-context/image-bank/_tools/crop.py`. All image-bank assets are cleared for Good for Pets use.

## ⚠️ Open items before going live ([TO CONFIRM])

1. **PDP URLs** — `src/data/products.ts` uses placeholder Shopify handles
   (`/products/5-strain-probiotic-plus`, `/products/skin-and-gut-duo`). Swap for
   the real goodforpets.co product URLs.
2. **Pricing** — intentionally not shown (unconfirmed in the brand brain). The PDP
   states the price. If you want price on-page, add it to `products.ts`.
3. **Email capture** — the optional "email me the plan" field is UI-only. Wire it
   to your list (Klaviyo/Shopify) — see the `TODO` in `Result.tsx`.
4. **Analytics** — no Meta Pixel / UTM passthrough yet (add for ad attribution).
5. **Full names in proof** — reviews are from public platforms; confirm before
   using full names in paid ads (per the testimonials bank note).
