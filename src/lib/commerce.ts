/**
 * Shopify direct-to-cart checkout (Loop Subscriptions), per hero product.
 *
 * The result page can lead with the 5 Strain Probiotic+ (gut-led cases) or the
 * Skin & Gut Duo (skin cases). Each hero has its own quantity tiers (separate
 * bundle SKUs), Subscribe & Save plans and prices — so the buy box is product-aware.
 *
 * The CTA builds a Shopify cart permalink (`/cart/{variantId}:1?selling_plan=…`)
 * that adds the chosen tier straight to the basket, skipping the product page.
 * All ids/prices below are from the goodforpets.co storefront (30% off first order,
 * 20% off recurring, free shipping for life on subscription).
 */

import { type ProductKey } from "@/data/products";
import type { DogSize } from "@/lib/recommend";
import { getAttribution } from "@/lib/tracking";
import { getQuizId } from "@/lib/submissions";

// Cart actions must hit the store's CANONICAL domain (apex). www.goodforpets.co
// 301-redirects to it, and that redirect drops the freshly-set cart cookie — so
// posting to www would land the buyer on an empty cart. Post to the apex directly.
const CART_ORIGIN = "https://goodforpets.co";

/* ── Frequency model — a tub/pack is 90 probiotic capsules; daily use scales with
 * size, so the delivery interval is sized to how long the purchase lasts. Rounded
 * to the TOP of each dose band so it ships a touch early rather than running out. */
export const TUB_CAPSULES = 90;
export const CAPS_PER_DAY: Record<DogSize, number> = { toy: 1, small: 1, medium: 2, large: 3 };

export interface PriceTier {
  qty: number; // tubs / packs in this tier
  label: string; // "1 Tub" / "2 Packs"
  subPrice: string; // first-order subscription price (30% off)
  oncePrice: string; // one-time price
  compareAt?: string; // RRP strikethrough (multi only)
  badge?: string; // "Most Popular · Save 15%"
  variantId: string; // each tier is its own bundle SKU → cart quantity is always 1
}

export interface HeroCommerce {
  key: ProductKey;
  unitLabel: string; // "Tub" | "Pack"
  tiers: PriceTier[];
  sellingPlansByDays: Record<number, string>; // Loop plan id per delivery interval
  fallbackPlanId: string; // used when size is unknown
}

/** 5 Strain Probiotic+ (SKU CF99045 family). */
const PROBIO: HeroCommerce = {
  key: "probioPlus",
  unitLabel: "Tub",
  tiers: [
    { qty: 1, label: "1 Tub", subPrice: "£31.49", oncePrice: "£44.99", variantId: "57197308674392" },
    { qty: 2, label: "2 Tubs", subPrice: "£53.54", oncePrice: "£76.49", compareAt: "£90.00", badge: "Most Popular · Save 15%", variantId: "57197308707160" },
    { qty: 3, label: "3 Tubs", subPrice: "£75.58", oncePrice: "£107.97", compareAt: "£135.00", badge: "Best Value · Save 20%", variantId: "57197308739928" },
  ],
  sellingPlansByDays: { 30: "693194850648", 45: "693194883416", 60: "693194916184", 90: "693194785112" },
  fallbackPlanId: "693194785112", // 90-day (Loop default)
};

/** Skin & Gut Duo — 5 Strain Probiotic+ + Omega 3-6-9 (SKU SG1/2/3). */
const DUO: HeroCommerce = {
  key: "skinGutDuo",
  unitLabel: "Pack",
  tiers: [
    { qty: 1, label: "1 Pack", subPrice: "£45.49", oncePrice: "£64.99", variantId: "57127134593368" },
    { qty: 2, label: "2 Packs", subPrice: "£77.34", oncePrice: "£110.48", compareAt: "£129.98", badge: "Most Popular · Save 15%", variantId: "57127134626136" },
    { qty: 3, label: "3 Packs", subPrice: "£109.18", oncePrice: "£155.97", compareAt: "£194.97", badge: "Best Value · Save 20%", variantId: "57127134658904" },
  ],
  sellingPlansByDays: { 30: "691305709912", 40: "691311903064", 60: "691308495192", 90: "693139767640", 120: "691311935832", 180: "693139800408", 240: "692923171160" },
  fallbackPlanId: "693139767640", // 90-day
};

const HERO_COMMERCE: Partial<Record<ProductKey, HeroCommerce>> = {
  probioPlus: PROBIO,
  skinGutDuo: DUO,
};

/** Commerce config for a hero product, or null if it isn't sold via the buy box. */
export function heroCommerceFor(key: ProductKey): HeroCommerce | null {
  return HERO_COMMERCE[key] ?? null;
}

export const CHECKOUT = {
  /** Optional quiz-completer code, auto-applied at the cart. "" = none. */
  discountCode: "" as string,
  subscription: {
    firstOrderOff: 30, // % off the first order
    futureOff: 20, // % off future orders
    freeShipping: true, // lifetime free shipping on subscription
  },
  /** Which tier is selected by default (0 = single). */
  defaultTierIndex: 0,
  /** Subscribe selected by default (primary model). */
  defaultSubscribe: true,
};

/** How many days a purchase of `qty` tubs/packs lasts for a dog of `size`. */
export function refillDays(size: DogSize, qty: number): number {
  return Math.round((TUB_CAPSULES * qty) / CAPS_PER_DAY[size]);
}

/** Closest configured plan to `days` — prefers a cadence ≤ days (ship early, not late). */
function planForDays(hc: HeroCommerce, days: number): { id: string; days: number } | null {
  const avail = Object.entries(hc.sellingPlansByDays)
    .filter(([, id]) => id)
    .map(([d, id]) => ({ days: Number(d), id }));
  if (avail.length === 0) return null;
  const notOver = avail.filter((p) => p.days <= days).sort((a, b) => b.days - a.days);
  return notOver[0] ?? avail.sort((a, b) => a.days - b.days)[0];
}

/** Selling-plan id to apply for a dog size × quantity (size-matched, with fallback). */
export function sellingPlanFor(hc: HeroCommerce, size: DogSize | null, qty: number): string {
  if (size) {
    const p = planForDays(hc, refillDays(size, qty));
    if (p) return p.id;
  }
  return hc.fallbackPlanId;
}

/**
 * Human delivery cadence, e.g. "every 3 months". We show the TRUE run-rate (how long
 * the tubs actually last for this dog/quantity), not the nearest Loop cadence — if Loop
 * ships a touch sooner that's just safe overlap, and the number always matches the maths.
 */
export function deliveryLabel(size: DogSize | null, qty: number): string | null {
  if (!size) return null;
  const days = refillDays(size, qty);
  if (days <= 35) return "every month";
  if (days <= 49) return "every 6 weeks";
  return `every ${Math.round(days / 30)} months`;
}

/** Per-day cost for display: total price ÷ days the order lasts. Returns e.g. "£0.35". */
export function pricePerDay(priceStr: string, size: DogSize | null, tubs: number): string | null {
  if (!size) return null;
  const amount = Number((priceStr || "").replace(/[^0-9.]/g, ""));
  const days = refillDays(size, tubs);
  if (!isFinite(amount) || amount <= 0 || days <= 0) return null;
  return "£" + (amount / days).toFixed(2);
}

export interface CartAdd {
  variantId: string;
  quantity: number;
  sellingPlanId?: string; // present when subscribing
  returnTo: string; // relative path to land on after the add (with discount/attribution)
}

/**
 * Work out the /cart/add payload for a hero tier. Returns null → caller falls back
 * to the PDP. NOTE: we use a form POST to /cart/add (not a `/cart/{id}:{q}` permalink)
 * because Shopify silently DROPS `selling_plan` on cart permalinks — the subscription
 * (and its discount) never attaches. The add endpoint honours it.
 */
export function tierCartAdd(hc: HeroCommerce, tier: PriceTier, subscribe: boolean, size: DogSize | null): CartAdd | null {
  if (!tier.variantId) return null;
  const sellingPlanId = subscribe ? sellingPlanFor(hc, size, tier.qty) : undefined;
  const params = new URLSearchParams();
  if (CHECKOUT.discountCode) params.set("discount", CHECKOUT.discountCode);
  for (const [k, v] of Object.entries(getAttribution())) params.set(k, v);
  const qs = params.toString();
  return { variantId: tier.variantId, quantity: 1, sellingPlanId, returnTo: qs ? `/cart?${qs}` : "/cart" };
}

/**
 * Add the item to the Shopify cart via a first-party form POST on the store domain,
 * so the selling plan (subscription + discount) actually attaches, then redirect to
 * the cart. A cross-domain form submission is a plain navigation — no CORS issues.
 */
export function submitCartAdd(add: CartAdd, opts: { target?: string } = {}): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${CART_ORIGIN}/cart/add`;
  form.acceptCharset = "UTF-8";
  if (opts.target) form.target = opts.target;
  const field = (name: string, value: string) => {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = name;
    i.value = value;
    form.appendChild(i);
  };
  field("id", add.variantId);
  field("quantity", String(add.quantity));
  if (add.sellingPlanId) field("selling_plan", add.sellingPlanId);
  // Hidden line-item property (underscore = not shown to the customer) so the
  // resulting Shopify order can be stitched back to the quiz submission.
  const quizId = getQuizId();
  if (quizId) field("properties[_quiz_id]", quizId);
  field("return_to", add.returnTo);
  document.body.appendChild(form);
  form.submit();
  window.setTimeout(() => form.remove(), 1000);
}

/** True once every tier has a variant id — i.e. direct checkout is live for this hero. */
export function heroCheckoutReady(hc: HeroCommerce | null): boolean {
  return !!hc && hc.tiers.length > 0 && hc.tiers.every((t) => !!t.variantId);
}
