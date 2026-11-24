// Offline support: precache the app shell; network-first for data so updates
// arrive promptly, with the cached copy as the offline fallback.
const VERSION = 'ayu-v5';
const SHELL = ['./', './index.html', './css/app.css', './css/print.css', './js/main.js', './js/util.js', './js/store.js', './js/search.js', './js/translit.js', './js/components.js', './js/i18n.js',
  './js/views/condition.js', './js/views/entities.js', './js/views/lists.js', './js/views/pages.js', './js/views/academy.js', './js/views/tools.js', './img/panchamahabhuta-tridosha.svg', './img/shat-kriyakala.svg', './manifest.webmanifest'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // Remote images: cache-first so viewed plant photos work offline.
    if (req.destination === 'image') e.respondWith(caches.open(VERSION + '-img').then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; })));
    return;
  }
  e.respondWith(fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy))); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' })));
});
