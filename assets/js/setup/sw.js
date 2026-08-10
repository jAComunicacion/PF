/* assets/js/setup/sw.js — Service Worker de Personal Count

   Reescrito por tres motivos concretos:

   1. La lista anterior incluía `remixicon.min.css`, que no existe en el
      repositorio. `cache.addAll` es todo-o-nada: un 404 rechazaba el install
      completo y el SW nunca llegaba a activarse.

   2. La estrategia anterior era cache-first para TODO, incluidas las llamadas
      a /api/. Eso serviría saldos viejos para siempre y rompería la sincro.

   3. Cache-first sobre la navegación devolvía index.html desde el caché sin
      pasar por el middleware, salteando la pantalla de ingreso.

   Estrategia actual: la red manda para navegación y API; el caché sólo guarda
   estáticos versionados (CSS, JS, imágenes). */

// v4: categorias nuevas (sale de Microsoft Money), iconos y filtro dinamico.
// Subir el numero es lo que hace que el celular tire el cache viejo.
const CACHE_NAME = 'perscount-v4';

const ASSETS = [
    '/index.html',
    '/assets/css/estilos.css',
    '/assets/css/dynamic-styles.css',
    '/assets/css/add-category.css',
    '/assets/img/avatar.jpg',
    '/assets/logos/IsoLogojAComunicacion.png',
    '/assets/logos/LogusjAComunicacion.png',
    '/assets/js/vendors/chart.js',
    '/assets/js/data/api.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // `add` individual en vez de `addAll`: si mañana falta un archivo,
            // se pierde ese recurso, no la instalación entera.
            return Promise.all(
                ASSETS.map((url) => cache.add(url).catch(() => null))
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Nunca se cachea la API ni la pantalla de ingreso: los datos tienen que
    // ser frescos y la sesión tiene que verificarse contra el servidor.
    if (url.pathname.startsWith('/api/') || url.pathname === '/login.html') {
        return;
    }

    // Navegación: red primero. Si no hay conexión, se cae al index cacheado
    // para que la app abra offline con lo que ya tenga en IndexedDB.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Estáticos: caché primero, y lo que llegue de red se guarda para después.
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response && response.ok && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            });
        })
    );
});
