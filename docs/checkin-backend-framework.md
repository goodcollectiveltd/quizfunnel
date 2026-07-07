# Check-In Backend Framework & Isolation Plan

Backend for the post-purchase check-in + before/after flow. Runs **on the quiz subdomain** but is
**fully isolated** from the live quiz funnel — separate repo, deploy, functions, schema, and env.
Nothing here can break the funnel; the funnel can't break this.

> Companion to `post-purchase-checkin-build-plan.md` (product/survey spec). This doc = backend + isolation.

---

## 0. Non-conflict guarantee (the whole point)
The quiz funnel is live revenue. This build must be incapable of destabilising it. We guarantee that by
**physical separation at every layer**, not just tidy code:

| Layer | Quiz funnel | Check-in | Shared? |
|---|---|---|---|
| Repo | `gfp-quiz-funnel` | **`gfp-checkin`** (new repo, per the one-repo-per-project rule) | ❌ |
| Deploy/project | its Vercel/Netlify project | **its own** project + pipeline | ❌ |
| Build | `npm run build` (quiz) | separate build; a check-in TS error can't fail the funnel build | ❌ |
| URL | `quiz.goodforpets.co/*` | `quiz.goodforpets.co/check-in/*` via **host rewrite** | subdomain only |
| Serverless fns | quiz's (if any) | **`/api/checkin/*`** namespace, own project | ❌ |
| Database | (quiz has none today) | Supabase **`checkin` schema** (or own project) | ❌ |
| Env vars | `VITE_*` | **`CHECKIN_*`** server-only namespace | ❌ |
| State | — | never reads/writes quiz data | ❌ |

Reuse is **by copy, not by coupling**: copy the 4 UI primitives (Button, Logo, TrustBar, StarRating)
+ Tailwind config + the `SYMPTOMS` list into `gfp-checkin`. Tiny duplication, zero shared build graph.

## 1. Topology — living on the quiz subdomain without touching it
Keep the URL on the quiz subdomain but serve it from the separate `gfp-checkin` deploy via a **path
rewrite** at the host. The funnel project owns the domain; it forwards one path prefix out.

**Vercel** (in the *quiz funnel* project's `vercel.json`):
```json
{ "rewrites": [
  { "source": "/check-in/:path*",      "destination": "https://gfp-checkin.vercel.app/check-in/:path*" },
  { "source": "/before-after/:path*",  "destination": "https://gfp-checkin.vercel.app/before-after/:path*" },
  { "source": "/api/checkin/:path*",   "destination": "https://gfp-checkin.vercel.app/api/checkin/:path*" }
] }
```
This is the *only* line that ever changes in the funnel repo — a single, reversible rewrite. Everything
else lives in `gfp-checkin`. (Netlify: equivalent `redirects` with `200` status / proxy.)

> Alternative if you'd rather not touch the funnel at all: a sibling subdomain
> `check-in.goodforpets.co` pointed straight at `gfp-checkin`. Zero funnel changes. Pick this if
> "utilising the quiz subdomain" can mean a sibling; use the rewrite if it must be the same host.

```
Klaviyo email
  → quiz.goodforpets.co/check-in?t=<token>
      → (host rewrite) → gfp-checkin deploy
          ├─ static React page (own bundle)
          └─ /api/checkin/*  (own serverless fns)
                 ├─ Supabase (checkin schema + private storage)
                 ├─ Klaviyo  (server events + profile lookup)
                 └─ Shopify Admin (gift codes)
```

## 2. Stack
- **Runtime:** serverless functions (Vercel/Netlify, Node 20 + TypeScript).
- **DB:** Supabase Postgres — dedicated `checkin` schema (or a separate Supabase project for hard isolation).
- **Storage:** Supabase Storage, **private** bucket `checkin-photos`.
- **Integrations:** Klaviyo (Server API), Shopify Admin API.
- **Frontend:** Vite + React + Tailwind (copied primitives), served from the same deploy.

## 3. API surface (`/api/checkin/*`)
All functions: verify token → act → structured JSON. CORS locked to the quiz subdomain. Rate-limited.

| Fn | Method | Caller | Purpose |
|---|---|---|---|
| `token`        | POST | Klaviyo webhook | Mint a signed token for a profile at flow entry; Klaviyo stores it as `checkin_token`. |
| `session`      | GET  | page load | Verify token → return prefill (dogName, breed, weight, symptoms) + draft state. **No email to client.** |
| `answer`       | POST | page (autosave) | Upsert one section's answers (keyed on profile). Persist only; no event. |
| `complete`     | POST | page (final) | Set `completed_at`; fire Klaviyo `Completed Check-in` (idempotent). |
| `before-after` | POST | before/after page | Upload photos → mint Shopify gift code → insert row → Klaviyo `Submitted Before/After`. |
| `gift-redeemed`| POST | Shopify/Klaviyo webhook | Mark `gift_code_redeemed`. |
| `health`       | GET  | monitoring | Liveness + dependency ping. |

### Contracts (essentials)
```
POST /api/checkin/token        { pid }                → { token }            // signed, exp 45d (survey) / 120d (b/a)
GET  /api/checkin/session?t=…                          → { dogName, prefill, sections, savedAnswers }
POST /api/checkin/answer       { t, section, patch }   → { ok, saved }       // upsert, per-section
POST /api/checkin/complete     { t }                   → { ok }              // fires event once (guard flag)
POST /api/checkin/before-after (multipart){ t, before, after, giftProduct, note, consent }
                                                       → { giftCode }
```

## 4. Token / auth model (no PII in URLs)
- Stateless HMAC: `token = base64url({ pid, scope, exp }) + "." + HMAC_SHA256(payload, CHECKIN_TOKEN_SECRET)`.
- `scope` ∈ {`survey`,`before_after`} so a survey link can't drive the gift endpoint.
- Verify util rejects bad signature / expired / wrong scope. **Email + dog name are fetched from
  Klaviyo by `pid` server-side** — never placed in the URL or returned to the client.
- Minting: Klaviyo flow **webhook action** → `POST /api/checkin/token` → writes `checkin_token` back to
  the profile. Fallback: nightly cron stamps tokens on profiles that entered the flow.
- Rate-limit `token`, `answer`, `before-after`, `session` per IP + per pid.

## 5. Data layer (`checkin` schema)
- Tables `checkin_responses` + `before_after_submissions` (see build-plan §6 for columns).
- Live in schema `checkin`, **not** `public`; no foreign keys into any quiz/Shopify table.
- **RLS on, no anon policy** — reachable only via the service key inside functions. The browser never
  talks to Supabase directly.
- Indexes: unique `klaviyo_profile_id` (upsert key) on responses; `gift_code` on submissions.
- Storage bucket `checkin-photos` private; team views via short-lived signed URLs.

## 6. Integration contracts
- **Klaviyo** (server key, private):
  - Profile lookup: `GET /api/profiles/{pid}` → email, `dog_name`, `breed`, `weight`, symptom props.
  - Events: `Completed Check-in` (props: satisfaction, improved_symptoms, nps, consent, testimonial_text,
    trust_reason, choice_reason, top_features, …) and `Submitted Before/After` (props: gift_code, giftProduct).
  - Also mirror key fields to profile properties so Flow B filters/segments can read them directly.
  - **Idempotency:** send a unique `$event_id` (= pid+scope) so retries don't double-count.
- **Shopify Admin** (private token): create a **single-use** discount (100% off one item from the
  "Gift-Eligible" collection, cap £32.99, usage_limit 1, 30-day expiry). Store `gift_code`.
- **Redemption:** Shopify/Klaviyo `Placed Order` w/ that code → `gift-redeemed` webhook → set flag;
  unredeemed after 14d → Klaviyo reminder.

## 7. Env (server-only, `CHECKIN_*` namespace — never `VITE_`)
```
CHECKIN_TOKEN_SECRET=
CHECKIN_KLAVIYO_PRIVATE_KEY=
CHECKIN_SUPABASE_URL=
CHECKIN_SUPABASE_SERVICE_KEY=
CHECKIN_SHOPIFY_ADMIN_TOKEN=
CHECKIN_SHOPIFY_STORE_DOMAIN=
CHECKIN_ALLOWED_ORIGIN=https://quiz.goodforpets.co
```
Distinct names guarantee no accidental collision with the funnel's `VITE_KLAVIYO_*`.

## 8. Security & privacy
- Secrets server-side only; browser never sees Klaviyo/Shopify/Supabase keys.
- Opaque signed token; no email/PII in URLs (matches our data policy).
- Private photo bucket + signed URLs; consent recorded and **enforced** before any public/UGC use.
- CORS pinned to `CHECKIN_ALLOWED_ORIGIN`; reject others.
- Input validation + file checks (jpg/png/heic, ≤10MB, magic-byte sniff, strip EXIF GPS).
- Rate limiting + basic bot guard on public POSTs.
- GDPR: `DELETE` path by pid/email purges responses + photos.

## 9. Resilience & no-op safety (match `subscribe.ts` ethos)
- **DB write is the source of truth; integrations are best-effort.** If Klaviyo/Shopify is down, the
  answer/before-after is still saved; the event/gift is queued + retried (small outbox table or
  Klaviyo retry). The user never sees a failure for a downstream hiccup.
- Missing keys → functions degrade to "save-only" no-ops (dev + staged rollout still work).
- `complete` and gift issuance are **idempotent** (guard flags) so refresh/retry can't double-fire.

## 10. Observability
- Structured logs per function (pid, scope, outcome — no PII bodies).
- Error alerting (host's built-in or Sentry) scoped to the `gfp-checkin` project only.
- `health` endpoint pings Supabase + Klaviyo; use for uptime checks.

## 11. Deployment & CI isolation
- `gfp-checkin` has its own repo, pipeline, preview deploys, and env. The funnel's CI never runs it.
- Rollback is independent — redeploy/rollback check-in without redeploying the funnel.
- The **only** funnel-side change is the one rewrite block (§1), added once, easily reverted.
- Preview/staging: test the whole flow on `gfp-checkin`'s preview URL before flipping the rewrite live.

## 12. Build sequence
1. Scaffold `gfp-checkin` (Vite+React+TS+Tailwind); copy the 4 UI primitives + `SYMPTOMS`.
2. Supabase: `checkin` schema, tables, RLS, private bucket.
3. Functions: `token`, `session`, `answer`, `complete` + token/verify util + Klaviyo client.
4. Check-in page (`src/data/checkin.ts` config + `CheckInPage`), autosave wired to `answer`/`complete`.
5. Wire Klaviyo webhook → `token`; add profile prop `checkin_token`; test end-to-end on preview.
6. Add the funnel-side rewrite (§1); go live on `/check-in`.
7. Phase 2: before/after page + `before-after`/`gift-redeemed` fns + storage + Shopify code.
8. Phase 3: reporting views + Metabase.

## 13. Non-conflict checklist (dev verifies before go-live)
- [ ] Separate repo + separate deploy project.
- [ ] Funnel repo changed by **one** rewrite block only.
- [ ] No shared build / no shared `package.json`.
- [ ] `checkin` schema only; zero reads/writes to quiz or Shopify app tables.
- [ ] `CHECKIN_*` env namespace; no reuse of funnel keys.
- [ ] CORS pinned to the subdomain; Supabase RLS blocks anon.
- [ ] `/check-in`, `/before-after`, `/api/checkin/*` are the only paths claimed.
- [ ] Rewrite tested on preview; funnel routes (`/`, quiz) unaffected.
- [ ] Independent rollback verified.

## 14. Open decisions (blocks build)
1. Host: **Vercel or Netlify?** (rewrite/function syntax).
2. Supabase: dedicated **schema** in an existing project, or a **separate project** (hardest isolation)?
3. URL: same-host **path rewrite**, or **sibling subdomain** `check-in.goodforpets.co`?
4. Subscription app (gift/redemption + first-order exclusion): ReCharge / Skio / Loop / native?
5. Review platform for E7: Trustpilot or Google?
