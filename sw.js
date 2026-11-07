// CUHK 2048 — service worker.
//
// Caches the game shell (HTML, CSS, JS, icons) so the game loads fast
// and keeps working offline after the first visit. Same-origin files
// only; nothing else (analytics, etc.) is cached. Bump CACHE when the
// cached files change — old caches are deleted on activate.
var CACHE = "cuhk2048-v1";

var CORE = [
  "/2048/",
  "/2048/index.html",
  "/2048/manifest.json",
  "/2048/style/main.css",
  "/2048/js/animframe_polyfill.js",
  "/2048/js/application.js",
  "/2048/js/game_manager.js",
  "/2048/js/game_save.js",
  "/2048/js/grid.js",
  "/2048/js/html_actuator.js",
  "/2048/js/i18n.js",
  "/2048/js/install_prompt.js",
  "/2048/js/keyboard_input_manager.js",
  "/2048/js/local_score_manager.js",
  "/2048/js/share_card.js",
  "/2048/js/tile.js",
  "/2048/meta/icon-192.png",
  "/2048/meta/icon-512.png",
  "/2048/meta/apple-touch-icon.png",
  "/2048/favicon.ico"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(CORE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (response) {
        // Keep a fresh copy of our own files for offline use.
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      }).catch(function () {
        // Offline and nothing cached: at least show the game page
        // for navigations; other requests just fail quietly.
        if (event.request.mode === "navigate") {
          return caches.match("/2048/index.html");
        }
        throw new Error("offline");
      });
    })
  );
});
