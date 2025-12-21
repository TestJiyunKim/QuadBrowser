
const CACHE_NAME = 'dex-quad-v27';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/lucide-react@0.292.0?external=react,react-dom',
  'https://esm.sh/@google/genai@^1.34.0'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => {
          return fetch(url, { cache: 'no-cache' })
            .then(res => {
              if (res.ok) return cache.put(url, res);
              console.warn('Skipping cache for:', url, res.status);
              return null;
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
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  
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
