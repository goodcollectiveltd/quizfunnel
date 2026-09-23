/* GFP Buy Box — tier/size/subscription state + per-day pricing.
 *
 * Dose model mirrors the quiz funnel (GFP-Quiz-Funnel src/lib/commerce.ts):
 * a tub is `capsPerTub` capsules, daily dose scales with dog size, so how
 * long a purchase lasts — and therefore per-day price and the matching
 * selling-plan cadence — depends on size × quantity.
 */
(function () {
  'use strict';

  function initBuyBox(root) {
    var dataEl = root.querySelector('[data-gfp-bb-data]');
    if (!dataEl) return;
    var data;
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }

    var form = root.querySelector('[data-gfp-bb-form]');
    var variantInput = root.querySelector('[data-gfp-bb-variant-input]');
    var planInput = root.querySelector('[data-gfp-bb-plan-input]');
    var modeInput = root.querySelector('[data-gfp-bb-mode-input]');
    var tierEls = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-tier]'));
    var tierInputs = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-tier-input]'));
    var sizeInputs = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-size]'));
    var modeBtns = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-mode]'));
    var deliveryEl = root.querySelector('[data-gfp-bb-delivery]');
    var ctaPriceEl = root.querySelector('[data-gfp-bb-cta-price]');

    var hasSubscription = data.plans.length > 0 && data.tiers.some(function (t) { return t.subFirstPrice != null; });

    /* Parse "Deliver every 30 days" / "every 6 weeks" / "every 2 months" → days. */
    var plans = data.plans
      .map(function (p) {
        var m = /(\d+)\s*(day|week|month)/i.exec(p.name);
        if (!m) return null;
        var n = parseInt(m[1], 10);
        var unit = m[2].toLowerCase();
        var days = unit === 'week' ? n * 7 : unit === 'month' ? n * 30 : n;
        return { id: p.id, days: days };
      })
      .filter(Boolean)
      .sort(function (a, b) { return a.days - b.days; });

    /* ── Price display mode (per-day trial) ─────────────────────
     * Priority: URL param → A/B cookie split → block setting. */
    var priceDisplay = root.dataset.priceDisplay || 'per_day';
    var urlMode = new URLSearchParams(window.location.search).get('gfp_price');
    if (urlMode === 'day') priceDisplay = 'per_day';
    if (urlMode === 'total') priceDisplay = 'total';
    if (!urlMode && root.dataset.abSplit === 'true') {
      var m2 = document.cookie.match(/(?:^|;\s*)gfp_price_mode=(per_day|total)/);
      var mode = m2 ? m2[1] : Math.random() < 0.5 ? 'per_day' : 'total';
      if (!m2) document.cookie = 'gfp_price_mode=' + mode + ';path=/;max-age=' + 60 * 60 * 24 * 30;
      priceDisplay = mode;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'gfp_buybox_price_mode', gfp_price_mode: mode });
    }
    if (modeInput) modeInput.value = priceDisplay;

    /* ── State ─────────────────────────────────────────────────── */
    var state = {
      size: root.dataset.defaultSize || 'medium',
      subscribe: hasSubscription && root.dataset.defaultSubscribe !== 'false',
      variantId: null,
    };
    if (!data.capsPerDay[state.size]) state.size = 'medium';

    var checkedSize = sizeInputs.filter(function (i) { return i.checked; })[0];
    if (checkedSize) state.size = checkedSize.value;

    var defaultQty = parseInt(root.dataset.defaultQty || '2', 10);
    var defaultTier =
      data.tiers.filter(function (t) { return t.qty === defaultQty && t.available; })[0] ||
      data.tiers.filter(function (t) { return t.available; })[0] ||
      data.tiers[0];
    state.variantId = defaultTier.variantId;

    /* ── Maths (ports of refillDays / sellingPlanFor / pricePerDay) ── */
    function supplyDays(qty) {
      return Math.round((data.capsPerTub * qty) / data.capsPerDay[state.size]);
    }

    /* Closest plan cadence ≤ supply days — ship a touch early, never late. */
    function planFor(qty) {
      if (!plans.length) return null;
      var days = supplyDays(qty);
      var fit = null;
      for (var i = 0; i < plans.length; i++) {
        if (plans[i].days <= days) fit = plans[i];
      }
      return fit || plans[0];
    }

    function money(cents) {
      var v = cents / 100;
      return data.currencySymbol + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
    }

    function perDay(cents, qty) {
      return data.currencySymbol + (cents / 100 / supplyDays(qty)).toFixed(2);
    }

    function cadenceLabel(days) {
      /* In days, to correlate with the "X-day supply" shown on the tiers. */
      return 'every ' + days + ' days';
    }

    function tierByVariant(id) {
      return data.tiers.filter(function (t) { return t.variantId === id; })[0];
    }

    /* ── Render ───────────────────────────────────────────────── */
    function render() {
      var subPct = null; // first-order % off, derived live from prices

      tierEls.forEach(function (el) {
        var input = el.querySelector('[data-gfp-bb-tier-input]');
        var tier = tierByVariant(parseInt(input.value, 10));
        if (!tier) return;

        var subscribing = state.subscribe && tier.subFirstPrice != null;
        var price = subscribing ? tier.subFirstPrice : tier.oncePrice;
        var fullPrice = data.singlePrice * tier.qty;

        var priceEl = el.querySelector('[data-gfp-bb-price]');
        var compareEl = el.querySelector('[data-gfp-bb-compare]');
        var noteEl = el.querySelector('[data-gfp-bb-price-note]');
        var supplyEl = el.querySelector('[data-gfp-bb-supply]');
        var badgeEl = el.querySelector('[data-gfp-bb-badge]');

        /* Total-led (premium pattern): bold total + strikethrough + per-day secondary. */
        priceEl.textContent = money(price);
        if (compareEl) {
          if (subscribing) {
            compareEl.textContent = money(tier.oncePrice);
          } else {
            compareEl.textContent = fullPrice > tier.oncePrice ? money(fullPrice) : '';
          }
        }
        noteEl.textContent = perDay(price, tier.qty) + '/day';

        supplyEl.textContent = supplyDays(tier.qty) + '-day supply';

        /* Badge: full saving vs buying single tubs at RRP — reflects subscribe vs
           one-time, shown on every tier (was: volume-only, and only 2/3 tubs). */
        var effPrice = subscribing ? tier.subFirstPrice : tier.oncePrice;
        /* Round to the nearest 5% for clean badge numbers (30 / 40 / 45). */
        var savePct = Math.round((1 - effPrice / fullPrice) * 100 / 5) * 5;
        var badge = savePct > 0 ? 'Save ' + savePct + '%' : '';
        badgeEl.textContent = badge;
        badgeEl.hidden = !badge;

        if (subscribing && subPct === null) {
          subPct = Math.round((1 - tier.subFirstPrice / tier.oncePrice) * 100);
        }

        input.checked = tier.variantId === state.variantId;
        el.classList.toggle('is-selected', input.checked);
      });

      /* Toggle state (the savings sub-hint is static copy from the block setting) */
      modeBtns.forEach(function (btn) {
        btn.setAttribute('aria-selected', String((btn.dataset.gfpBbMode === 'subscribe') === state.subscribe));
      });
      /* Delivery line + form inputs + CTA */
      var current = tierByVariant(state.variantId);
      var subscribing = state.subscribe && current.subFirstPrice != null;
      variantInput.value = current.variantId;

      if (subscribing) {
        var plan = planFor(current.qty);
        planInput.disabled = !plan;
        planInput.value = plan ? plan.id : '';
        if (deliveryEl && plan) {
          deliveryEl.textContent = 'Delivered ' + cadenceLabel(plan.days) + ' · pause, skip or cancel anytime';
          deliveryEl.hidden = false;
        }
      } else {
        planInput.disabled = true;
        planInput.value = '';
        if (deliveryEl) deliveryEl.hidden = true;
      }

      if (ctaPriceEl) {
        ctaPriceEl.textContent = money(subscribing ? current.subFirstPrice : current.oncePrice);
      }
    }

    /* ── Info tabs (Description / Ingredients / Directions) ────── */
    var tabBtns = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-tab]'));
    var tabPanels = Array.prototype.slice.call(root.querySelectorAll('[data-gfp-bb-panel]'));
    if (tabBtns.length) {
      var selectTab = function (key) {
        tabBtns.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.gfpBbTab === key)); });
        tabPanels.forEach(function (p) { p.hidden = p.dataset.gfpBbPanel !== key; });
      };
      tabBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { selectTab(btn.dataset.gfpBbTab); });
      });
      selectTab(tabBtns[0].dataset.gfpBbTab);
    }

    /* ── Events ───────────────────────────────────────────────── */
    sizeInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        state.size = input.value;
        render();
      });
    });

    tierInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        state.variantId = parseInt(input.value, 10);
        render();
      });
    });

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.subscribe = btn.dataset.gfpBbMode === 'subscribe';
        render();
      });
    });

    render();
  }

  function initAll() {
    document.querySelectorAll('[data-gfp-buybox]').forEach(initBuyBox);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  /* Theme editor re-renders sections dynamically. */
  document.addEventListener('shopify:section:load', initAll);
})();
