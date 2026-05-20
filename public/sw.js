// Bump this on any SW logic change to evict old caches
const CACHE_NAME = 'gym-tracker-v2';

// Only the app shell — hashed JS/CSS bypasses SW entirely
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first ONLY for navigations (HTML). Everything else is passed through
// to the browser so hashed JS/CSS chunks update normally with every deploy.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate') return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return response;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('/') || new Response('Offline', { status: 503 }))
      )
  );
});
