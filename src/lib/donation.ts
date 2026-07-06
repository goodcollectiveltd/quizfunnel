/**
 * Live donation total, read from the published Google Sheet.
 *
 * The funnel is a static SPA, so we fetch a public, CORS-enabled endpoint client-side.
 * The sheet tab is "published to web" as CSV and holds only the running total in one
 * cell, so nothing else is exposed. If the fetch ever fails, callers fall back to
 * showing no number (the mission card still renders + links out).
 *
 * To point at a different sheet/tab: publish the tab (File → Share → Publish to web →
 * CSV) and swap the URL below (the `output=csv` form of the pubhtml link).
 */
export const DONATION_SOURCE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVQPVheUXnu5QnCLj8Rxm3unoX7_WqP-PlCeip675j6cJiz1ADwGXMSQUE1bj-QPR5baOX15nNBRym/pub?gid=2004999887&single=true&output=csv";

/** Fetch the current donation total as a display string (e.g. "£5,863.82"), or null. */
export async function fetchDonationTotal(): Promise<string | null> {
  if (!DONATION_SOURCE_URL) return null;
  try {
    const res = await fetch(DONATION_SOURCE_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    // First non-empty cell of the published tab, quotes/BOM stripped.
    const cell = (text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || "")
      .replace(/^﻿/, "")
      .replace(/^"|"$/g, "")
      .trim();
    if (!cell) return null;
    if (cell.includes("£")) return cell; // already formatted in the sheet
    const n = Number(cell.replace(/[^0-9.]/g, ""));
    return isFinite(n) && n > 0 ? "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : null;
  } catch {
    return null;
  }
}
