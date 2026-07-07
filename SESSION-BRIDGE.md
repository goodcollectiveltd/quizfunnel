# Session Bridge — GFP Quiz Funnel

Handoff to continue in a fresh chat. Written 7 Jul 2026. Read this + `README.md` +
`DEPLOY.md` first. (There are also memory files: `quiz-funnel-buy-box`, `quiz-funnel-content`.)

---

## 1. What this is
A **quiz funnel** for **Good for Pets** (UK dog-probiotic brand). A dog owner answers a
vet-guided assessment; it returns a personalised **"gut balance" diagnosis + score**,
recommends **5 Strain Probiotic+** (or the **Skin & Gut Duo** for skin cases), and lets
them **buy straight from the result** (direct-to-cart, no PDP hop).

- **Separate repo** from the sibling `GFP-Landing-Hub`. Both under `C:\Users\will\GoodForPets\`.
- Shares the **`company-context/`** brand brain.
- **Stack:** Vite + React 18 + TS + Tailwind. Static SPA, no backend. Talks to Shopify
  (cart) + Loop (subscriptions) + Klaviyo (email) + a published Google Sheet (donation total).

## 2. 🟢 LIVE
**https://quiz.goodforpets.co** (Netlify, auto-deploys on push to `master`).

## 3. Local dev
```bash
cd C:/Users/will/GoodForPets/GFP-Quiz-Funnel
npm install && npm run dev      # http://localhost:8080
npm run build                    # tsc -b && vite build
```
⚠️ **Preview tooling was flaky all session** — `preview_screenshot` reliably times out and
the dev server keeps dropping. `preview_eval` (DOM) works; verify with self-driving scripts
(examples throughout chat history). To confirm a deploy landed: compare the JS hash in
`dist/index.html` to what `curl -sL quiz.goodforpets.co` serves.

## 4. Current flow — **10 questions** (single dog)
Landing (hook): logo · root-cause headline · **Kim Berly** review · first Q inline
("dog's name") · Start · "No email needed" · trust bar.

Then: **size → age → symptoms (multi)** → *[card: 80% immune in gut]* → **diet → goal**
→ *[card: "You're in the right place" — goal-matched image]* → **signs (combined multi-select) →
poos (Bristol) → duration → tried (multi)** → *(if tried)* **did-it-work** → *[card: "no
wonder it hasn't stuck" OR first-timer]* → **Analysing (~5s, features Dr Vara)** → **Result**.

- **`goal` question** ("What would mean the most for [dog]?") is **single-select** (subhead
  says "pick one"). Options: `paws | skin | ears | tummy | happy`. Drives the confirmation
  card image via `GOAL_CARD` — **real before/afters for skin & ears only**; paws/tummy/happy
  use honest **aspirational** stock (`public/images/goals/`), NO fake before/after labels.
- **`signs`** = ONE checklist that replaced 5 separate gut-signal questions; each tick maps
  to the underlying answer field (breath/coat/energy/grass/wind) so scoring is unchanged.
- `treats` and `spend` questions were **removed** (fields kept, unused).

## 5. Result page (top→bottom)
Diagnosis + gut gauge /100 · evidence chips · root-cause cards · **projection** (8-wk ETA,
growth chart with a red "You are here" chip, **prominent 90-day guarantee**) · empathy line
(uses **Shaun M** review — no longer duplicating the landing) · **recommendation + buy box**
· UGC photo wall · matched reviews · **51% mission card** (live donation total + link) · vet
strip · optional Klaviyo email capture · sticky CTA.

**Buy box** = **direct-to-cart** (form POST to `goodforpets.co/cart/add`, NOT a permalink —
permalinks silently drop `selling_plan`). Product-aware hero: **skin signal → Skin & Gut Duo,
else 5 Strain Probiotic+**. Tiers 1/2/3 tubs (each its own variant), subscribe/one-time toggle
(subscribe default), **per-day price as the primary number** ("£0.35/day") with pay-today total
secondary, size-matched **cadence label = true run-rate** (`refillDays`, so 3 tubs/small = "every
9 months" even though Loop ships sooner — intentional, Will's call).

## 6. Key files
| File | Role |
|---|---|
| `src/components/quiz/QuizFunnel.tsx` | Hook, all steps, cards, sequence engine (`buildSequence`, `QUESTION_KEYS`), `GOALS`/`GOAL_ECHO`/`GOAL_CARD` |
| `src/components/quiz/Result.tsx` | Result page, buy box, per-day price, mission card, donation fetch |
| `src/components/quiz/Analysing.tsx` | ~5s loader with Dr Vara |
| `src/lib/recommend.ts` | `QuizAnswers`, `gutScore`, `buildRecommendation` (hero=Duo on skin), `ageNote`/`dietNote`/`benefits`, `Goal` type |
| `src/lib/commerce.ts` | **Live variant IDs + Loop selling-plan IDs**, `HERO_TIERS`/Duo config, `tierCartAdd`/`submitCartAdd` (form POST), `deliveryLabel`, `pricePerDay`, `CHECKOUT` |
| `src/lib/donation.ts` | Fetches live donation total from the published Google Sheet CSV |
| `src/data/products.ts` | Products; user-facing name is **"5 Strain Probiotic+"** (not "Probio+") |
| `public/images/{products,ugc,goals,symptoms}/` | All web-optimised (cropped from `company-context/image-bank/` via `_tools/crop.py`) |

## 7. Config / real IDs (all in `src/lib/commerce.ts`, from goodforpets.co storefront)
- **5 Strain Probiotic+** variants: 1 Tub `57197308674392` · 2 Tubs `57197308707160` · 3 Tubs `57197308739928`.
- **Skin & Gut Duo** variants: 1 Pack `57127134593368` · 2 `57127134626136` · 3 `57127134658904`.
- **Loop plans** — Probiotic: 30d `693194850648`, 45d `693194883416`, 60d `693194916184`, 90d `693194785112` (default). Duo: 30/40/60/90/120/180/240 (`691305709912`/`691311903064`/`691308495192`/`693139767640`/`691311935832`/`693139800408`/`692923171160`). Sub = 30% first order, 20% recurring, free shipping.
- `CHECKOUT.discountCode` = "" (none). Donation sheet URL is in `donation.ts` (published tab, gid 2004999887).
- Klaviyo/Meta/GA4 env vars set in Netlify (optional no-ops without them).

## 8. Open items / next steps
- ⚠️ **Do a real live-store checkout smoke test:** pick Subscribe → Add to basket → confirm
  Shopify checkout shows the discounted first price AND the "then £X every N days" recurring
  line. Cart-level attach is verified (curl), but a human should confirm the checkout display.
- **Multi-dog:** was built then **removed this session** (added confusion). If revisited: Phase
  1.5 = ask each extra dog's size (quick, accurate dosing/qty); Phase 2 = genuinely different
  products per dog on one sub — needs a Storefront-API cart (permalinks/`/cart/add` can't set
  per-line selling plans). **Deliberately not in right now.**
- Loop cadence gap: Probiotic maxes at 90-day, Duo at 240-day plans. Adding longer cadences in
  Loop would let big multi-tub orders ship at the true rate; for now the *label* shows the true
  run-rate and Loop ships a touch sooner (safe overlap).
- Live donation figure: keep the Google Sheet tab **published**; if its cell/tab moves, update `donation.ts`.
- Static ad swipe file lives in `company-context/ad-swipe-file/` (INDEX + 32 example ads).

## 9. Owner & voice
Owner = **Will (William Rushmere)**, founder, non-technical, moves fast, wants action over
planning. Brand voice: **honest, sincere, not slick** (persona "Sue" distrusts marketing).
Lead on skin/paw/ear relief; gut is the *mechanism*, not the hook. Compliance: supplements
*support/help*, never *treat/cure/prevent*. **Honesty rule for imagery:** only claim
before/after where it's a real customer photo (skin & ears); everything else is aspirational.

## 10. Hosting (unchanged; hard-won — see git history if touching deploy)
GitHub `github.com/goodcollectiveltd/quizfunnel`, branch `master` → **Netlify** project
`eclectic-buttercream-13faa6`, custom domain `quiz.goodforpets.co`, auto-deploy on push.
DNS in Shopify (CNAME → netlify). Don't add a `_redirects` file (`netlify.toml` handles SPA).
