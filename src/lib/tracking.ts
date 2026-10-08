/**
 * Analytics & attribution passthrough.
 *
 * HARD RULE: the quiz NEVER loads or fires the store's Meta pixel (3813384208943708), and never
 * sends Meta events browser-side or server-side (no CAPI). Lander/quiz events on the store's pixel
 * polluted the account. Meta attribution still works: fbclid + UTMs ride the outbound URL to
 * goodforpets.co, where the store's own pixel records the real funnel.
 *
 * GA4 stays purely env-driven (safe no-op unless VITE_GA4_ID is set). PostHog loads from index.html.
 *   VITE_GA4_ID         GA4 Measurement ID (G-XXXXXXX)
 */

const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined) || undefined;

const ATTR_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "ad_id", "campaign_id",
  // Entry-symptom targeting: a symptom-led ad links ?symptom=<id> and the funnel
  // continues that ad's thought (headline, checklist order, proof). Persisted so
  // it survives the session and rides through to Klaviyo + the capture DB.
  "symptom",
];
const STORAGE_KEY = "gfp_attr";

type PostHog = {
  capture: (event: string, props?: Record<string, unknown>) => void;
  register: (props: Record<string, unknown>) => void;
};
type AnyWin = typeof window & { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[]; posthog?: PostHog };

export function initTracking() {
  captureAttribution();
  registerPostHogAttribution();
  initGA4();
}

/**
 * Attach captured ad attribution (utm_*, fbclid, ad_id…) to PostHog as super
 * properties, so every PostHog event — pageviews, autocapture, quiz steps — is
 * tagged with the campaign it came from. PostHog itself is loaded from index.html.
 */
function registerPostHogAttribution() {
  const attr = getAttribution();
  if (Object.keys(attr).length) (window as AnyWin).posthog?.register(attr);
}

/** Persist ad-click / UTM params for the session so we can forward them to Shopify. */
function captureAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const saved = getAttribution();
    let changed = false;
    for (const k of ATTR_KEYS) {
      const v = params.get(k);
      if (v) { saved[k] = v; changed = true; }
    }
    if (changed) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch { /* ignore */ }
}

export function getAttribution(): Record<string, string> {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

/** Append captured attribution (UTMs, fbclid, ad ids) to an outbound Shopify URL. Use on every PDP link. */
export function withAttribution(url: string): string {
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(getAttribution())) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch { return url; }
}

function initGA4() {
  if (!GA4_ID) return;
  const w = window as AnyWin;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer!.push(arguments); };
  w.gtag("js", new Date());
  w.gtag("config", GA4_ID);
}

/** Fire an event to GA4 + PostHog (whichever are configured). Never to Meta: see the hard rule at the top. */
export function track(event: string, params: Record<string, unknown> = {}) {
  const w = window as AnyWin;
  if (GA4_ID && w.gtag) w.gtag("event", event, params);
  // PostHog runs in every environment (loaded in index.html), so quiz analytics
  // and heatmaps work in dev too, not just prod like the Meta pixel.
  w.posthog?.capture(event, params);
}
