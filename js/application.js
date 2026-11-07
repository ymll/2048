// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  // Testing hook (hidden, no UI): ?seed=stage1 starts one merge away
  // from 2048 (two 1024 tiles), ?seed=stage2 one merge away from 8192
  // (two 4096 tiles, Stage 1 already continued), ?seed=clear wipes the
  // save. It writes a crafted save and lets the normal restore pick it
  // up, so the game boots exactly as if that board had been played to.
  // Note: opening a seed link replaces the saved game in this browser.
  (function applySeedHook() {
    if (typeof window === "undefined" || !window.location) return;
    var search = window.location.search || "";
    var match = /(?:^|[?&])seed=(stage1|stage2|clear)(?:&|$)/.exec(search);
    if (!match || !window.CUHK2048Save) return;
    if (match[1] === "clear") {
      window.CUHK2048Save.clearGame();
      return;
    }
    var stage2 = match[1] === "stage2";
    var value = stage2 ? 4096 : 1024;
    try {
      window.localStorage.setItem(window.CUHK2048Save.saveKey, JSON.stringify({
        v: 1,
        size: 4,
        score: 0,
        over: false,
        won2048: stage2,
        won8192: false,
        continued2048: stage2,
        maxTile: value,
        tiles: [
          { x: 0, y: 0, value: value },
          { x: 1, y: 0, value: value }
        ]
      }));
    } catch (e) {
      // Storage unavailable: the hook just does nothing.
    }
  })();

  // Kept on window so the language switch (js/i18n.js) can re-render
  // the board in the new language after a toggle.
  window.gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);

  // Language toggle (top right). Applied after boot so the toggle
  // label and any [data-i18n] text match the saved language.
  var toggle = document.getElementById("lang-toggle");
  if (toggle && window.CUHK2048I18N) {
    toggle.addEventListener("click", function () {
      window.CUHK2048I18N.toggleLang();
    });
    window.CUHK2048I18N.applyLanguage();
  }

  // Restart button (top right, next to the "?" and EN toggle). A
  // fresh game wipes the current board, so a tap asks first — one
  // wrong tap should never throw a good game away.
  var restartButton = document.getElementById("restart-button");
  if (restartButton) {
    restartButton.addEventListener("click", function () {
      var message = window.CUHK2048I18N
        ? window.CUHK2048I18N.t("restartConfirm")
        : "Start a new game?";
      if (typeof window.confirm !== "function" || window.confirm(message)) {
        if (window.gameManager) {
          // restartConfirmed(): the icon already asked, so skip the
          // ask-first check in restart().
          window.gameManager.restartConfirmed();
        }
      }
    });
  }

  // FAQ modal: the tile order is a surprise, so the FAQ and the
  // college ladder stay hidden in a <dialog> until the player opens
  // them. <dialog> gives Esc-to-close and a backdrop for free;
  // on a browser without showModal() it falls back to a plain
  // open dialog.
  var faqDialog = document.getElementById("faq-dialog");
  var faqOpen = document.getElementById("faq-open");
  var faqClose = document.getElementById("faq-close");
  if (faqDialog && faqOpen) {
    faqOpen.addEventListener("click", function () {
      if (typeof faqDialog.showModal === "function") {
        faqDialog.showModal();
      } else {
        faqDialog.setAttribute("open", "");
      }
    });
  }
  if (faqDialog && faqClose) {
    faqClose.addEventListener("click", function () {
      if (typeof faqDialog.close === "function") {
        faqDialog.close();
      } else {
        faqDialog.removeAttribute("open");
      }
    });
    // Click on the backdrop (outside the dialog box) closes it.
    faqDialog.addEventListener("click", function (event) {
      if (event.target === faqDialog) {
        if (typeof faqDialog.close === "function") {
          faqDialog.close();
        } else {
          faqDialog.removeAttribute("open");
        }
      }
    });
  }
});
