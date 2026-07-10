/**
 * Quiz-submission capture: sends the full quiz result to the isolated capture
 * backend so EVERY completion is stored (not just email opt-ins) and can be tied
 * to the customer later via their email and/or their Shopify order.
 *
 * Safe by construction, like tracking.ts / subscribe.ts:
 *  - No-op until VITE_QUIZ_CAPTURE_URL is set (so nothing changes on the live
 *    funnel until the backend is live).
 *  - Fire-and-forget + keepalive: never blocks the UI, never throws into the
 *    funnel, still sends if the user jumps straight to checkout.
 *
 *   VITE_QUIZ_CAPTURE_URL  the backend endpoint that stores a submission
 */

// GFP's live capture endpoint (Supabase Edge Function, same project as the
// Landing Hub). Public URL, safe in the bundle; the table behind it is
// RLS-locked. Prod-only so dev runs never write test rows.
const DEFAULT_CAPTURE_URL = "https://uzpqgeodcbfgymipefwb.supabase.co/functions/v1/quiz-capture";
const CAPTURE_URL = (import.meta.env.VITE_QUIZ_CAPTURE_URL as string | undefined) ?? (import.meta.env.PROD ? DEFAULT_CAPTURE_URL : undefined);
const QUIZ_ID_KEY = "gfp_quiz_id";

/**
 * A stable id for this quiz attempt, generated once and kept for the tab session
 * so the SAME id rides both the capture POST and the Shopify cart (as a hidden
 * line-item property) — that's what lets us stitch a completed quiz to the order.
 */
export function getQuizId(): string {
  try {
    let id = sessionStorage.getItem(QUIZ_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(QUIZ_ID_KEY, id);
    }
    return id;
  } catch {
    return ""; // storage blocked — capture still works, order-stitching just won't
  }
}

/**
 * Persist a quiz submission. Upserts on the backend by quiz_id, so it's safe to
 * call more than once for the same attempt (e.g. once on the result page, then
 * again with the email once they submit it).
 */
export function saveSubmission(payload: Record<string, unknown>): void {
  if (!CAPTURE_URL) return; // backend not wired yet — safe no-op
  try {
    const body = JSON.stringify({ quiz_id: getQuizId(), ...payload, client_ts: Date.now() });
    void fetch(CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the funnel over analytics */
  }
}
