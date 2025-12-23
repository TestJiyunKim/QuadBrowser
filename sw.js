
const CACHE_NAME = 'dex-quad-v64';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react@18.3.1/',
  'https://esm.sh/react-dom@18.3.1',
  'https://esm.sh/react-dom@18.3.1/',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/lucide-react@0.292.0?external=react,react-dom',
  'https://esm.sh/@google/genai@^1.34.0'
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
            .catch(err => console.error('Cache fetch error:', url, err));
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
    caches.match(e.request).then(cachedResponse => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return networkResponse;
      }).catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});
