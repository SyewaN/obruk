const CACHE_VERSION = 'hydrosense-v1';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png',
  './css/style.css',
  './js/data-loader.js',
  './js/map-renderer.js',
  './js/ble-sync.js',
  './js/pwa.js',
  './js/app.js',
  './data/sensors.geojson'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isNavigationRequest = request.mode === 'navigate';

  if (isNavigationRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const cloned = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse) return networkResponse;
          if (networkResponse.ok || networkResponse.type === 'opaque') {
            const cloned = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
