const CACHE_NAME = 'cloud-moves-v43';

const urlsToCache =[
'./',
'./index.html',
'./manifest.json',
'./styles.css',
'./js/core/config.js',
'./js/core/state.js',
'./js/core/api.js',
'./js/core/auth.js',
'./js/core/app.js',
'./js/ui/ui.js',
'./js/ui/forms.js',
'./js/ui/picker.js',
'./js/features/calendar.js',
'./js/features/parade.js',
'./js/admin/admin.js',
'./js/admin/structure.js',
'./icon-192.png',
'./icon-512.png',
'https://cdn.tailwindcss.com',
'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2',
'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js'
];

self.addEventListener('install', event => {
event.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
);
self.skipWaiting();
});

self.addEventListener('fetch', event => {
if (event.request.method !== 'GET') return;
event.respondWith(
  caches.match(event.request).then(response => response || fetch(event.request))
);
});

self.addEventListener('activate', event => {
const cacheWhitelist = [CACHE_NAME];
event.waitUntil(
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) return caches.delete(cacheName);
      })
    );
  })
);
self.clients.claim();
});