/// <reference lib="webworker" />
// Custom service worker code merged by @ducanh2912/next-pwa
// Handles Web Push events

declare const self: ServiceWorkerGlobalScope;

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: 'Menu App', body: event.data.text() };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon ?? '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: payload.url ?? '/' },
    requireInteraction: false,
    tag: 'menu-app-notification',
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing tab if open
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            void (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      }),
  );
});
