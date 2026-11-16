const CACHE = 'travelog-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/geo.js',
  './assets/js/data.js',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/app.js',
  './assets/js/screens/map.js',
  './assets/js/screens/memory.js',
  './assets/js/screens/share.js',
  './assets/js/screens/discover.js',
  './assets/js/screens/me.js',
  './assets/js/screens/ai.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];
for (let i = 0; i < 18; i++) {
  ASSETS.push('./assets/img/pic' + String(i).padStart(2, '0') + '.jpg');
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
