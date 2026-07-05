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

## Before / around launch — recommended
- **Meta Pixel + UTM/`fbclid` passthrough** — add the Pixel and pass click IDs through
  to the Shopify CTA so ad conversions attribute. (Not built yet.)
- **Email capture** — the optional "email me the plan" field is UI-only; wire it to
  Klaviyo/Shopify. (See TODO in `src/components/quiz/Result.tsx`.)
- **Guarantee wording** — the result promises a 90-day money-back guarantee; confirm it
  matches your actual returns policy.
- **Omega PDP handle** — `src/data/products.ts` still has a placeholder for Omega (unused
  in the UI today).
- **Analytics** — consider GA4 or the host's analytics for funnel drop-off.

## Local dev
```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # type-check + production build → dist/
```
