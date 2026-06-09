const CACHE_NAME = 'cloudy-v98';

const urlsToCache =[
'./',
'./index.html',
'./manifest.json',
'./frontend/css/styles.css',
'./frontend/js/core/config.js',
'./frontend/js/core/state.js',
'./frontend/js/core/api.js',
'./frontend/js/core/auth.js',
'./frontend/js/core/app.js',
'./frontend/js/ui/ui.js',
'./frontend/js/ui/forms.js',
'./frontend/js/ui/picker.js',
'./frontend/js/features/calendar.js',
'./frontend/js/features/parade.js',
'./frontend/js/admin/admin.js',
'./frontend/js/admin/structure.js',
'./assets/icon-192.png',
'./assets/icon-512.png',
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