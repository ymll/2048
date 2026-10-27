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
});
