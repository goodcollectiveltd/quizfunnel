/**
 * Analytics, Meta Pixel & attribution passthrough. Everything here is OPTIONAL and
 * driven by env vars — with none set, all functions are safe no-ops. Set these in the
 * host (Vercel/Netlify) and rebuild to activate. See .env.example.
 *
 *   VITE_META_PIXEL_ID  — Meta (Facebook) Pixel ID
 *   VITE_GA4_ID         — GA4 Measurement ID (G-XXXXXXX)
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;

const ATTR_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "fbclid", "gclid", "ttclid", "ad_id", "campaign_id",
];
const STORAGE_KEY = "gfp_attr";

type AnyWin = typeof window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };

export function initTracking() {
  captureAttribution();
  initMetaPixel();
  initGA4();
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

function getCookie(name: string): string {
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return m ? decodeURIComponent(m.pop() as string) : "";
}

/**
 * Append captured attribution + Meta browser cookies (_fbp/_fbc) to an outbound
 * Shopify URL so conversions attribute back to the ad. Use on every PDP link.
 */
export function withAttribution(url: string): string {
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(getAttribution())) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    const fbp = getCookie("_fbp"); if (fbp) u.searchParams.set("fbp", fbp);
    const fbc = getCookie("_fbc"); if (fbc) u.searchParams.set("fbc", fbc);
    return u.toString();
  } catch { return url; }
}

function initMetaPixel() {
  if (!PIXEL_ID) return;
  const w = window as AnyWin;
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(w, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  w.fbq!("init", PIXEL_ID);
  w.fbq!("track", "PageView");
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

const META_STANDARD = new Set(["Lead", "InitiateCheckout", "CompleteRegistration", "ViewContent", "Purchase"]);

/** Fire an event to Meta Pixel + GA4 (whichever are configured). */
export function track(event: string, params: Record<string, unknown> = {}) {
  const w = window as AnyWin;
  if (PIXEL_ID && w.fbq) {
    if (META_STANDARD.has(event)) w.fbq("track", event, params);
    else w.fbq("trackCustom", event, params);
  }
  if (GA4_ID && w.gtag) w.gtag("event", event, params);
}
