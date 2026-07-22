const CACHE_NAME = 'aryan-admin-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app_icon.png',
  '../config.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&display=swap'
];

// Install Event: cache static resources
self.addEventListener('install', event => {
  self.skipWaiting(); // Force active state immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Admin cache assets preload failed:', err);
      });
    })
  );
});

// Activate Event: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Control active pages immediately
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

// Fetch Event: network-first for api endpoints, cache-first for static content
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for dynamic backend calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => new Response(JSON.stringify({ success: false, message: 'System Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  // Cache-first for local static resources
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
