
const CACHE_NAME = 'dex-quad-v74';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url, { cache: 'reload' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
              return null;
            })
            .catch(err => console.error('Cache error:', url, err));
        })
      );
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./index.html')));
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
         return caches.open(CACHE_NAME).then(cache => {
             if (e.request.method === 'GET' && res.status === 200) {
                 cache.put(e.request, res.clone());
             }
             return res;
         });
      }).catch(() => {});
    })
  );
});
