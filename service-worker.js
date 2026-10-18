/* MortaLeague PWA shell cache. Supabase/API responses are deliberately never cached. */
const CACHE_NAME = "mortaleague-quality-20261018-16-mortabot-openrouter";
const SHELL_ASSETS = [
  "/", "/index.html", "/offline.html",
  "/style.css?v=ml-mortabot-openrouter-20261018-02",
  "/config.js?v=ml-mortabot-openrouter-20261018-02",
  "/app.js?v=ml-mortabot-openrouter-20261018-02",
  "/calculator.js?v=ml-mortabot-openrouter-20261018-02",
  "/mortabot.js?v=ml-mortabot-openrouter-20261018-02",
  "/auth.js?v=ml-mortabot-openrouter-20261018-02",
  "/messages.js?v=ml-mortabot-openrouter-20261018-02",
  "/social.js?v=ml-mortabot-openrouter-20261018-02",
  "/visual-polish.js?v=ml-mortabot-openrouter-20261018-02",
  "/pwa.js?v=ml-mortabot-openrouter-20261018-02",
  "/manifest.webmanifest?v=ml-mortabot-openrouter-20261018-02",
  "/favicon.svg?v=ml-mortabot-openrouter-20261018-02",
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
    await Promise.all(keys.filter(key => /^(?:mortaleague-shell-|mortaleague-quality-)/.test(key) && key !== CACHE_NAME).map(key => caches.delete(key)));
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
