// Server-side Web Push helper (VAPID)
// Used by API routes and Edge Functions

import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:admin@menuapp.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Send a push notification to a single subscription.
 * Returns true on success, false if the subscription is stale (410/404).
 * Throws on other errors.
 */
export async function sendPush(
  subscription: PushSubscriptionData,
  payload: PushPayload,
): Promise<{ success: boolean; stale: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }, // 24 hours TTL
    );
    return { success: true, stale: false };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      return { success: false, stale: true };
    }
    throw err;
  }
}
