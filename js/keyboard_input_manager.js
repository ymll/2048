function KeyboardInputManager() {
  this.events = {};

  // Set by the touch handler when a swipe that started on the win /
  // game-over overlay ends on a button: the browser still generates
  // a click there, and the button handler must ignore that one click.
  this._suppressClick = false;

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.bindButton = function (selector, eventName) {
  var self = this;
  var el = document.querySelector(selector);
  if (!el) return;
  // Click only. A tap on a button already fires click after touchend,
  // so a touchend listener as well would fire the action twice
  // (two restarts, two share sheets).
  el.addEventListener("click", function (event) {
    // A swipe that started on the overlay and ended on this button
    // is not a tap: the touch handler flagged it, so ignore the
    // click the browser generates for it.
    if (self._suppressClick) {
      self._suppressClick = false;
      return;
    }
    if (event) event.preventDefault();
    self.emit(eventName);
  });
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // vim keybindings
    76: 1,
    74: 2,
    72: 3,
    87: 0, // W
    68: 1, // D
    83: 2, // S
    65: 3  // A
  };

  // Game shortcuts must not steal keys from focused controls.
  // Space is how a focused button is activated: without this
  // check, Space on the restart icon, the "?" icon, the EN toggle
  // or the FAQ Close button silently restarts the game instead —
  // no confirmation, and the button itself never fires. Arrow
  // keys must not move the board while the FAQ dialog is open,
  // either.
  function keyboardTargetIsControl(event) {
    var target = event.target;
    if (!target) return false;
    var tag = (target.tagName || "").toLowerCase();
    if (tag === "button" || tag === "a" || tag === "input" ||
        tag === "select" || tag === "textarea" ||
        target.isContentEditable) {
      return true;
    }
    if (typeof target.closest === "function" &&
        target.closest("dialog")) {
      return true;
    }
    return false;
  }

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers && !keyboardTargetIsControl(event)) {
      if (mapped !== undefined) {
        event.preventDefault();
        self.emit("move", mapped);
      }

      if (event.which === 32) self.restart.bind(self)(event);
    }
  });

  // Overlay buttons. Each binding guards for a missing element, so a
  // missing button can never break the game the way the old code did
  // (it assumed .retry-button always existed).
  // .retry-button = Start over / Try again
  // .keep-playing-button = Continue — Stage 1 (2048) only; the button
  //   is hidden by CSS on the final (8192) overlay, and GameManager
  //   also ignores keepPlaying once 8192 is reached.
  // .share-button = share the PNG card (native share sheet with
  //   the image, else download the PNG + copy the text)
  // (The old Threads link and Copy button were removed: the share
  //   sheet on mobile already offers Threads, and sharing already
  //   copies the text in its desktop fallback.)
  this.bindButton(".retry-button", "restart");
  this.bindButton(".keep-playing-button", "keepPlaying");
  this.bindButton(".share-button", "shareInstagram");

  // Listen to swipe events
  var touchStartClientX, touchStartClientY;
  var gameContainer = document.getElementsByClassName("game-container")[0];

  // Touches on the win / game-over overlay (Continue, Start over,
  // Share screenshot) must keep their normal tap behaviour:
  // preventDefault() on touchstart stops the browser from ever
  // firing a click. (Kept from the old Threads-link fix: the overlay
  // used to hold a plain link with no touch handler, and taps on it
  // did nothing on phones.)
  // Swipes on the board itself still get preventDefault() so the
  // page does not scroll while playing.
  function touchIsOnOverlay(event) {
    var target = event.target;
    if (!target || typeof target.closest !== "function") return false;
    return !!target.closest(".game-message");
  }

  if (gameContainer) {
    gameContainer.addEventListener("touchstart", function (event) {
      if (event.touches.length > 1) return;

      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
      if (!touchIsOnOverlay(event)) event.preventDefault();
    });

    gameContainer.addEventListener("touchmove", function (event) {
      if (!touchIsOnOverlay(event)) event.preventDefault();
    });

    gameContainer.addEventListener("touchend", function (event) {
      if (event.touches.length > 0) return;

      // Taps on the overlay (Continue / Start over / Share) must
      // not also swipe the board: the button handler already ran,
      // and a finger that drifted >10px would otherwise fire an
      // extra move on the resumed or fresh board (and save it).
      if (touchIsOnOverlay(event)) {
        // ...but a swipe that STARTED on the overlay is worse than
        // an extra move: the browser still generates a click where
        // the finger lifts, so a swipe ending on "Start over"
        // restarts the game with no confirmation — the board the
        // player just won is gone. Flag it so the button handler
        // ignores that one click. A plain tap (no drift) is not
        // flagged, so the buttons still work.
        var odx = event.changedTouches[0].clientX - touchStartClientX;
        var ody = event.changedTouches[0].clientY - touchStartClientY;
        if (Math.max(Math.abs(odx), Math.abs(ody)) > 10) {
          self._suppressClick = true;
          // If no click follows (it normally does, right after
          // touchend), clear the flag so the next real tap works.
          window.setTimeout(function () { self._suppressClick = false; }, 500);
        }
        return;
      }

      var dx = event.changedTouches[0].clientX - touchStartClientX;
      var absDx = Math.abs(dx);

      var dy = event.changedTouches[0].clientY - touchStartClientY;
      var absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 10) {
        // (right : left) : (down : up)
        self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
    });
  }
};

KeyboardInputManager.prototype.restart = function (event) {
  if (event) event.preventDefault();
  this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function (event) {
  if (event) event.preventDefault();
  this.emit("keepPlaying");
};
