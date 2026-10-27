// CUHK 2048 — language support (EN / 中文).
// Default is zh-Hant, the site's original language. The choice is saved
// in localStorage ("cuhk2048-lang") so it survives reloads.
// Share here is Threads (web intent link) and Instagram
// (native Web Share sheet, otherwise copy-to-clipboard).

(function () {
  var LANG_KEY = "cuhk2048-lang";
  var GAME_URL = "https://ymll.github.io/2048/";

  var TILE_NAMES = {
    zh: {
      2: "和聲",
      4: "伍宜孫",
      8: "敬文",
      16: "善衡",
      32: "晨興",
      64: "逸夫",
      128: "聯合",
      256: "新亞",
      512: "崇基",
      1024: "走讀",
      2048: "中大",
      4096: "過三",
      8192: "爆四"
      // Deliberately nothing past 8192: the game ends at 爆四, so a
      // 16384+ tile is never needed and showing a number makes no sense.
    },
    en: {
      2: "Woo Sing",
      4: "Wu Yee Sun",
      8: "CW Chu",
      16: "S.H. Ho",
      32: "Morningside",
      64: "Shaw",
      128: "United",
      256: "New Asia",
      512: "Chung Chi",
      1024: "Day Student",
      2048: "CUHK",
      4096: "GPA 3+",
      8192: "GPA 4.0"
    }
  };

  var STRINGS = {
    zh: {
      toggleLabel: "EN",
      toggleTitle: "Switch to English",
      update: "已更新至加強版。",
      updateNote: "<strong>Update:</strong> 手機版已推出。歡迎透過 GitHub 報告問題，或電郵至 <a href=\"mailto:ymll@live.hk\">ymll@live.hk</a>。玩得開心 :)",
      intro: "加入書院，拼到<strong>中大</strong>！",
      howTo: "<strong class=\"important\">玩法：</strong>用<strong>方向鍵</strong>移動方塊（手機可用手指滑動）。兩個相同方塊碰在一起，就會<strong>合併</strong>！",
      note: "<strong class=\"important\">注意：</strong>本站<strong>並非</strong> 2048 的官方版本。",
      keepPlaying: "繼續玩",
      tryAgain: "再玩一次",
      startOver: "重新開始",
      shareInstagram: "Instagram",
      threads: "Threads",
      copy: "複製",
      copied: "已複製！",
      copiedInstagram: "已複製 — 貼到 Instagram",
      imageDownloaded: "圖片已下載 — 去 IG / Threads 分享",
      winCuhk: "中大歡迎你！",
      winFinal: "爆四需苦幹！",
      lose: "遊戲結束！你拼到{tile}。",
      shareText: "我在 CUHK 2048 得到 {score} 分，拼到{tile}！",
      faqHeading: "常見問題",
      faqQ1: "甚麼是 CUHK 2048？",
      faqA1: "CUHK 2048（中大加強版）是免費的網上 2048 拼圖遊戲，方塊是香港中文大學的書院。合併書院方塊，拼到 2048 的中大，再挑戰 8192 的爆四。",
      faqQ2: "點樣玩？",
      faqA2: "用方向鍵移動方塊，手機可以手指滑動。兩個相同書院的方塊碰在一起，就會合併成下一個書院。無路可走時遊戲結束。",
      faqQ3: "書院方塊的順序是怎樣的？",
      faqA3: "由細到大是：和聲、伍宜孫、敬文、善衡、晨興、逸夫、聯合、新亞、崇基、走讀、中大、過三、爆四。",
      faqQ4: "點樣先算贏？",
      faqA4: "拼到 2048 中大就贏了第一階段 ——「中大歡迎你！」，可以繼續玩；拼到 8192 爆四就是最終勝利 ——「爆四需苦幹！」。爆四之後沒有更大的方塊。",
      ladderHeading: "書院方塊順序"
    },
    en: {
      toggleLabel: "中文",
      toggleTitle: "切換到中文",
      update: "Updated to the enhanced edition.",
      updateNote: "<strong>Update:</strong> Mobile version is available. You are welcome to report any bugs through GitHub or send email to <a href=\"mailto:ymll@live.hk\">ymll@live.hk</a>. Enjoy the game :)",
      intro: "Join the college and get to the <strong>CUHK tile!</strong>",
      howTo: "<strong class=\"important\">How to play:</strong> Use your <strong>arrow keys</strong> to move the tiles (or slide on touch screen with mobile). When two tiles with the same number touch, they <strong>merge into one!</strong>",
      note: "<strong class=\"important\">Note:</strong> This site is <strong>NOT</strong> the official version of 2048.",
      keepPlaying: "Continue playing",
      tryAgain: "Try again",
      startOver: "Start over",
      shareInstagram: "Instagram",
      threads: "Threads",
      copy: "Copy",
      copied: "Copied!",
      copiedInstagram: "Copied — paste it in Instagram",
      imageDownloaded: "Image downloaded — post it to IG / Threads",
      winCuhk: "Welcome to CUHK!",
      winFinal: "GPA 4.0 — you did it!",
      lose: "Game over! You reached {tile}.",
      shareText: "I scored {score} points and reached {tile} in CUHK 2048! #CUHK2048",
      faqHeading: "Frequently asked questions",
      faqQ1: "What is CUHK 2048?",
      faqA1: "CUHK 2048 is a free online 2048 puzzle game where the tiles are colleges of the Chinese University of Hong Kong. Merge the college tiles to reach CUHK at 2048, then keep going to GPA 4.0 at 8192.",
      faqQ2: "How do you play?",
      faqA2: "Use your arrow keys to move the tiles, or swipe on a touch screen. When two tiles with the same college touch, they merge into the next college. The game ends when no more moves are possible.",
      faqQ3: "What are the college tiles in order?",
      faqA3: "From smallest to largest: Woo Sing, Wu Yee Sun, CW Chu, S.H. Ho, Morningside, Shaw, United, New Asia, Chung Chi, Day Student, CUHK, GPA 3+, GPA 4.0.",
      faqQ4: "How do you win?",
      faqA4: "Reach 2048 CUHK to win the first stage — “Welcome to CUHK!” — and you can keep playing. Reach 8192 GPA 4.0 for the final win — “GPA 4.0 — you did it!” There is no tile past GPA 4.0.",
      ladderHeading: "College tiles in order"
    }
  };

  function readStoredLang() {
    try {
      var stored = window.localStorage && window.localStorage.getItem(LANG_KEY);
      if (stored === "en" || stored === "zh") return stored;
    } catch (e) {
      // Private mode / no storage: fall back to the default below.
    }
    return "zh";
  }

  function getLang() {
    return window.__cuhk2048_lang || readStoredLang();
  }

  function t(key) {
    var lang = getLang();
    var strings = STRINGS[lang] || STRINGS.zh;
    return strings[key] !== undefined ? strings[key] : STRINGS.zh[key];
  }

  function tileName(value) {
    var names = TILE_NAMES[getLang()] || TILE_NAMES.zh;
    return names[value] || "";
  }

  function tileNameForLang(value, lang) {
    var names = TILE_NAMES[lang] || TILE_NAMES.zh;
    return names[value] || "";
  }

  function shareText(score, maxTile) {
    var text = t("shareText")
      .replace("{score}", String(score))
      .replace("{tile}", tileName(maxTile));
    return text;
  }

  function shareTextWithUrl(score, maxTile) {
    return shareText(score, maxTile) + " " + GAME_URL;
  }

  function threadsUrl(score, maxTile) {
    // Threads web intent. Instagram has no equivalent web URL, so it is
    // handled separately via navigator.share() / clipboard (see
    // HTMLActuator.shareToInstagram).
    return "https://www.threads.net/intent/post?text=" +
      encodeURIComponent(shareTextWithUrl(score, maxTile)) +
      "&url=" + encodeURIComponent(GAME_URL);
  }

  function applyLanguage() {
    var lang = getLang();
    window.__cuhk2048_lang = lang;
    try {
      if (window.localStorage) window.localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      // Storage unavailable: the in-memory choice still applies.
    }

    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
    }

    if (typeof document !== "undefined" && document.querySelectorAll) {
      var elements = document.querySelectorAll("[data-i18n]");
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var key = el.getAttribute("data-i18n");
        var value = t(key);
        if (value === undefined) continue;
        // Keys containing markup (intro / howTo / note / updateNote)
        // are set as HTML; plain labels are set as text.
        if (key === "intro" || key === "howTo" || key === "note" || key === "updateNote") {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      }
      var toggle = document.getElementById("lang-toggle");
      if (toggle) {
        toggle.textContent = t("toggleLabel");
        toggle.setAttribute("title", t("toggleTitle"));
      }
    }

    // Re-render the board (tile labels + any visible win/lose message)
    // in the new language, if a game is running.
    if (window.gameManager && typeof window.gameManager.actuate === "function") {
      window.gameManager.actuate();
    }
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "zh") return;
    window.__cuhk2048_lang = lang;
    applyLanguage();
  }

  function toggleLang() {
    setLang(getLang() === "en" ? "zh" : "en");
  }

  window.__cuhk2048_lang = readStoredLang();
  window.CUHK2048I18N = {
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    applyLanguage: applyLanguage,
    t: t,
    tileName: tileName,
    tileNameForLang: tileNameForLang,
    shareText: shareText,
    shareTextWithUrl: shareTextWithUrl,
    threadsUrl: threadsUrl,
    gameUrl: GAME_URL
  };
})();
