/* App instalable (PWA): caché básica de recursos estáticos para uso sin conexión parcial. */
const VERSION = 'app-order-v2';
const STATIC_CACHE = `static-${VERSION}`;

const PRECACHE_URLS = ['/pwa-192.png', '/pwa-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key.startsWith('static-') && key !== STATIC_CACHE) {
                            return caches.delete(key);
                        }
                        return Promise.resolve();
                    }),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

function isCacheableStaticRequest(request, url) {
    if (request.method !== 'GET') {
        return false;
    }
    if (url.origin !== self.location.origin) {
        return false;
    }
    if (request.mode === 'navigate') {
        return false;
    }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/broadcasting/')) {
        return false;
    }
    if (url.pathname.startsWith('/build/assets/')) {
        return true;
    }
    return /\.(css|js|mjs|png|jpe?g|gif|svg|ico|webp|woff2?|ttf)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Navegaciones (HTML/Inertia): siempre red; sin caché de página para evitar datos obsoletos.
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request));
        return;
    }

    if (!isCacheableStaticRequest(request, url)) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request)),
    );
});
