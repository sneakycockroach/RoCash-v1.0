/**
 * RoCash Service Worker
 * Caches static shell assets only. Never caches Supabase or API requests.
 */

const CACHE_NAME = 'rocash-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // BLOCK Netlify's injected badge script
  if (requestUrl.pathname.includes('.netlify/scripts/hud')) {
    event.respondWith(new Response('', { status: 204, statusText: 'No Content' }));
    return;
  }

  // NEVER cache supabase or external APIs
  if (
    requestUrl.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Navigation requests: Network-first with fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html') || caches.match('/');
      })
    );
    return;
  }

  // Static assets: Cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache valid local GET responses
        if (
          response &&
          response.status === 200 &&
          requestUrl.origin === self.location.origin
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});