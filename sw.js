// Service worker — offline cache for the PR White Playbook PWA.
// Network-first: always pulls the latest when online, falls back to cache when offline.
// This prevents the app from getting "stuck" on an old cached version.
const CACHE = 'rams-playbook-v3';
const FILES = [
  './',
  './play_calling_app.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(FILES.map((f) => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first with a 3-second timeout, then fall back to cache.
// Online  -> you always get the latest version (no more stuck-on-old-version).
// Offline -> instant fallback to the cached copy (works at the field).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const fromNetwork = fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => null);
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
  e.respondWith(
    Promise.race([fromNetwork, timeout])
      .then((res) => res || caches.match(e.request).then((c) => c || fromNetwork))
  );
});
