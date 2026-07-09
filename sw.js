const CACHE_NAME = 'aryan-portfolio-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app_icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap'
];

// Install: cache all static assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Immediately activate new SW
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Some assets failed to cache:', err);
      });
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all pages immediately
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
    ])
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, fonts, images)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Cache successful GET responses for static assets
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
