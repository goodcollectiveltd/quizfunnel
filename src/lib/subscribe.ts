/**
 * Email capture to Klaviyo (client-side subscriptions API).
 *
 * Defaults to Good for Pets' Klaviyo Site ID + quiz list. Both are PUBLIC
 * identifiers (the Site ID is the same one Klaviyo's on-site forms expose, and
 * the client subscriptions endpoint is built for it) so they're safe in the
 * bundle. The env vars override them. Defaults apply to production builds only,
 * so local dev/preview never writes test profiles into the live list.
 *
 *   VITE_KLAVIYO_PUBLIC_KEY  Klaviyo Site ID / public API key (optional override)
 *   VITE_KLAVIYO_LIST_ID     list to subscribe quiz finishers to (optional override)
 */

const DEFAULT_PUBLIC_KEY = "USiMTH"; // GFP Klaviyo Site ID (matches the store's Klaviyo pixel account)
const DEFAULT_LIST_ID = "TqNn3M"; // quiz finishers list
// `||` (not ??): an env var set to "" in the host must fall through to the
// default, otherwise an empty Netlify var silently disables the integration.
const PUBLIC_KEY = (import.meta.env.VITE_KLAVIYO_PUBLIC_KEY as string | undefined) || (import.meta.env.PROD ? DEFAULT_PUBLIC_KEY : undefined);
const LIST_ID = (import.meta.env.VITE_KLAVIYO_LIST_ID as string | undefined) || (import.meta.env.PROD ? DEFAULT_LIST_ID : undefined);

export async function subscribeEmail(
  email: string,
  properties: Record<string, unknown> = {}
): Promise<boolean> {
  if (!PUBLIC_KEY || !LIST_ID) return true; // not configured yet — UI-only success

  try {
    const res = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${PUBLIC_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", revision: "2024-10-15" },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: { email, properties },
                },
              },
            },
            relationships: { list: { data: { type: "list", id: LIST_ID } } },
          },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
