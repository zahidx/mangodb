// ===========================================
// MangoBite — Service Worker
// ===========================================
const CACHE_NAME = "mangobite-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/products",
  "/offline",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-512x512.png",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network, cache new responses
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API and admin routes
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin/")) {
    return;
  }

  // Skip Supabase
  if (url.hostname.includes("supabase")) return;

  // Cache-first for images and static assets
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "font" ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Network-first for pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match("/offline");
        });
      })
  );
});
