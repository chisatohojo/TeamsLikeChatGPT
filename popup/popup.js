(function () {
  "use strict";

  const toggle = document.getElementById("themeToggle");
  const stateLabel = document.getElementById("stateLabel");

  function setLoading(isLoading) {
    toggle.disabled = isLoading;
    document.body.classList.toggle("is-loading", isLoading);
  }

  function render(enabled) {
    toggle.checked = enabled;
    stateLabel.textContent = enabled ? "Enabled" : "Disabled";
  }

  function queryActiveTab() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.tabs) {
        resolve(null);
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        resolve(tabs[0] || null);
      });
    });
  }

  function notifyActiveTab(enabled) {
    return queryActiveTab().then((tab) => {
      if (!tab || !tab.id || typeof chrome === "undefined" || !chrome.tabs) {
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { type: "TLCGPT_THEME_SET", enabled },
        () => {
          chrome.runtime.lastError;
        }
      );
    });
  }

  async function init() {
    setLoading(true);

    try {
      const enabled = await globalThis.TLCGPTStorage.getEnabled();
      render(enabled);
    } finally {
      setLoading(false);
    }
  }

  toggle.addEventListener("change", async () => {
    const enabled = toggle.checked;
    setLoading(true);

    try {
      await globalThis.TLCGPTStorage.setEnabled(enabled);
      render(enabled);
      await notifyActiveTab(enabled);
    } catch (error) {
      const currentEnabled = await globalThis.TLCGPTStorage.getEnabled();
      render(currentEnabled);
      console.warn("Failed to update Work Chat Theme state.", error);
    } finally {
      setLoading(false);
    }
  });

  init();
})();
