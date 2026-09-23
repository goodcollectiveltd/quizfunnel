// The live PDP buy box, verbatim (GFP-Theme snippets/product-block-gfp-buy-box.liquid),
// with the real data pulled from the live 5 Strain Probiotic+ product page. The theme's
// own script /bb/gfp-buy-box.js fills prices, supply-days, badges, the selling plan and
// the CTA price from the embedded data-gfp-bb-data JSON; /bb/gfp-buy-box.css styles it.
// Injected into the result page so the quiz's buy box IS the PDP's, same size cards
// (dog silhouettes), tiers, Subscribe & Save toggle, tabs. The result page pre-selects
// the size the owner gave in the quiz and intercepts the form submit to add to the
// Shopify cart with the selling plan, attribution and the hidden _quiz_id property.

const DATA = `{"capsPerTub":90,"capsPerDay":{"toy":1,"small":1,"medium":2,"large":3},"currencySymbol":"£","singlePrice":4499,"tiers":[{"variantId":57197308674392,"title":"1 Tub","qty":1,"oncePrice":4499,"available":true,"subFirstPrice":3149,"subRecurringPrice":3599},{"variantId":57197308707160,"title":"2 Tubs","qty":2,"oncePrice":7649,"available":true,"subFirstPrice":5354,"subRecurringPrice":6119},{"variantId":57197308739928,"title":"3 Tubs","qty":3,"oncePrice":10797,"available":true,"subFirstPrice":7558,"subRecurringPrice":8638}],"plans":[{"id":693194785112,"name":"Deliver every 90 days"},{"id":693194850648,"name":"Deliver every 30 days"},{"id":693194883416,"name":"Deliver every 45 days"},{"id":693194916184,"name":"Deliver every 60 days"},{"id":693275427160,"name":"Deliver every 120 days"},{"id":693275361624,"name":"Deliver every 180 days"},{"id":693275394392,"name":"Deliver every 270 days"}]}`;

const size = (key: string, name: string, hint: string, checked: boolean) => `
  <label class="gfp-bb__size">
    <input type="radio" name="gfp-bb-size" value="${key}" data-gfp-bb-size${checked ? " checked" : ""}>
    <span class="gfp-bb__size-card">
      <span class="gfp-bb__size-icon gfp-bb__size-icon--${key}" style="--gfp-bb-dog: url('/bb/gfp-dog-${key}.png')" aria-hidden="true"></span>
      <span class="gfp-bb__size-name">${name}</span>
      <span class="gfp-bb__size-hint">${hint}</span>
    </span>
  </label>`;

const tier = (variant: string, qty: number, title: string) => `
  <label class="gfp-bb__tier" data-gfp-bb-tier data-qty="${qty}">
    <input type="radio" name="gfp-bb-tier" value="${variant}" data-gfp-bb-tier-input>
    <span class="gfp-bb__tier-card">
      <span class="gfp-bb__tier-badge" data-gfp-bb-badge hidden></span>
      <span class="gfp-bb__tier-main">
        <span class="gfp-bb__tier-title">${title}</span>
        <span class="gfp-bb__tier-supply" data-gfp-bb-supply></span>
      </span>
      <span class="gfp-bb__tier-pricing">
        <span class="gfp-bb__tier-price-row">
          <span class="gfp-bb__tier-compare"><s data-gfp-bb-compare></s></span>
          <span class="gfp-bb__tier-price" data-gfp-bb-price></span>
        </span>
        <span class="gfp-bb__tier-note" data-gfp-bb-price-note></span>
      </span>
    </span>
  </label>`;

export type BuyBoxSize = "small" | "medium" | "large";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface CrewInfo {
  capsPerDay: number; // the whole crew's combined daily capsules
  line: string; // e.g. "Bella (medium) & Max (small) get through 3 capsules a day."
}

/** The buy box markup, personalised: the quiz's dog size pre-selected. Multi-dog
 * homes pass `crew` — the size selector is dropped (each dog already picked
 * theirs) and every capsPerDay is set to the crew's combined dose, so supply
 * days, per-day price and the delivery cadence are all true for the whole crew. */
export function buyBoxHtml(opts: { size: BuyBoxSize; multiDog: boolean; crew?: CrewInfo }): string {
  const sel = (k: BuyBoxSize) => opts.size === k;
  const crew = opts.multiDog ? opts.crew : undefined;
  let data = DATA;
  let defaultQty = 2;
  if (crew && crew.capsPerDay > 0) {
    const d = JSON.parse(DATA);
    const c = crew.capsPerDay;
    d.capsPerDay = { toy: c, small: c, medium: c, large: c };
    data = JSON.stringify(d);
    // Default to the smallest bundle that lasts the crew ~60+ days (capped at 3).
    defaultQty = Math.min(3, Math.max(1, Math.ceil((60 * c) / 90)));
  }
  return `
<div class="gfp-bb" data-gfp-buybox data-default-size="${opts.size}" data-default-qty="${defaultQty}" data-default-subscribe="true">
  <script type="application/json" data-gfp-bb-data>${data}</script>
  ${crew ? "" : `<fieldset class="gfp-bb__sizes">
    <legend class="gfp-bb__label">How big is your dog?</legend>
    <div class="gfp-bb__size-row">
      ${size("small", "Small", "Up to 25kg", sel("small"))}
      ${size("medium", "Medium", "25–40kg", sel("medium"))}
      ${size("large", "Large", "Over 40kg", sel("large"))}
    </div>
  </fieldset>`}
  <form action="/cart/add" method="post" accept-charset="UTF-8" class="gfp-bb__form" data-gfp-bb-form>
    <input type="hidden" name="form_type" value="product">
    <input type="hidden" name="quantity" value="1">
    <input type="hidden" name="id" value="" data-gfp-bb-variant-input>
    <input type="hidden" name="selling_plan" value="" data-gfp-bb-plan-input disabled>
    ${crew ? `<p class="gfp-bb__label">Sized for your crew</p>
    <p class="gfp-bb__size-help">${esc(crew.line)} Supply lengths below cover all of them together.</p>` : ""}
    <div class="gfp-bb__toggle" role="tablist">
      <button type="button" class="gfp-bb__toggle-btn" data-gfp-bb-mode="subscribe" role="tab">Subscribe &amp; Save</button>
      <button type="button" class="gfp-bb__toggle-btn" data-gfp-bb-mode="onetime" role="tab">One-time</button>
    </div>
    <p class="gfp-bb__label gfp-bb__supply-label">Choose your supply</p>
    <div class="gfp-bb__tiers" data-gfp-bb-tiers>
      ${tier("57197308674392", 1, "1 Tub")}
      ${tier("57197308707160", 2, "2 Tubs")}
      ${tier("57197308739928", 3, "3 Tubs")}
    </div>
    <p class="gfp-bb__delivery" data-gfp-bb-delivery hidden></p>
    <button type="submit" class="gfp-bb__cta push-btn w-full">
      <span class="push-btn__surface w-full">
        <span data-gfp-bb-cta-text>Add to Cart</span>
        <span class="gfp-bb__cta-price" data-gfp-bb-cta-price></span>
      </span>
    </button>
    <div class="gfp-bb__guarantee">
      <svg class="gfp-bb__guarantee-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
      <div class="gfp-bb__guarantee-text"><span class="gfp-bb__guarantee-title">90-Day Money-Back Guarantee</span></div>
    </div>
  </form>
  <div class="gfp-bb__tabs" data-gfp-bb-tabs>
    <div class="gfp-bb__tab-list">
      <button type="button" class="gfp-bb__tab" data-gfp-bb-tab="description">Description</button>
      <button type="button" class="gfp-bb__tab" data-gfp-bb-tab="ingredients">Ingredients</button>
      <button type="button" class="gfp-bb__tab" data-gfp-bb-tab="directions">Directions for Use</button>
    </div>
    <div class="gfp-bb__tab-panel rte" data-gfp-bb-panel="description"><p>Itchy skin and paw-licking usually start in the gut. Our cold-filled capsules deliver <strong>5 billion</strong> live cultures to rebalance it — calming skin and settling digestion from the inside out.</p></div>
    <div class="gfp-bb__tab-panel rte" data-gfp-bb-panel="ingredients" hidden><div class="metafield-rich_text_field"><p><strong>Active Ingredients (per capsule):</strong></p><ul><li><strong>L. plantarum</strong> (1bn CFU) — digestion &amp; stool quality</li><li><strong>L. acidophilus</strong> (1bn CFU) — gut barrier &amp; microbiome balance</li><li><strong>L. brevis</strong> (1bn CFU) — immune support</li><li><strong>B. lactis</strong> (1bn CFU) — digestion &amp; gut immunity</li><li><strong>L. rhamnosus</strong> (1bn CFU) — skin &amp; IgE balance</li><li><strong>Prebiotic Inulin</strong> (250mg) — feeds the good bacteria</li><li><strong>Digestive Enzymes</strong> (150mg) — better nutrient absorption</li></ul><p><strong>Inactive:</strong> Natural Flavouring, Magnesium Stearate, Silicon Dioxide.</p></div></div>
    <div class="gfp-bb__tab-panel rte" data-gfp-bb-panel="directions" hidden><div class="metafield-rich_text_field"><p><strong>Daily Feeding Guide</strong> (based on body weight):</p><ul><li><strong>Up to 25kg</strong> — 1 capsule per day</li><li><strong>25–40kg</strong> — 2 capsules per day</li><li><strong>Over 40kg</strong> — 3 capsules per day</li></ul><p>Simply twist open and sprinkle over or mix into food.</p></div></div>
  </div>
</div>`;
}
