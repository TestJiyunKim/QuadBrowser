
const CACHE_NAME = 'dex-quad-v18';
// Cache the exact URLs defined in the import map to ensure offline capability
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@19?dev',
  'https://esm.sh/react-dom@19?dev',
  'https://esm.sh/react-dom@19/client?dev',
  'https://esm.sh/lucide-react@0.460.0?external=react,react-dom'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use 'no-cache' to ensure we get the latest version from the server during install
      return Promise.all(
        ASSETS.map(url => {
            return fetch(url, { cache: 'no-cache' }).then(response => {
                if (!response.ok) throw Error('Not ok');
                return cache.put(url, response);
            }).catch(err => {
                console.warn('Failed to cache:', url, err);
            });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network falling back to cache strategy for main document to ensure updates
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(fetchRes => {
      // Cache successful third-party requests (like esm.sh bundles) dynamically if missed
      if (fetchRes.status === 200) {
        const resClone = fetchRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
      }
      return fetchRes;
    }))
  );
});
