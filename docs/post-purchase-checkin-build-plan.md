# Post-Purchase Check-In — Build Plan

A branded, owned replacement for the post-purchase survey (and the before/after → gift loop),
running on the quiz subdomain instead of Typeform. Feeds the Klaviyo post-purchase flow's
segmentation (Happy / Neutral / Unhappy → review branch) and stores all data in our own DB.

> Scope note: this replaces ONLY the day-30 post-purchase check-in + the day-90 before/after.
> Keep the long 24-Q "Community Feedback Survey" on Typeform for periodic research — it doesn't
> need this integration.

---

## 1. Why custom (recap)
- **Own the data** — responses live next to orders/subscription/LTV; joinable analysis Typeform can't do.
- **Native pre-fill** — we already know dog name, breed, weight, symptoms; don't re-ask.
- **Reliable segmentation** — server-side Klaviyo events beat Typeform→Zapier for the flow branch.
- **Photo→gift loop** — before/after uploads to our storage; gift code issued in one server step.
- **Brand + cost** — looks like us, no per-response fee at subscription scale.

## 2. Architecture

```
Klaviyo email  ──▶  quiz.goodforpets.co/check-in?t=<signed token>   (React page, static)
                                     │  POST answers
                                     ▼
                         /api/checkin  (serverless fn)
                          ├─ verify token → resolve profile (id, email, dogName)
                          ├─ insert row → Supabase (checkin_responses)
                          └─ fire Klaviyo server event "Completed Check-in" (+ props)
                                     │
                                     ▼
                    Klaviyo Flow B branches on checkin_satisfaction / consent
```

- **Isolation:** this ships as a **separate repo/deploy (`gfp-checkin`)** mounted onto the quiz
  subdomain via a host rewrite — it does NOT live in the funnel app. Full detail in
  `checkin-backend-framework.md`. Reuse of `components/ui/*` + `SYMPTOMS` is **by copy, not import**,
  so there's zero shared build with the live funnel.
- **Frontend:** React pages (`/check-in`, `/before-after`) in `gfp-checkin`, Tailwind theme copied,
  config-driven and no-op friendly like `lib/subscribe.ts`.
- **Backend (new, thin):** `/api/checkin/*` serverless functions in `gfp-checkin` — needed for
  secrets (Klaviyo private key, Shopify Admin, signing secret) and photo handling. Keep it minimal.
- **Data + storage:** Supabase (Postgres + Storage). Org already uses Supabase elsewhere.
- **Integrations:** Klaviyo (server events), Shopify Admin API (gift discount codes).

## 3. Customer identification (no PII in the URL)
- Email link carries an **opaque signed token**, never the raw email.
- Token = `base64url({ pid, exp }) + "." + HMAC_SHA256(payload, TOKEN_SIGNING_SECRET)`
  where `pid` = Klaviyo profile id. Server verifies the HMAC + expiry, then looks up email +
  dog name from Klaviyo by `pid`.
- **Minting the token:** a Klaviyo flow **webhook action** at flow-entry POSTs to
  `/api/mint-token` (pid in body) → returns the signed token → written back to the profile as
  `checkin_token`. Email CTA then links `…/check-in?t={{ person.checkin_token }}`.
  *(Fallback if webhook-mint is fiddly: a nightly serverless cron stamps tokens on profiles that
  entered the flow.)*
- Tokens expire (e.g. 45 days for check-in, 120 for before/after). Expired → friendly "link
  expired, here's a fresh one" page that re-mints.

## 4. The check-in survey (in-depth, ~16 Qs, sectioned)
Will wants the *depth* of the original research survey — it's a high-value insight source — so this
keeps the breadth but (a) adds the missing OUTCOME questions, (b) collapses the 7-question
feature-importance 1–5 matrix into one, (c) pre-fills what we know, (d) reorders so the
segmentation questions come first. Questions live in a config file (`src/data/checkin.ts`),
grouped into sections; `{dogName}` is interpolated from the resolved profile.

> **Key advantage over Typeform — save per question.** The frontend PATCHes each answer as it's
> given (`/api/checkin` upsert), so even a partial completion still captures the outcome +
> testimonial in Section A. That removes the "long survey = low usable data" trade-off: we can be
> in-depth AND still get segmentation from everyone who starts. **Outcome-first ordering guarantees
> the branch-critical answers are saved before anyone can drop off.**

**Section A — How's it going** *(outcome; asked first → drives segmentation)*
- `satisfaction` (single, required): Overall, how's {dogName} doing? — Big / Some / Too early / No change / Worse
- `improved` (multi): Which have improved? (`SYMPTOMS` + Coat, Energy, Firmer poos, None yet)
- `testimonial` (long text): In your words, what difference have you noticed?
- `nps` (0–10): How likely to recommend us?

**Section B — Your dog** *(pre-filled where known; shown only if missing)*
- `breed` · `dog_age` · `weight` · `original_symptoms` (multi) · `tried_other_probiotics` (Yes/No)

**Section C — Why us** *(positioning / VOC)*
- `trust_reason` (text): What made you trust us enough to try?
- `choice_reason` (text): What made you choose us over others?
- `aspiration` (text): If it keeps working for {dogName}, what would that mean for you both?

**Section D — What matters to you** *(replaces the 1–5 matrix)*
- `top_features` (pick up to 2): 5bn potency / 5 strains / human-grade capsule / 6 enzymes / prebiotic inulin / UK-GMP / 51% to charity

**Section E — Help us improve** *(roadmap)*
- `launch_next` (single + other): multi-purpose capsule / shelter community days / green-lipped mussel / other
- `improvement_idea` (text): #1 thing we could improve?

**Section F — About you** *(optional research)* **+ consent**
- `age_range`, `gender`, `working_status` — optional demographics (fix the `Unemplyed` typo)
- `consent` (single, required): Share your words (and a photo) as a review? — Named / Anonymous / No

Pre-filled from profile (never asked unless missing): email, name, dog name, breed, weight, symptoms.
Reuse `SYMPTOMS` from `src/data/symptoms.ts` for the improved / original-symptom questions.

**Segmentation mapping (drives Flow B):**
- `satisfaction` ∈ {big, some} → **Happy** → E7 review ask (only if `consent` ≠ no)
- `satisfaction` = early → **Neutral** → reassurance email, stays in gift timeline
- `satisfaction` ∈ {none, worse} → **Unhappy** → Will's personal save email, **suppress review asks**

## 5. Before/after page (`/before-after`) — Phase 2
- Two file inputs (before / after), optional note, gift-product picker
  (Omega 3-6-9 / Joint / Multivitamin / Calming), consent re-confirm.
- On submit → `/api/before-after`: upload photos to **private** Supabase Storage bucket →
  generate single-use Shopify discount (100% off one item from a "Gift-Eligible" collection,
  capped £32.99) → insert row → Klaviyo event `Submitted Before/After` (+ `gift_code`) →
  show the code + "check your email".

## 6. Data model (Supabase)

```sql
-- Row is created on first PATCH and upserted per question (autosave), so most cols are nullable.
create table checkin_responses (
  id uuid primary key default gen_random_uuid(),
  klaviyo_profile_id text not null unique,   -- upsert key (one live row per profile per flow)
  shopify_customer_id text,
  email text,                       -- resolved server-side, not from URL
  dog_name text,
  -- Section A (outcome)
  satisfaction text,                -- big | some | early | none | worse  (saved first)
  improved_symptoms text[],
  testimonial_text text,
  nps int,
  -- Section B (dog)
  breed text, dog_age text, weight text,
  original_symptoms text[], tried_other_probiotics boolean,
  -- Section C (why us)
  trust_reason text, choice_reason text, aspiration text,
  -- Section D/E (research + roadmap)
  top_features text[], launch_next text, improvement_idea text,
  -- Section F (demographics + consent)
  age_range text, gender text, working_status text,
  consent text,                     -- named | anonymous | no
  source text default 'checkin_day30',
  completed_at timestamptz,         -- set when final section submitted (partial = null)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table before_after_submissions (
  id uuid primary key default gen_random_uuid(),
  klaviyo_profile_id text not null,
  email text,
  dog_name text,
  before_photo_path text,
  after_photo_path text,
  note text,
  gift_product text,                -- omega | joint | multivitamin | calming
  gift_code text,
  gift_code_redeemed boolean default false,
  consent text,
  created_at timestamptz default now()
);
```
Storage: private bucket `before-after/`; team views via short-lived signed URLs (no public access).

## 7. API endpoints (serverless)
- `POST /api/mint-token` — { pid } → signed token (called by Klaviyo webhook).
- `POST /api/checkin` — { token, partial } → verify → **upsert** row keyed on profile (per-question
  autosave). Interim PATCHes just persist. On the FINAL section, also set `completed_at` and fire the
  Klaviyo `Completed Check-in` event with all props. (A short debounce/section-boundary batching is
  fine — don't fire an HTTP call on every keystroke.)
- `POST /api/before-after` — multipart { token, before, after, giftProduct, note, consent } →
  verify → upload → Shopify code → insert → Klaviyo event → { giftCode }.
- Shared `verifyToken(token)` util → `{ pid, email, dogName }` (email/dogName fetched from
  Klaviyo by pid). Rate-limit + validate file type/size (jpg/png/heic, ≤10MB).

**Klaviyo server event payload** (`/api/checkin`):
```json
{ "data": { "type": "event", "attributes": {
  "metric": { "data": { "type": "metric", "attributes": { "name": "Completed Check-in" } } },
  "profile": { "data": { "type": "profile", "attributes": { "email": "<resolved>" } } },
  "properties": {
    "checkin_satisfaction": "some", "improved_symptoms": ["gunky-ears","tummy"],
    "nps": 9, "consent_to_share": "named", "testimonial_text": "…", "why_chose_us": "…"
  }
}}}
```
Also write the same fields as **profile properties** so segments/filters can use them directly.

## 8. Gift issuance (Shopify Admin)
- Create a **"Gift-Eligible" collection** (Omega, Joint, Multivitamin, Calming).
- `/api/before-after` calls Shopify Admin `priceRule`/`discountCode` (or Functions) to mint a
  **single-use** code: 100% off one item from that collection, cap £32.99, usage limit 1,
  expires (e.g. 30 days).
- Store `gift_code`; track redemption via a Klaviyo/Shopify `Placed Order` using that code →
  set `gift_code_redeemed`; unredeemed after 14 days → reminder (Klaviyo).

## 9. Env vars
Client (`VITE_`, safe to expose): `VITE_CHECKIN_API_BASE` (optional; defaults to same origin).
**Server-only (never `VITE_`):**
```
KLAVIYO_PRIVATE_KEY=        # server events + profile lookup
TOKEN_SIGNING_SECRET=       # HMAC for the link token
SUPABASE_URL=
SUPABASE_SERVICE_KEY=       # server-side only
SHOPIFY_ADMIN_TOKEN=
SHOPIFY_STORE_DOMAIN=
```
Keep the existing client-side `VITE_KLAVIYO_*` for the quiz's email capture — separate concern.

## 10. Reporting / insights
- Supabase SQL views for: response rate, satisfaction split, NPS, per-symptom improvement rate,
  count of shareable testimonials (consent ≠ no), before/after conversion, gift redemption.
- Point **Metabase** (or Supabase's dashboard) at those views — recovers Typeform's reporting.

## 11. Privacy & security
- No PII in URLs (opaque signed token only) — aligns with our data policy.
- Private photo bucket; signed-URL access; consent recorded and enforced before any public use.
- GDPR: a delete path (by email/pid) that purges responses + photos.
- All secrets server-side; validate/limit uploads; rate-limit endpoints.

## 12. Phasing (so it ships, not lingers)
- **Phase 1 — Check-in survey (MVP).** `/check-in` page + config + `/api/checkin` + `/api/mint-token`
  + `checkin_responses` table + Klaviyo event. This alone powers Flow B segmentation. *Small.*
- **Phase 2 — Before/after + gift.** `/before-after` page + `/api/before-after` + Storage +
  Shopify code + `before_after_submissions`. *Medium (photo + Shopify).*
- **Phase 3 — Reporting.** Views + Metabase board. *Small.*

Each phase is independently shippable and no-op-safe if keys are missing (match `subscribe.ts` ethos).

## 13. Open decisions
1. **Host** — Vercel or Netlify? (Determines `/api` function format.)
2. **Supabase** — reuse an existing org project or new one for this?
3. **Subscription app** (for gift/redemption + first-order exclusion): ReCharge / Skio / Loop / native?
4. **Review platform** for the E7 branch — Trustpilot or Google?
5. **Token mint** — Klaviyo webhook action (preferred) or nightly cron fallback?

## 14. Reuse map (existing code)
- UI: `src/components/ui/{Button,Logo,TrustBar,StarRating}.tsx`
- Symptoms taxonomy: `src/data/symptoms.ts` (`SYMPTOMS`, `SymptomTag`) → Q2 options
- Klaviyo pattern/ethos: `src/lib/subscribe.ts` (config-driven, no-op without keys)
- Routing: add routes in `src/App.tsx` (`/check-in`, `/before-after`)
- New: `src/data/checkin.ts` (question config), `src/pages/CheckInPage.tsx`,
  `src/pages/BeforeAfterPage.tsx`, `src/lib/checkinApi.ts`, `/api/*` functions
