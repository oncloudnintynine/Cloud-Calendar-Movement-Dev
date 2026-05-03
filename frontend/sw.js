const CACHE_NAME = 'cloud-moves-v19';

const urlsToCache =[
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './config.js',
  './state.js',
  './api.js',
  './auth.js',
  './ui.js',
  './calendar.js',
  './parade.js',
  './forms.js',
  './picker.js',
  './admin.js',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2',
  'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
