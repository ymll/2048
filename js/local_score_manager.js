window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalScoreManager() {
  this.key     = "bestScore";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalScoreManager.prototype.localStorageSupported = function () {
  var testKey = "test";
  var storage = window.localStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

LocalScoreManager.prototype.get = function () {
  // Always a number: getItem() returns a string, and callers compare
  // it with the (numeric) score — a string best was silently failing
  // the typeof "number" check in HTMLActuator, so the share card
  // showed Best 0.
  return parseInt(this.storage.getItem(this.key), 10) || 0;
};

LocalScoreManager.prototype.set = function (score) {
  this.storage.setItem(this.key, score);
};

