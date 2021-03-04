/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.
var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  data: 'data-v' + CACHE_VERSION,
  github_misc: 'github-misc-v' + CACHE_VERSION,
};

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
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname === 'raw.githubusercontent.com') {
    if (url.pathname.endsWith('/all.json')) {
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
      // for other files, e.g. latest-build.json, try fetching, if we can't get it then try the cache.
      return event.respondWith((async () => {
        try {
          return await fetch(event.request.clone());
        } catch (err) {
          const cache = await caches.open(CURRENT_CACHES.github_misc)
          return await cache.match(event.request)
        }
      })())
    }
  } else {
    // all other urls: network only.
    // TODO: cache html/css/js.
    return event.respondWith(fetch(event.request))
  }
});
