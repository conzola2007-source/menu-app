'use client';

// Manages Web Push subscription state for the current user.
// Uses the browser PushManager API to subscribe/unsubscribe and
// persists the subscription to the server via /api/push/subscribe.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';

// ─── Push support detection ───────────────────────────────────────────────────

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// ─── Get current browser subscription ─────────────────────────────────────────

async function getBrowserSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// ─── Hook: is the current device subscribed? ──────────────────────────────────

export function usePushSubscription() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  return useQuery({
    queryKey: queryKeys.pushSubscription.get(userId),
    queryFn: getBrowserSubscription,
    enabled: !!userId && isPushSupported(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ─── Mutation: enable push ────────────────────────────────────────────────────

export function useEnablePush() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: async () => {
      if (!isPushSupported()) throw new Error('Push not supported');

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission denied');

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

      // Convert base64 VAPID key to Uint8Array
      const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
      const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawKey = atob(base64);
      const applicationServerKey = new Uint8Array(rawKey.length);
      for (let i = 0; i < rawKey.length; i++) {
        applicationServerKey[i] = rawKey.charCodeAt(i);
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const { keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      // Save to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }),
      });
      if (!res.ok) throw new Error('Failed to save subscription');

      return subscription;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pushSubscription.get(userId) });
    },
  });
}

// ─── Mutation: disable push ───────────────────────────────────────────────────

export function useDisablePush() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? '');

  return useMutation({
    mutationFn: async () => {
      const subscription = await getBrowserSubscription();
      if (!subscription) return;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pushSubscription.get(userId) });
    },
  });
}
