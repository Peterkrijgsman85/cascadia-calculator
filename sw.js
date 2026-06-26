const CACHE_NAME = 'cascadia-v1'; // Verhoog dit nummer als je grote updates doet
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// 1. Installatie: Cache de basisbestanden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Bestanden gecached');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) // Forceer activering
  );
});

// 2. Fetch: Serveer vanuit cache, val terug op netwerk
self.addEventListener('fetch', (event) => {
  // Alleen GET verzoeken afhandelen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Gebruik cache indien aanwezig, anders fetch van netwerk
      return cachedResponse || fetch(event.request);
    })
  );
});

// 3. Activatie: Ruim oude caches op
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('SW: Oude cache verwijderd:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim()) // Direct controle over alle tabbladen
  );
});