// Cache names and cleanup are scoped separately for live and /preview/.
const PREFIX = 'pixel-collect-shell:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + 'v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  // The live worker must never serve its offline shell for a preview request.
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.pathname.startsWith(scope.pathname + 'preview/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      return cached || (event.request.mode === 'navigate' ? await cache.match(new URL('./index.html', scope).href) : null) || Response.error();
    }
  })());
});
