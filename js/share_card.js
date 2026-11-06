// CUHK 2048 — share card image (1080x1080, for Instagram / Threads).
// Drawn on a plain <canvas> with no external library: title, stage
// message, Score / Best, highest tile reached, and a 4x4 mini-board
// drawn from the current grid (same tile colours as the game).
// The card is exported with canvas.toBlob() as a PNG. Instagram has
// no web share URL, so the PNG is shared as a file via the native
// Web Share sheet where supported, and downloaded + copy-text
// otherwise. No screenshot library, no external service.

(function () {
  var SIZE = 1080;

  // Same palette as style/main.css (.tile-N .tile-inner).
  var TILE_COLORS = {
    2:    { bg: "#eee4da", fg: "#776e65" },
    4:    { bg: "#ede0c8", fg: "#776e65" },
    8:    { bg: "#f2b179", fg: "#f9f6f2" },
    16:   { bg: "#f59563", fg: "#f9f6f2" },
    32:   { bg: "#f67c5f", fg: "#f9f6f2" },
    64:   { bg: "#f65e3b", fg: "#f9f6f2" },
    128:  { bg: "#edcf72", fg: "#f9f6f2" },
    256:  { bg: "#edcc61", fg: "#f9f6f2" },
    512:  { bg: "#edc850", fg: "#f9f6f2" },
    1024: { bg: "#edc53f", fg: "#f9f6f2" },
    2048: { bg: "#edc22e", fg: "#f9f6f2" },
    4096: { bg: "#e8b921", fg: "#f9f6f2" },
    8192: { bg: "#3c3a32", fg: "#f9f6f2" }
    // Nothing past 8192: the game ends at 爆四.
  };

  function tileColor(value) {
    return TILE_COLORS[value] || { bg: "#3c3a32", fg: "#f9f6f2" };
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function fitFont(ctx, text, maxWidth, baseSize, weight) {
    var size = baseSize;
    ctx.font = (weight || "bold") + " " + size + "px 'Clear Sans', 'Helvetica Neue', 'Microsoft Yahei', Arial, sans-serif";
    if (ctx.measureText) {
      while (size > 12 && ctx.measureText(text).width > maxWidth) {
        size -= 2;
        ctx.font = (weight || "bold") + " " + size + "px 'Clear Sans', 'Helvetica Neue', 'Microsoft Yahei', Arial, sans-serif";
      }
    }
    return size;
  }

  function centreText(ctx, text, y, maxWidth, baseSize) {
    fitFont(ctx, text, maxWidth, baseSize, "bold");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, SIZE / 2, y);
  }

  // grid: a Grid object (grid.cells[x][y]) or a plain cells array.
  // opts: { message, score, best, maxTile, tileLabel, highestLabel,
  //         gameUrl, lang }
  // tileLabel(value) -> the tile's name in the current language.
  // Returns the <canvas> (1080x1080), or null if canvas is unavailable.
  function drawShareCard(grid, opts) {
    opts = opts || {};
    if (typeof document === "undefined" || !document.createElement) return null;
    var canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;

    var tileLabel = opts.tileLabel || function (v) { return String(v); };
    var message = opts.message || "CUHK 2048";
    var score = opts.score || 0;
    var best = opts.best || 0;
    var maxTile = opts.maxTile || 2;
    var highestLabel = opts.highestLabel || tileLabel(maxTile);
    var gameUrl = opts.gameUrl || "https://ymll.github.io/2048/";

    // Background
    ctx.fillStyle = "#faf8ef";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Title
    ctx.fillStyle = "#776e65";
    centreText(ctx, "CUHK 2048", 92, 900, 76);

    // Stage message, e.g. 中大歡迎你！ / Welcome to CUHK!
    ctx.fillStyle = "#8f7a66";
    centreText(ctx, message, 190, 940, 64);

    // Score / Best
    ctx.fillStyle = "#776e65";
    centreText(ctx, "Score  " + score + "    ·    Best  " + best, 272, 940, 40);

    // Highest tile reached
    ctx.fillStyle = "#776e65";
    var highestText = (opts.lang === "en" ? "Highest tile: " : "最高方塊： ") + highestLabel;
    centreText(ctx, highestText, 336, 940, 40);

    // Mini-board: 640 x 640, centred, 4x4 cells of 145px + 20px gaps.
    // The board must end above the footer: boardY + boardSize (1028)
    // leaves room for the footer line at y 1056. (The first version
    // used a 720 board, which ran past the bottom of the canvas and
    // clipped the last row under the footer text.)
    var boardX = 220, boardY = 388, boardSize = 640, gap = 20;
    var cell = (boardSize - gap * 3) / 4;
    ctx.fillStyle = "#bbada0";
    roundRect(ctx, boardX, boardY, boardSize, boardSize, 18);
    ctx.fill();

    var cells = grid && grid.cells ? grid.cells : grid;
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 4; col++) {
        var x = boardX + col * (cell + gap);
        var y = boardY + row * (cell + gap);
        var tile = null;
        if (cells && cells[col] && cells[col][row]) tile = cells[col][row];

        if (!tile) {
          ctx.fillStyle = "rgba(238, 228, 218, 0.35)";
          roundRect(ctx, x, y, cell, cell, 10);
          ctx.fill();
          continue;
        }

        var colors = tileColor(tile.value);
        ctx.fillStyle = colors.bg;
        roundRect(ctx, x, y, cell, cell, 10);
        ctx.fill();

        var label = tileLabel(tile.value);
        ctx.fillStyle = colors.fg;
        // Long English labels (e.g. "Morningside") shrink to fit.
        fitFont(ctx, label, cell - 16, 52, "bold");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + cell / 2, y + cell / 2);
      }
    }

    // Footer
    ctx.fillStyle = "#776e65";
    centreText(ctx, gameUrl + "  #CUHK2048", SIZE - 24, 940, 30);

    return canvas;
  }

  // canvas.toBlob() as a PNG. Calls back with a Blob, or null if the
  // browser cannot make one.
  function exportShareCardPNG(canvas, callback) {
    if (!canvas) { callback(null); return; }
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob(function (blob) { callback(blob || null); }, "image/png");
    } else {
      callback(null);
    }
  }

  window.CUHK2048ShareCard = {
    size: SIZE,
    tileColors: TILE_COLORS,
    drawShareCard: drawShareCard,
    exportShareCardPNG: exportShareCardPNG
  };
})();
