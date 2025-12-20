
const CACHE_NAME = 'dex-quad-v20';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/lucide-react@0.292.0?external=react,react-dom'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fetch with no-cache to ensure we get fresh assets from CDN
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
              throw new Error('Fetch failed: ' + url);
            })
            .catch(err => console.warn('Cache fail:', url, err));
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
  // Navigation requests: Network first, then cache (to allow updates)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // Asset requests: Cache first, then network (stale-while-revalidate logic could be better but CacheFirst is safer for offline)
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
