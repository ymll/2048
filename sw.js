// CUHK 2048 — service worker.
//
// Caches the game shell (HTML, CSS, JS, icons) so the game loads fast
// and keeps working offline after the first visit. Same-origin files
// only; nothing else (analytics, etc.) is cached.
// Bump CACHE whenever any file in CORE changes: the browser only
// re-installs this worker when sw.js itself changes, so an unchanged
// sw.js means players keep the old cached game forever (that is what
// happened after the 8192 fix — the fix was live, but Chrome kept
// serving the v1 cache). Old caches are deleted on activate.
var CACHE = "cuhk2048-v2";

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
        // CacheStorage is shared by the whole origin (ymll.github.io),
        // so only delete our own namespace — never another app's cache.
        return key.indexOf("cuhk2048-") === 0 && key !== CACHE;
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
        // Only cache successful responses: a transient 404/503 must
        // not become the permanent offline answer.
        if (response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
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
