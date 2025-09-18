/*
  Brainiac PWA Service Worker
  - Precaches core assets for offline
  - Network-first for HTML navigation
  - Stale-while-revalidate for CSS/JS
  - Cache-first for images with runtime cache
  - Auto-updates via skipWaiting/clients.claim
*/

const VERSION = 'v1.2.0';
const PRECACHE = `precache-${VERSION}`;
const RUNTIME = `runtime-${VERSION}`;

// Core assets to precache
const PRECACHE_URLS = [
  './',
  './index.html',
  './student.html',
  './games.html',
  './teacher.html',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/gamification.js',
  './js/games.js',
  './js/teacher.js',
  './js/i18n.js',
  './js/lessons.js',
  './js/gyani.js',
  './js/doubts.js',
  './js/offline.js',
  './js/charts.js',
  './manifest.json',
  './locales/en.json',
  './locales/hi.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Claim clients immediately so updated SW takes control
      await self.clients.claim();
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== PRECACHE && key !== RUNTIME)
            .map((key) => caches.delete(key))
      );
    })()
  );
});

// Receive messages from page (e.g., to skip waiting)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  // Cache/un-cache specific URLs on demand (e.g., lessons for offline)
  if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME);
        await Promise.all(
          data.urls.map(async (u) => {
            try {
              const res = await fetch(u, { cache: 'no-cache' });
              if (res.ok) await cache.put(u, res.clone());
            } catch (e) { /* ignore fetch failures */ }
          })
        );
        // Optionally post back success
        if (event.source && event.source.postMessage) {
          event.source.postMessage({ type: 'CACHE_DONE', urls: data.urls });
        }
      })()
    );
    return;
  }
  if (data.type === 'UNCACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME);
        await Promise.all(data.urls.map((u) => cache.delete(u)));
        if (event.source && event.source.postMessage) {
          event.source.postMessage({ type: 'UNCACHE_DONE', urls: data.urls });
        }
      })()
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  // Navigation requests: network-first to fetch latest HTML
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(RUNTIME);
          const url = new URL(request.url);
          const path = url.pathname.endsWith('student.html') ? './student.html' : url.pathname.endsWith('games.html') ? './games.html' : url.pathname.endsWith('teacher.html') ? './teacher.html' : './index.html';
          cache.put(path, fresh.clone());
          return fresh;
        } catch (err) {
          const cache = await caches.open(PRECACHE);
          const url = new URL(request.url);
          const path = url.pathname.endsWith('student.html') ? './student.html' : url.pathname.endsWith('games.html') ? './games.html' : url.pathname.endsWith('teacher.html') ? './teacher.html' : './index.html';
          const cached = await cache.match(path) || await caches.match('./index.html');
          return cached || new Response('<h1>Offline</h1><p>The app shell is unavailable offline.</p>', { headers: { 'Content-Type': 'text/html' }, status: 503 });
        }
      })()
    );
    return;
  }

  // CSS/JS: stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'worker') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Images: cache-first with runtime cache
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(new URL(request.url).pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Lessons JSON and game assets: prefer cache, then network update
  const url = new URL(request.url);
  if (url.pathname.includes('/lessons/') || url.pathname.includes('/games/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: try SWR
  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => undefined);
  return cached || networkFetch;
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return cached; // might be undefined
  }
}
