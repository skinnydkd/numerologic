// Service worker cache-first: app shell + puzzles.json. Offline-first.
const CACHE = "numerologic-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./logo.png",
  "./js/app.js",
  "./js/game.js",
  "./js/ui.js",
  "./js/storage.js",
  "./js/modes.js",
  "./js/parser.js",
  "./js/evaluator.js",
  "./js/canonical.js",
  "./js/validate.js",
  "./js/score.js",
  "./js/share.js",
  "./js/difficulty.js",
  "./js/streak.js",
  "./data/puzzles.json",
  "./manifest.json",
  "./icon.svg",
  "./icon-180.png",
  "./favicon.svg",
  "./og-image.png",
  "./fonts/anton.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
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
