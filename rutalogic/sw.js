// Service worker cache-first d'Rutalògic: app shell + puzzles.json. Scope: /rutalogic/.
const CACHE = "rutalogic-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/game.js",
  "./js/hive.js",
  "./js/ui.js",
  "./js/share.js",
  "./js/storage.js",
  "./js/streak.js",
  "./js/modes.js",
  "./data/puzzles.json",
  "./manifest.json",
  "./favicon.svg",
  "./og-image.png",
  "../fonts/anton.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Només esborra caches pròpies: les de Numerològic comparteixen origen.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("rutalogic-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") return caches.match("./index.html");
      })
    )
  );
});
