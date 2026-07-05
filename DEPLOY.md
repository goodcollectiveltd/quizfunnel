# Deploying the quiz funnel

A static Vite/React SPA — no server, no database. Build → upload the `dist/` folder
to any static host → point a subdomain at it. Checkout stays on Shopify (the CTAs
link to goodforpets.co product pages).

## 1. Push to GitHub (one-time)
```bash
# create an empty repo on github.com first (e.g. GFP-Quiz-Funnel), then:
git remote add origin https://github.com/<you>/GFP-Quiz-Funnel.git
git push -u origin main   # (branch may be "master" — check with: git branch)
```

## 2. Deploy (pick one — all free, all auto-deploy on every push)
Build settings for **all** of them: build command `npm run build`, output dir `dist`.

- **Vercel** — import the GitHub repo at vercel.com/new. `vercel.json` (already in the
  repo) handles SPA routing. Done.
- **Netlify** — "Add new site → Import" at app.netlify.com. `public/_redirects` (already
  in the repo) handles SPA routing.
- **Cloudflare Pages** — similar; set output to `dist`.

## 3. Point the subdomain (e.g. quiz.goodforpets.co)
1. In the host (Vercel/Netlify), add the custom domain `quiz.goodforpets.co`.
2. In your DNS, add the **CNAME** record they give you (e.g. `quiz` → `cname.vercel-dns.com`).
   - ⚠️ **Shopify note:** goodforpets.co likely uses Shopify-managed DNS. Shopify lets you
     add a **CNAME for a subdomain** in Settings → Domains → your domain → DNS settings.
     If it won't let you, move DNS to Cloudflare (free) and add the CNAME there.
3. SSL is issued automatically by the host. Live in a few minutes.

## Tracking, email & analytics — BUILT, just add keys
All of this is wired and driven by env vars (see `.env.example`). With no keys set it's a
safe no-op. Add the keys in your host's **Environment Variables** and redeploy to switch on:

- **Meta Pixel** (`VITE_META_PIXEL_ID`) — fires `PageView`, `quiz_start`, `quiz_completed`,
  `Lead` (result reached), `InitiateCheckout` (PDP click) and `CompleteRegistration` (email).
- **Click-ID passthrough** — automatic. `utm_*`, `fbclid`, `gclid`, `_fbp`/`_fbc` are captured
  and **appended to the Shopify PDP links**, so ad conversions attribute correctly. (No key needed.)
- **GA4** (`VITE_GA4_ID`) — mirrors the same events to Google Analytics.
- **Email capture → Klaviyo** (`VITE_KLAVIYO_PUBLIC_KEY` + `VITE_KLAVIYO_LIST_ID`) — the
  optional "email me the plan" field subscribes finishers to your list.

## Still to confirm (content, not code)
- **Guarantee wording** — the result promises a 90-day money-back guarantee; confirm it
  matches your actual returns policy.
- **Omega PDP handle** — `src/data/products.ts` has a placeholder for Omega (unused in the UI today).

## Local dev
```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # type-check + production build → dist/
```
