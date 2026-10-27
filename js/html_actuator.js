// CUHK 2048 — renders the board and the win / game-over overlay.
// Share is Instagram + Threads only.
// Instagram has no web share URL, so it uses the native Web Share sheet
// (navigator.share) and falls back to copy-to-clipboard; Threads uses
// its web intent link (threads.net/intent/post).

// Fallback tile names (used only if js/i18n.js has not loaded).
var ZH_TILE_NAMES = {
  2: "和聲", 4: "伍宜孫", 8: "敬文", 16: "善衡", 32: "晨興",
  64: "逸夫", 128: "聯合", 256: "新亞", 512: "崇基",
  1024: "走讀", 2048: "中大", 4096: "過三", 8192: "爆四"
  // Nothing past 8192: the game ends at 爆四.
};

// 和聲 chant shown on game over in zh, indexed by highest tile reached.
var LOSE_CHANTS = [
  "我哋DEM返個和聲beat好唔好呀?",
  "DEM返個和聲beat先啦",
  "和！聲！",
  "我哋DEM返個和聲beat好唔好呀！？",
  "和盡天地風雲之聲！",
  "環抱山水日月之景！",
  "婆娑樹影！人傑地靈！",
  "育和聲一代菁英！",
  "立和聲千秋美名！",
  "和聲!和聲!和聲!",
  "URRSH！"
];

function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;
  this.maxTile = 2;
}

HTMLActuator.prototype.i18n = function () {
  return (typeof window !== "undefined") ? window.CUHK2048I18N : null;
};

HTMLActuator.prototype.t = function (key) {
  var i18n = this.i18n();
  if (i18n && typeof i18n.t === "function") return i18n.t(key);
  return key;
};

HTMLActuator.prototype.tileLabel = function (value) {
  var i18n = this.i18n();
  if (i18n && typeof i18n.tileName === "function") return i18n.tileName(value);
  return ZH_TILE_NAMES[value] || "";
};

HTMLActuator.prototype.shareTextWithUrl = function (score, maxTile) {
  var i18n = this.i18n();
  if (i18n && typeof i18n.shareTextWithUrl === "function") {
    return i18n.shareTextWithUrl(score, maxTile);
  }
  return "I scored " + score + " points and reached " +
    (ZH_TILE_NAMES[maxTile] || "") +
    " in CUHK 2048! #CUHK2048 https://ymll.github.io/2048/";
};

HTMLActuator.prototype.gameUrl = function () {
  var i18n = this.i18n();
  return (i18n && i18n.gameUrl) || "https://ymll.github.io/2048/";
};

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  if (metadata) {
    if (metadata.maxTile) this.maxTile = metadata.maxTile;
    if (typeof metadata.bestScore === "number") this.bestScore = metadata.bestScore;
    this.lastMetadata = metadata;
  }
  // Kept so the share card can draw the board as it was when the
  // win / game-over overlay appeared.
  this.lastGrid = grid;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      self.message(metadata);
    }
  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continue = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  if (!container) return;
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 8192) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  // Tile labels only go up to 8192 (爆四). The game ends there, so a
  // higher tile is never shown — and no number is used as a fallback.
  inner.textContent = this.tileLabel(tile.value);

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.log2 = function (n) {
  var r = 0;
  while (n > 1) { r++; n >>= 1; }
  return r;
};

HTMLActuator.prototype.loseMessage = function (maxTile) {
  var i18n = this.i18n();
  if (i18n && i18n.getLang && i18n.getLang() === "en") {
    return this.t("lose").replace("{tile}", this.tileLabel(maxTile));
  }
  // zh: keep the original 和聲 chant, indexed by highest tile reached.
  var index = this.log2(maxTile || 2) - 3;
  if (index < 0) index = 0;
  if (index >= LOSE_CHANTS.length) index = LOSE_CHANTS.length - 1;
  return LOSE_CHANTS[index];
};

// metadata: { over, stage: "cuhk" | "final" | null, maxTile, score }
// stage "cuhk" = reached 2048 (中大), "final" = reached 8192 (爆四).
HTMLActuator.prototype.message = function (metadata) {
  if (!this.messageContainer) return;
  metadata = metadata || {};

  var type, messageText, retryLabel;
  if (metadata.over) {
    type = "game-over";
    messageText = this.loseMessage(metadata.maxTile || this.maxTile);
    retryLabel = this.t("tryAgain");
  } else if (metadata.stage === "cuhk") {
    type = "game-won-cuhk";
    messageText = this.t("winCuhk");
    retryLabel = this.t("startOver");
  } else if (metadata.stage === "final") {
    type = "game-won-final";
    messageText = this.t("winFinal");
    retryLabel = this.t("startOver");
  } else {
    return;
  }

  this.clearMessage();
  this.messageContainer.classList.add(type);
  var paragraph = this.messageContainer.getElementsByTagName("p")[0];
  if (paragraph) paragraph.textContent = messageText;

  var retry = this.messageContainer.querySelector(".retry-button");
  if (retry) retry.textContent = retryLabel;

  this.updateThreadsLink(this.score, metadata.maxTile || this.maxTile);
};

HTMLActuator.prototype.clearMessage = function () {
  if (!this.messageContainer) return;
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-won-cuhk");
  this.messageContainer.classList.remove("game-won-final");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.updateThreadsLink = function (score, maxTile) {
  if (typeof document === "undefined" || !document.querySelector) return;
  var link = document.querySelector(".threads-button");
  if (!link) return;
  var i18n = this.i18n();
  var href;
  if (i18n && typeof i18n.threadsUrl === "function") {
    href = i18n.threadsUrl(score, maxTile);
  } else {
    href = "https://www.threads.net/intent/post?text=" +
      encodeURIComponent(this.shareTextWithUrl(score, maxTile)) +
      "&url=" + encodeURIComponent(this.gameUrl());
  }
  link.setAttribute("href", href);
};

HTMLActuator.prototype.copyTextToClipboard = function (text, button, feedbackKey) {
  var self = this;
  var done = function () {
    if (!button) return;
    var original = button.textContent;
    button.textContent = self.t(feedbackKey || "copied");
    window.setTimeout(function () {
      button.textContent = original;
    }, 1800);
  };
  var fallbackCopy = function () {
    try {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch (e) {
      // Clipboard unavailable: nothing more we can do.
    }
    done();
  };
  if (typeof navigator !== "undefined" && navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(text).then(done, fallbackCopy);
  } else {
    fallbackCopy();
  }
};

// Copy the score text. Used by the Copy button, and as the fallback
// for Instagram when the native share sheet is unavailable.
HTMLActuator.prototype.copyScore = function (score, maxTile, button, feedbackKey) {
  var text = this.shareTextWithUrl(
    score === undefined ? this.score : score,
    maxTile === undefined ? this.maxTile : maxTile);
  var btn = button || null;
  if (!btn && typeof document !== "undefined" && document.querySelector) {
    btn = document.querySelector(".copy-button");
  }
  this.copyTextToClipboard(text, btn, feedbackKey || "copied");
};

// The message shown on the share card for the current overlay:
// the stage message on a win, the lose message on game over.
HTMLActuator.prototype.stageMessage = function (metadata) {
  metadata = metadata || this.lastMetadata || {};
  if (metadata.over) return this.loseMessage(metadata.maxTile || this.maxTile);
  if (metadata.stage === "cuhk") return this.t("winCuhk");
  if (metadata.stage === "final") return this.t("winFinal");
  return "CUHK 2048";
};

// Draw the 1080x1080 share card for the current board, or null if
// canvas is unavailable.
HTMLActuator.prototype.buildShareCard = function (score, maxTile) {
  var card = (typeof window !== "undefined") ? window.CUHK2048ShareCard : null;
  if (!card || typeof card.drawShareCard !== "function") return null;
  var s = score === undefined ? this.score : score;
  var m = maxTile === undefined ? this.maxTile : maxTile;
  var i18n = this.i18n();
  return card.drawShareCard(this.lastGrid, {
    message: this.stageMessage(this.lastMetadata),
    score: s,
    best: this.bestScoreValue(),
    maxTile: m,
    tileLabel: this.tileLabel.bind(this),
    gameUrl: this.gameUrl(),
    lang: i18n && i18n.getLang ? i18n.getLang() : "zh"
  });
};

HTMLActuator.prototype.bestScoreValue = function () {
  if (typeof this.bestScore === "number") return this.bestScore;
  if (typeof document === "undefined" || !document.querySelector) return 0;
  var el = document.querySelector(".best-container");
  if (!el) return 0;
  var n = parseInt(el.textContent, 10);
  return isNaN(n) ? 0 : n;
};

HTMLActuator.prototype.downloadBlob = function (blob, filename) {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return false;
  if (typeof document === "undefined" || !document.createElement) return false;
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename || "cuhk-2048.png";
  if (document.body && document.body.appendChild) document.body.appendChild(a);
  a.click();
  if (document.body && document.body.removeChild) document.body.removeChild(a);
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  return true;
};

HTMLActuator.prototype.showTemporaryFeedback = function (button, feedbackKey, ms) {
  if (!button) return;
  var self = this;
  var original = button.textContent;
  button.textContent = self.t(feedbackKey);
  window.setTimeout(function () {
    button.textContent = original;
  }, ms || 2500);
};

// Share as an IMAGE — this is the primary share flow.
// (1) If the browser can share files, open the native share sheet
// with the PNG + text (on mobile the player picks Instagram or
// Threads there). (2) Otherwise download the PNG and copy the
// share text, so the player can post it to IG / Threads manually.
// The Threads text link in the overlay stays as a secondary option.
HTMLActuator.prototype.shareImage = function (score, maxTile, button) {
  var self = this;
  var s = score === undefined ? this.score : score;
  var m = maxTile === undefined ? this.maxTile : maxTile;
  var btn = button || ((typeof document !== "undefined" && document.querySelector)
    ? document.querySelector(".share-button") : null);
  var text = this.shareTextWithUrl(s, m);

  var canvas = this.buildShareCard(s, m);
  if (!canvas) {
    // No canvas at all: fall back to text-only copy for Instagram.
    this.copyScore(s, m, btn, "copiedInstagram");
    return;
  }

  var card = window.CUHK2048ShareCard;
  card.exportShareCardPNG(canvas, function (blob) {
    if (!blob) {
      self.copyScore(s, m, btn, "copiedInstagram");
      return;
    }

    var file = null;
    if (typeof File !== "undefined") {
      try { file = new File([blob], "cuhk-2048.png", { type: "image/png" }); } catch (e) { file = null; }
    }

    if (file && typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] }) &&
        typeof navigator.share === "function") {
      var shareText = self.i18n() && self.i18n().shareText
        ? self.i18n().shareText(s, m) : text;
      navigator.share({ files: [file], text: shareText, title: "CUHK 2048" })
        .catch(function () {
          // Cancelled or failed: stay on the overlay.
        });
      return;
    }

    // Desktop / no file sharing: download the PNG and copy the text.
    self.downloadBlob(blob, "cuhk-2048.png");
    if (typeof navigator !== "undefined" && navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).catch(function () {});
    }
    self.showTemporaryFeedback(btn, "imageDownloaded", 3000);
  });
};

// Instagram: there is no web share URL for Instagram, so share the
// card image — native share sheet on mobile, download + copy on
// desktop. See shareImage() above.
HTMLActuator.prototype.shareToInstagram = function (score, maxTile) {
  this.shareImage(score, maxTile);
};

// Generic share (the Share / Instagram button). Kept as an alias so
// older "share" events still do the right thing: share the card
// image first, download + copy as the fallback.
HTMLActuator.prototype.shareScore = function (score, maxTile) {
  this.shareToInstagram(score, maxTile);
};
