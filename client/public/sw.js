const CACHE_NAME = "telecloud-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/logo.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Cache-first strategy for thumbnails and download blob requests
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.includes("/thumbnail") || url.pathname.includes("/download")) {
      e.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(e.request)
              .then((response) => {
                if (response.status === 200) {
                  cache.put(e.request, response.clone());
                }
                return response;
              })
              .catch(() => {
                // If offline and cache miss, fail gracefully
                return new Response("Offline resource unavailable", { status: 503 });
              });
          });
        })
      );
    } else {
      // General API requests: bypass cache (always go to network)
      return;
    }
    return;
  }

  // For HTML, JS, CSS, and root route, use Network-First to ensure updates are delivered instantly.
  const isStaticDoc = 
    url.pathname === "/" || 
    url.pathname.endsWith(".html") || 
    url.pathname.endsWith(".js") || 
    url.pathname.endsWith(".css");

  if (isStaticDoc) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // Cache-first, fallback to network for other static assets
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
