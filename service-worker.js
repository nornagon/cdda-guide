const CURRENT_CACHES = {
  data: 'data-v1',
  app: 'app-v2',
};

const appUrls = [
  './build/bundle.js',
  './build/bundle.css',
  './favicon.png',
  './global.css',
  './dont_panic.png',
  './unifont.woff',
  './',
]

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    (async () => {
      const cache = await caches.open(CURRENT_CACHES.app)
      await cache.addAll(appUrls)
    })(),
  ]))
})

self.addEventListener('activate', function(event) {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic will handle the case where
  // there are multiple versioned caches.
  var expectedCacheNamesSet = new Set(Object.values(CURRENT_CACHES));
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!expectedCacheNamesSet.has(cacheName)) {
            // If this cache name isn't present in the set of "expected" cache names, then delete it.
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }
  const url = new URL(event.request.url);
  if (url.hostname === 'raw.githubusercontent.com') {
    if (url.pathname.endsWith('/all.json' && !url.pathname.endsWith('/latest/all.json'))) {
      // all.json is same forever
      return event.respondWith((async () => {
        const cache = await caches.open(CURRENT_CACHES.data)
        const cacheResponse = await cache.match(event.request)
        if (cacheResponse) return cacheResponse

        const networkResponse = await fetch(event.request.clone())
        if (networkResponse && networkResponse.status < 400)
          cache.put(event.request, networkResponse.clone())
        return networkResponse
      })())
    } else {
      // for other files, e.g. latest/all.json, try fetching, if we can't get it then try the cache.
      return event.respondWith((async () => {
        try {
          const response = await fetch(event.request.clone());
          const clonedResponse = response.clone();
          event.waitUntil(caches.open(CURRENT_CACHES.data).then(cache => {
            cache.put(event.request, clonedResponse);
          }));
          return response;
        } catch (err) {
          const cache = await caches.open(CURRENT_CACHES.data)
          return await cache.match(event.request)
        }
      })())
    }
  } else {
    return event.respondWith((async () => {
      try {
        const response = await fetch(event.request.clone());
        if (response.type === 'basic') {
          const clonedResponse = response.clone();
          event.waitUntil(caches.open(CURRENT_CACHES.app).then(cache => {
            cache.put(event.request, clonedResponse);
          }));
        }
        return response;
      } catch (err) {
        const cache = await caches.open(CURRENT_CACHES.app)
        return await cache.match(event.request)
      }
    })())
  }
});
