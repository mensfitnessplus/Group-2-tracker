const CACHE_NAME = "ca-tracker-v1.4";

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// Force immediate installation of the new service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches completely so old files are deleted
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Use a Network-First strategy for core files so updates apply instantly when online
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const isCoreAsset = urlsToCache.some(path => {
    const cleanPath = path.replace("./", "");
    return cleanPath === "" ? url.pathname === "/" : url.pathname.endsWith(cleanPath);
  });

  if (isCoreAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
