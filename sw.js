
const CACHE_NAME = 'dex-quad-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/lucide-react@^0.292.0',
  'https://esm.sh/react-dom@18.3.1'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(fetchRes => {
      return caches.open(CACHE_NAME).then(cache => {
        if (fetchRes.status === 200) cache.put(e.request, fetchRes.clone());
        return fetchRes;
      });
    }))
  );
});
