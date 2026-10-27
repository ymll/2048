// CUHK 2048 — auto-save: pause and come back later.
// After every move (and after Continue) the board, score and win /
// game-over state are saved to localStorage ("cuhk2048-save"). On
// load, a valid save is restored instead of starting a new game.
// Same limits as the Best score: per-device / per-browser only, no
// server copy, and clearing site data wipes it. Restart / Start over
// clears the save, so a new game starts fresh.
// A corrupt or out-of-date save is ignored and a new game starts.

(function () {
  var SAVE_KEY = "cuhk2048-save";
  var SAVE_VERSION = 1;

  function storage() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) {
      // Storage unavailable (e.g. private mode): no saving.
    }
    return null;
  }

  function isPowerOfTwo(n) {
    return n >= 2 && n <= 8192 && (n & (n - 1)) === 0;
  }

  // manager -> plain save object, or null if it cannot be saved.
  function serialize(manager) {
    if (!manager || !manager.grid || !manager.grid.cells) return null;
    var tiles = [];
    manager.grid.eachCell(function (x, y, tile) {
      if (tile) tiles.push({ x: x, y: y, value: tile.value });
    });
    if (!tiles.length) return null;
    return {
      v: SAVE_VERSION,
      size: manager.size,
      score: manager.score || 0,
      over: !!manager.over,
      won2048: !!manager.won2048,
      won8192: !!manager.won8192,
      continued2048: !!manager.continued2048,
      maxTile: manager.maxTile || 2,
      tiles: tiles
    };
  }

  function saveGame(manager) {
    var store = storage();
    if (!store) return;
    try {
      var data = serialize(manager);
      if (data) store.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      // Quota / private mode: the game keeps working, just unsaved.
    }
  }

  // Returns a validated save object, or null if there is none / it
  // is corrupt / from another version / the wrong board size.
  function loadGame(size) {
    var store = storage();
    if (!store) return null;
    var raw;
    try {
      raw = store.getItem(SAVE_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    if (!data || data.v !== SAVE_VERSION) return null;
    if (data.size !== size) return null;
    if (typeof data.score !== "number" || data.score < 0) return null;
    if (!Array.isArray(data.tiles) || !data.tiles.length ||
        data.tiles.length > size * size) return null;
    var seen = {};
    for (var i = 0; i < data.tiles.length; i++) {
      var t = data.tiles[i];
      if (!t || typeof t.x !== "number" || typeof t.y !== "number" ||
          t.x < 0 || t.x >= size || t.y < 0 || t.y >= size ||
          !isPowerOfTwo(t.value)) return null;
      var key = t.x + "," + t.y;
      if (seen[key]) return null; // two tiles in one cell
      seen[key] = true;
    }
    return data;
  }

  function clearGame() {
    var store = storage();
    if (!store) return;
    try {
      store.removeItem(SAVE_KEY);
    } catch (e) {
      // Ignore: nothing to clear.
    }
  }

  window.CUHK2048Save = {
    saveKey: SAVE_KEY,
    saveGame: saveGame,
    loadGame: loadGame,
    clearGame: clearGame
  };
})();
