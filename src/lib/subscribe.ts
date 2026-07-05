/**
 * Email capture → Klaviyo (client-side subscriptions API). Optional & config-driven:
 * with no keys set it's a no-op that still returns success, so the UI works in dev and
 * "just works" once you add the keys in the host and rebuild. See .env.example.
 *
 *   VITE_KLAVIYO_PUBLIC_KEY  — your Klaviyo public API key (company id, 6 chars)
 *   VITE_KLAVIYO_LIST_ID     — the list to subscribe quiz finishers to
 */

const PUBLIC_KEY = import.meta.env.VITE_KLAVIYO_PUBLIC_KEY as string | undefined;
const LIST_ID = import.meta.env.VITE_KLAVIYO_LIST_ID as string | undefined;

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
