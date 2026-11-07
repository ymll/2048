// CUHK 2048 — install banner + service worker.
//
// The banner appears at most once per device: either the browser's
// install prompt (Android / desktop Chrome / Edge) or, on iOS, a hint
// to Add to Home Screen. Closing it (x) or installing remembers the
// choice in localStorage, so it never nags again.
(function () {
  var FLAG_KEY = "cuhk2048-install-dismissed";
  var SHOW_DELAY_MS = 3000;

  function readFlag() {
    try {
      return window.localStorage && window.localStorage.getItem(FLAG_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeFlag() {
    try {
      if (window.localStorage) window.localStorage.setItem(FLAG_KEY, "1");
    } catch (e) {
      // Storage unavailable: the banner just shows again next visit.
    }
  }

  function isIOS() {
    var ua = window.navigator.userAgent || "";
    if (/iphone|ipad|ipod/i.test(ua) && !window.MSStream) return true;
    // iPadOS Safari reports a desktop-style user agent ("Macintosh"),
    // so also catch touch-capable Macs — a real Mac has no touchscreen.
    return window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1;
  }

  function isInstalled() {
    return (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  function t(key) {
    if (window.CUHK2048I18N && typeof window.CUHK2048I18N.t === "function") {
      return window.CUHK2048I18N.t(key);
    }
    return "";
  }

  var deferredPrompt = null;
  var timerDone = false;
  var banner = null;
  var bannerText = null;
  var bannerAction = null;
  var bannerClose = null;

  function renderBanner() {
    if (!banner || banner.hidden) return;
    var ios = isIOS() && !deferredPrompt;
    bannerText.textContent = ios ? t("installIos") : t("installBanner");
    if (deferredPrompt) {
      bannerAction.hidden = false;
      bannerAction.textContent = t("installAction");
    } else {
      bannerAction.hidden = true;
    }
    bannerClose.setAttribute("title", t("faqClose"));
  }
  window.__cuhk2048_renderInstallBanner = renderBanner;

  function showBanner() {
    if (readFlag() || isInstalled() || !banner) return;
    banner.hidden = false;
    renderBanner();
  }

  function hideBanner(remember) {
    if (!banner) return;
    banner.hidden = true;
    if (remember) writeFlag();
  }

  function init() {
    banner = document.getElementById("install-banner");
    bannerText = document.getElementById("install-banner-text");
    bannerAction = document.getElementById("install-banner-action");
    bannerClose = document.getElementById("install-banner-close");
    if (!banner || !bannerText || !bannerAction || !bannerClose) return;

    bannerClose.addEventListener("click", function () {
      hideBanner(true);
    });
    bannerAction.addEventListener("click", function () {
      if (!deferredPrompt) {
        hideBanner(true);
        return;
      }
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        // Either way, they answered — never ask again.
        hideBanner(true);
        deferredPrompt = null;
      });
    });

    if (typeof window.addEventListener === "function") {
      window.addEventListener("beforeinstallprompt", function (event) {
        event.preventDefault();
        deferredPrompt = event;
        if (timerDone) showBanner();
      });
    }

    // Service worker: cache the game shell for offline play.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {
        // Offline / unsupported: the game works fine without it.
      });
    }

    // Show once, a few seconds after load, so it never blocks the
    // first thing a player sees. iOS has no install event, so the
    // hint shows on its own; other browsers wait for the prompt.
    setTimeout(function () {
      timerDone = true;
      if (deferredPrompt || isIOS()) showBanner();
    }, SHOW_DELAY_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
