// TarımYol - Offline & Service Worker Modülü
const CACHE_NAME = 'tarimyol-cache-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './main.css',
  './main.js',
  './parcel-map.js',
  './plants.js',
  './charts.js',
  './cost-calculator.js',
  './pdf-export.js',
  './manifest.json'
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
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-First stratejisi (İnternet varsa yenisini çek, yoksa cache'ten ver)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Harici API istekleri offline ise hata döndür
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Çevrimdışı moddasınız. İnternet bağlantınızı kontrol edin.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }

  // Statik dosyalar için ağdan çekip önbelleğe yaz, ağ yoksa önbellekten sun
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
