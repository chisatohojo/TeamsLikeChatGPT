(function () {
  "use strict";

  const STORAGE_KEY = "tlcgptThemeEnabled";
  const DEFAULT_ENABLED = true;

  function hasStorageApi() {
    return typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync;
  }

  function getEnabled() {
    return new Promise((resolve) => {
      if (!hasStorageApi()) {
        resolve(DEFAULT_ENABLED);
        return;
      }

      chrome.storage.sync.get({ [STORAGE_KEY]: DEFAULT_ENABLED }, (result) => {
        if (chrome.runtime.lastError) {
          resolve(DEFAULT_ENABLED);
          return;
        }

        resolve(Boolean(result[STORAGE_KEY]));
      });
    });
  }

  function setEnabled(enabled) {
    return new Promise((resolve, reject) => {
      if (!hasStorageApi()) {
        resolve();
        return;
      }

      chrome.storage.sync.set({ [STORAGE_KEY]: Boolean(enabled) }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve();
      });
    });
  }

  function onEnabledChange(callback) {
    if (
      typeof chrome === "undefined" ||
      !chrome.storage ||
      !chrome.storage.onChanged
    ) {
      return function noop() {};
    }

    const listener = (changes, areaName) => {
      if (areaName !== "sync" || !changes[STORAGE_KEY]) {
        return;
      }

      callback(Boolean(changes[STORAGE_KEY].newValue));
    };

    chrome.storage.onChanged.addListener(listener);

    return () => chrome.storage.onChanged.removeListener(listener);
  }

  globalThis.TLCGPTStorage = {
    DEFAULT_ENABLED,
    STORAGE_KEY,
    getEnabled,
    onEnabledChange,
    setEnabled
  };
})();
