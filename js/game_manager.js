function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
  this.inputManager.on("share", this.share.bind(this));
  this.inputManager.on("shareInstagram", this.shareInstagram.bind(this));

  // Auto-save: resume a saved game if there is one, otherwise start
  // a new game. A corrupt / missing save just starts a new game.
  if (!this.restoreSavedGame()) {
    this.setup();
  }
}

// Save the current game, if the save helper is loaded.
GameManager.prototype.saveGame = function () {
  if (typeof window !== "undefined" && window.CUHK2048Save) {
    window.CUHK2048Save.saveGame(this);
  }
};

// Restore a saved game (board, score, win / game-over state).
// Returns true if a valid save was restored, false otherwise.
GameManager.prototype.restoreSavedGame = function () {
  if (typeof window === "undefined" || !window.CUHK2048Save) return false;
  var save = window.CUHK2048Save.loadGame(this.size);
  if (!save) return false;

  this.grid = new Grid(this.size);
  this.score = save.score;
  this.over = save.over;
  this.won2048 = save.won2048;
  this.won8192 = save.won8192;
  this.continued2048 = save.continued2048;
  this.maxTile = save.maxTile;

  var self = this;
  save.tiles.forEach(function (t) {
    var tile = new Tile({ x: t.x, y: t.y }, t.value);
    self.grid.insertTile(tile);
    if (t.value > self.maxTile) self.maxTile = t.value;
  });

  this.actuate();
  return true;
};

// Restart the game
GameManager.prototype.restart = function () {
  // Start over clears the save, so a reload does not bring the
  // old game back.
  if (typeof window !== "undefined" && window.CUHK2048Save) {
    window.CUHK2048Save.clearGame();
  }
  this.maxTile = 2;
  this.actuator.continue();
  this.setup();
};

// Keep playing after reaching 2048 (中大) — Stage 1 only.
// There is no Continue after 8192 (爆四): that is the final win, and
// keepPlaying is never offered there, so this is only ever called
// while the Stage 1 overlay is showing.
GameManager.prototype.keepPlaying = function () {
  if (!this.won2048 || this.won8192) return;
  this.continued2048 = true;
  this.actuator.continue();
  // Save, so a reload does not show the Stage 1 pause again.
  this.saveGame();
};

// Share the current score. These do not resume the game: the
// win / game-over overlay stays up after sharing.
GameManager.prototype.share = function () {
  this.actuator.shareScore(this.score, this.maxTile);
};

GameManager.prototype.shareInstagram = function () {
  this.actuator.shareToInstagram(this.score, this.maxTile);
};

GameManager.prototype.isGameTerminated = function () {
  // Paused at Stage 1 (2048) until the player chooses Continue or
  // Start over; paused for good at Stage 2 (8192); paused on game over.
  if (this.over) return true;
  if (this.won8192) return true;
  if (this.won2048 && !this.continued2048) return true;
  return false;
};

// Which celebration, if any, should the overlay show?
// "cuhk" = reached 2048, "final" = reached 8192, null = neither.
GameManager.prototype.currentStage = function () {
  if (this.won8192) return "final";
  if (this.won2048 && !this.continued2048) return "cuhk";
  return null;
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid        = new Grid(this.size);

  this.score       = 0;
  this.over        = false;
  this.won2048     = false;
  this.won8192     = false;
  this.continued2048 = false;
  this.maxTile     = 2;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();

  // Save the fresh game, so closing the tab before the first move
  // still resumes it.
  this.saveGame();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won2048 || this.won8192,
    won2048:    this.won2048,
    won8192:    this.won8192,
    stage:      this.currentStage(),
    maxTile:    this.maxTile,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated()
  });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          if (merged.value > self.maxTile) {
            self.maxTile = merged.value;
          }

          // Stage 1: the 2048 tile (中大)
          if (merged.value === 2048) self.won2048 = true;
          // Stage 2: the 8192 tile (爆四) — the final win. No tile
          // past 8192 is ever created as a goal; the game ends here.
          if (merged.value === 8192) self.won8192 = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();

    // Auto-save after every move, so pausing and coming back
    // resumes exactly here.
    this.saveGame();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
