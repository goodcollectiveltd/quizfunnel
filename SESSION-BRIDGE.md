# Session Bridge — GFP Quiz Funnel

Handoff for continuing in a fresh chat. Written 6 Jul 2026. Read this + `README.md` +
`DEPLOY.md` first.

---

## 1. What this is
A **quiz funnel** for **Good for Pets** (UK dog-probiotic brand). A dog owner answers a
vet-guided assessment about symptoms + owner-observable gut signals; it returns a
personalised **"gut balance" diagnosis + score**, recommends **5 Strain Probiotic+**
(or the **Skin & Gut Duo** upsell), and sends them to the **Shopify PDP**.

- **Separate repo** from the sibling `GFP-Landing-Hub` (that's an AI advertorial
  *generator*; this is a hand-built funnel). Both live under `C:\Users\will\GoodForPets\`.
- Shares the **`company-context/`** brand brain (messaging, personas, testimonials,
  products, images, playbooks).
- **Stack:** Vite + React 18 + TS + Tailwind. **No backend** — pure static SPA; the only
  "server" it talks to is Shopify (via CTA links) and Klaviyo (client-side email capture).

## 2. 🟢 IT IS LIVE
**https://quiz.goodforpets.co** — valid HTTPS, working. (See the hosting saga in §6.)

---

## 3. Local dev
```bash
cd C:/Users/will/GoodForPets/GFP-Quiz-Funnel
npm install
npm run dev      # http://localhost:8080  (use the preview_* tools, not Bash, to run it)
npm run build    # tsc -b && vite build -> dist/
```
Preview screenshots are flaky — **verify via `preview_eval` DOM checks** (there are
self-driving quiz scripts in the chat history to copy).

## 4. The current flow (order matters — set in `buildSequence` in QuizFunnel.tsx)
**Landing (hook):** logo + root-cause headline + subhead + **testimonial card** (Kim
Berly / T38) + **first question inline** ("What's your dog's name?") + Start — Mars-Men style.

Then: **size → age → symptoms (multi)** → *[stat card: 80% immune system in gut]* →
**diet → treats** → *[BEFORE/AFTER midway card]* → **breath → coat → energy → grass →
wind → stool (Bristol chart) → when-first-noticed → what-tried (multi)** → *(if tried
anything)* **did-it-work → how-much-spent** → *[conditional "why it failed" card]* →
**Analysing (checklist loader)** → **Result**.

**Result page:** diagnosis header (verdict names every signal) → **gut-balance gauge
(x/100)** → **"What we picked up on"** evidence chips → root-cause cards → **projection**
(personalised 8-week first-change date + 90-day money-back guarantee, with a growth
chart) → personalised **empathy line** (tried N things, spent £X, outcome) → **product
recommendation** (Probio+, dosed by size) + **Skin & Gut Duo upsell** (skin signal only)
→ guarantee → matched testimonials (real dog-photo avatars) → **Dr Vara vet strip** →
**Klaviyo email capture** → **sticky CTA**. CTAs → Shopify PDP with attribution appended.

## 5. Key files
| File | Role |
|---|---|
| `src/lib/recommend.ts` | `QuizAnswers` model, **multi-factor `gutScore`**, `buildRecommendation` (verdict, `signals`, rootCauses, dose, upsell, before/after kind) |
| `src/components/quiz/QuizFunnel.tsx` | Whole quiz: hook (landing), all question steps, interstitial cards, the step-sequence engine |
| `src/components/quiz/Result.tsx` | Diagnosis/result page (gauge, signals, projection, recommendation, empathy, sticky CTA, email capture) |
| `src/components/quiz/Analysing.tsx` | Checklist "building your plan" loader |
| `src/data/symptoms.ts` | 6 symptoms (+ `noun`) |
| `src/data/testimonials.ts` | Testimonials + `AVATARS` map (real dog photos per review) |
| `src/data/products.ts` | Probio+ / Omega / Skin&Gut Duo + **real PDP URLs** |
| `src/lib/tracking.ts` | Meta Pixel + GA4 + **UTM/fbclid passthrough to Shopify** (env-driven, no-op without keys) |
| `src/lib/subscribe.ts` | Klaviyo client-side subscribe (saves full quiz profile inc. dog name) |
| `public/images/` | product cut-outs, symptom photos, before/afters, vet, UGC, review avatars — all web-optimised |
| `company-context/quiz-funnel-playbook.md` | Mars Men + Science for Pets teardown (the design reference) |
| `company-context/people-and-team.md` | How to credit Will + Dr Vara (names, titles, accreditations) |

## 6. Hosting (⚠️ read before touching deploy — hard-won)
- **GitHub:** `github.com/goodcollectiveltd/quizfunnel`, branch **`master`** (default). Push → auto-deploys.
- **LIVE HOST = Netlify.** Project **`eclectic-buttercream-13faa6`** (`eclectic-buttercream-13faa6.netlify.app`), custom domain `quiz.goodforpets.co`, valid Let's Encrypt cert. Connected to the GitHub repo → **auto-deploys on every push to master**. `netlify.toml` holds build cmd + SPA redirect.
- **GitHub Pages: DEAD END** — never issued an SSL cert for this domain despite correct DNS/CAA (a GitHub-side failure). Should be unpublished. `.github/workflows/deploy.yml` + `public/CNAME` are leftovers; harmless but unused.
- **Cloudflare: a Worker exists** (`quizfunnel.will-1a1.workers.dev`) from a mid-saga attempt. Can't take the custom domain (Worker needs the zone on Cloudflare; the domain's DNS is **Shopify-locked** — nameservers are `ns-cloud-*.googledomains.com`). Harmless; optional to delete.
- **DNS (managed in Shopify → Domains → DNS settings):** `quiz` **CNAME → `eclectic-buttercream-13faa6.netlify.app`**, plus a `subdomain-owner-verification` **TXT** record (Netlify ownership check). Do NOT point it back at GitHub.
- **Gotchas:** don't add a `_redirects` file (Cloudflare's build chokes on it — Netlify uses `netlify.toml`). After DNS changes, browsers cache the old cert hard (HSTS) — clear via `ipconfig /flushdns` + `chrome://net-internals/#dns` or use Incognito.

## 7. Config / env vars
Set in **Netlify → Site config → Environment variables** (then trigger a redeploy). All optional; without them tracking/email are safe no-ops.
- `VITE_KLAVIYO_PUBLIC_KEY`, `VITE_KLAVIYO_LIST_ID` — **user added these**; quiz finishers land in a Klaviyo **"Quiz Leads"** list with the full profile (dog name, all symptoms/signals, gut score, spend, etc.).
- `VITE_META_PIXEL_ID`, `VITE_GA4_ID` — not set yet (optional).

**Real PDP URLs** (in `products.ts`): Probio+ → `/products/5-strain-probiotic`; Skin & Gut Duo → `/products/skin-and-gut-love`. **Omega handle is still a placeholder** (`/products/omega-3-6-9-complex`) — unused in UI, confirm before ever using.

## 8. Verified working
4-scenario error test passed: gut scores customise (18 / 20 / 52 / 63 / 74), dose adapts
to size, Duo upsell only on skin signal, conditional "why it failed" cards fire, before/
after picks skin vs ears correctly, verdict names all signals, no console errors.

## 9. Open items / next steps (nothing blocking — it's live)
- **Personalisation cluster I proposed & parked (highest ROI):** (1) reflect the clinical
  answers back in the diagnosis copy; (2) symptom-matched product benefit bullets; (3) use
  **age** (puppy <12wk compliance note; senior angle) + **diet** in copy; (4) show a
  gut-relevant before/after for tummy-only dogs (currently defaults to skin).
- **Conversion:** Shopify **cart permalink** to pre-add the product at the right qty (needs
  variant IDs) — biggest pure-conversion lever; quiz-completer discount code; aggregate
  star/review bar near CTA.
- **Tiny polish:** evidence chips use title-case ("A Dull Or Flaky Coat") — switch to
  sentence case if wanted.
- **Content to confirm:** the **90-day money-back guarantee** wording must match the real
  returns policy; Omega PDP handle.
- **Housekeeping:** unpublish GitHub Pages; optionally delete the Cloudflare Worker; add
  Meta Pixel/GA4 env vars when ready.
- Quiz is ~15 questions (deliberately comprehensive per owner's request) — watch completion.

## 10. Owner & voice
Owner = **Will (William Rushmere)**, founder, non-technical, hands-on, moves fast, wants
action over lengthy planning. Brand voice: honest, sincere, not slick (persona "Sue"
distrusts marketing). Lead on skin/paw/ear relief; gut is the *mechanism*, not the hook.
Compliance: supplements *support/help*, never *treat/cure/prevent*.
