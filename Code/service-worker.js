const CACHE_NAME = 'to-do-pwa-cache-v1';
const FILES_TO_CACHE = [
    '/Info5146Website/',
    '/Info5146Website/index.html',
    '/Info5146Website/style.css',
    '/Info5146Website/app.js',
    '/Info5146Website/manifest.json',
    '/Info5146Website/icons/icon-128.png',
    '/Info5146Website/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});