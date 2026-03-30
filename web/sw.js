// 영등포 JC — Service Worker (Push Notifications + Offline Cache)

var CACHE_NAME = 'jc-v8';
var STATIC_ASSETS = [
  '/manifest.json'
];

// Install: 정적 리소스 프리캐시 + 즉시 활성화
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: 이전 캐시 정리 + 클라이언트 제어
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: API=네트워크 우선, 정적=캐시 우선(stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API 요청은 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ success: false, error: '오프라인 상태입니다.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // 정적 리소스: 네트워크 우선 (캐시는 오프라인 폴백용)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
});

// Push: show notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = { title: '영등포 JC', body: '새 알림이 있습니다', url: '/' };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // data.data.url (서버 payload 구조) 또는 data.url (직접 전달) 모두 지원
  var targetUrl = (data.data && data.data.url) ? data.data.url : (data.url || '/');

  const options = {
    body: data.body,
    icon: '/image/icon-192.png',
    badge: '/image/badge-72.png',
    data: { url: targetUrl },
    vibrate: [100, 50, 100],
    tag: data.tag || 'jc-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click: navigate to target URL
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
