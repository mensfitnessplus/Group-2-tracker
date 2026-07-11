// Fixed typo: Must be lowercase "const"
const CACHE_NAME = "ca-tracker-v1.8"; 

const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// Force immediate installation and fetch fresh files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Map URLs to Request objects with { cache: 'reload' }
        // This forces the browser to ignore the HTTP cache and fetch the newest files from the server
        const requests = urlsToCache.map(url => new Request(url, { cache: 'reload' }));
        return cache.addAll(requests);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches completely
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // If the cache name doesn't match the current CACHE_NAME, delete it
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy for core files
self.addEventListener("fetch", event => {
  // Only handle GET requests (browsers throw errors if you try to cache POST/PUT)
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isCoreAsset = urlsToCache.some(path => {
    const cleanPath = path.replace("./", "");
    return cleanPath === "" ? url.pathname === "/" : url.pathname.endsWith(cleanPath);
  });

  if (isCoreAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Ensure we only cache valid responses
          if (response && response.status === 200 && response.type === 'basic') {
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
                                       
