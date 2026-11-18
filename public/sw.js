const CACHE_VERSION = 'dulo-shell-v1';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

const BYPASS_HOST_PATTERNS = [
  /youtube\.com$/i,
  /youtu\.be$/i,
  /googlevideo\.com$/i,
  /ytimg\.com$/i,
  /workers\.dev$/i,
  /piped/i,
  /invidious/i,
  /lrclib\.net$/i,
  /sponsor\.ajay\.app$/i,
  /firestore\.googleapis\.com$/i,
  /identitytoolkit\.googleapis\.com$/i,
  /securetoken\.googleapis\.com$/i,
  /firebase/i,
];

function shouldBypassCache(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

  // Never cache Vite HMR/dev module graph endpoints or API proxy routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return true;
  }

  return BYPASS_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) {
    return;
  }

  // Only cache same-origin app shell/static assets with Stale-While-Revalidate
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone()).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);

      if (cached) {
        return cached;
      }

      const networkResponse = await networkPromise;
      if (networkResponse) {
        return networkResponse;
      }

      // Navigation fallback to cached app shell when offline
      if (request.mode === 'navigate') {
        const shell = await cache.match('/index.html');
        if (shell) return shell;
      }

      return Response.error();
    })
  );
});
