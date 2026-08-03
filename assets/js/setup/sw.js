const CACHE_NAME = 'perscount-v1';
const ASSETS = [
    '../../../index.html',
    '../../css/estilos.css',
    '../../css/dynamic-styles.css',
    '../../css/remixicon.min.css',
    '../../img/avatar.jpg',
    '../vendors/dexie.js',
    '../vendors/chart.js',
    '../data/db.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
