// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
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
          window.gameManager.restart();
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
