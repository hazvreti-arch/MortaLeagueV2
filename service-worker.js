/* MortaLeague PWA shell cache. Supabase/API responses are deliberately never cached. */
const CACHE_NAME = "mortaleague-shell-20261018-06";
const SHELL_ASSETS = [
  "/", "/index.html", "/offline.html",
  "/style.css?v=ml-clean-social-msg-20261018-06",
  "/config.js?v=ml-clean-social-msg-20261018-06",
  "/app.js?v=ml-clean-social-msg-20261018-06",
  "/auth.js?v=ml-clean-social-msg-20261018-06",
  "/messages.js?v=ml-clean-social-msg-20261018-06",
  "/social.js?v=ml-clean-social-msg-20261018-06",
  "/visual-polish.js?v=ml-clean-social-msg-20261018-06",
  "/pwa.js?v=ml-clean-social-msg-20261018-06",
  "/manifest.webmanifest?v=ml-clean-social-msg-20261018-06",
  "/favicon.svg?v=ml-clean-social-msg-20261018-06",
  "/icon-192.png", "/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache items independently so one optional asset does not prevent installation.
    await Promise.allSettled(SHELL_ASSETS.map(async asset => {
      const response = await fetch(asset, { cache: "reload" });
      if (response.ok) await cache.put(asset, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("mortaleague-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Network-first for documents: serve the latest app when online, the cached shell offline.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/index.html", response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match("/offline.html")) || (await caches.match("/index.html")) || Response.error();
      }
    })());
    return;
  }
  // Same-origin static assets only; do not cache remote APIs or authenticated data.
  if (/\.(?:css|js|png|svg|webmanifest|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const network = fetch(request).then(response => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })());
  }
});
