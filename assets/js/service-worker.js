const CACHE_NAME = 'to-do-pwa-cache-v1';
const FILES_TO_CACHE = [
    '/Info5146ToDoApp/',
    '/Info5146ToDoApp/assets/html/index.html',
    '/Info5146ToDoApp/assets/html/tasks.html',
    '/Info5146ToDoApp/assets/css/style.css',
    '/Info5146ToDoApp/assets/js/firebase.js',
    '/Info5146ToDoApp/assets/js/signIn.js',
    '/Info5146ToDoApp/assets/js/tasks.js',
    '/Info5146ToDoApp/manifest.json',
    '/Info5146ToDoApp/assets/icons/icon-128.png',
    '/Info5146ToDoApp/assets/icons/icon-512.png'
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