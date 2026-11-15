// TarımYol - Offline and Service Worker Module
const CACHE_NAME = 'tarimyol-cache-v13';

const STATIC_ASSETS = [
  './',
  './index.html',
  './main.css',
  './main.js',
  './overview-hazards.js',
  './parcel-map.js',
  './plants.js',
  './charts.js',
  './cost-calculator.js',
  './pdf-export.js',
  './farmer-auth.js',
  './agro-advisor.js',
  './manifest.json',
  './assets/plants/alfalfa.jpg',
  './assets/plants/almond.jpg',
  './assets/plants/apple.jpg',
  './assets/plants/apricot.jpg',
  './assets/plants/barley.jpg',
  './assets/plants/basil.jpg',
  './assets/plants/bean.jpg',
  './assets/plants/black-cumin.jpg',
  './assets/plants/chamomile.jpg',
  './assets/plants/cherry.jpg',
  './assets/plants/chickpea.jpg',
  './assets/plants/corn.jpg',
  './assets/plants/cotton.jpg',
  './assets/plants/cucumber.jpg',
  './assets/plants/echinacea.jpg',
  './assets/plants/eggplant.jpg',
  './assets/plants/fig.jpg',
  './assets/plants/forage-pea.jpg',
  './assets/plants/garlic.jpg',
  './assets/plants/grape.jpg',
  './assets/plants/hazelnut.jpg',
  './assets/plants/lavender.jpg',
  './assets/plants/lemon-balm.jpg',
  './assets/plants/lemon.jpg',
  './assets/plants/lentil.jpg',
  './assets/plants/licorice.jpg',
  './assets/plants/mandarin.jpg',
  './assets/plants/melon.jpg',
  './assets/plants/mint.jpg',
  './assets/plants/nectarine.jpg',
  './assets/plants/oats.jpg',
  './assets/plants/onion.jpg',
  './assets/plants/orange.jpg',
  './assets/plants/peach.jpg',
  './assets/plants/pepper.jpg',
  './assets/plants/pistachio.jpg',
  './assets/plants/potato.jpg',
  './assets/plants/rapeseed.jpg',
  './assets/plants/rice.webp',
  './assets/plants/rosemary.jpg',
  './assets/plants/rye.jpg',
  './assets/plants/sage.jpg',
  './assets/plants/sainfoin.jpg',
  './assets/plants/st-johns-wort.jpg',
  './assets/plants/sudan-grass.jpg',
  './assets/plants/sugar-beet.webp',
  './assets/plants/sunflower.jpg',
  './assets/plants/table-grape.jpg',
  './assets/plants/thyme.jpg',
  './assets/plants/tobacco.jpg',
  './assets/plants/tomato.jpg',
  './assets/plants/vetch.jpg',
  './assets/plants/walnut.jpg',
  './assets/plants/watermelon.jpg',
  './assets/plants/wheat.jpg'
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

// Network-first strategy: fetch an update when online; otherwise use the cache.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Return an error for external API requests while offline.
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'You are offline. Check your internet connection.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }

  // Fetch and cache static files when online; otherwise serve them from cache.
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
