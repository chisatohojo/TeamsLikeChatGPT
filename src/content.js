(function () {
  "use strict";

  if (window.__tlcgptWorkThemeLoaded) {
    return;
  }

  window.__tlcgptWorkThemeLoaded = true;

  const ROOT_CLASS = "tlcgpt-work-theme";
  const STYLE_ID = "tlcgpt-work-theme-style";
  const NAV_ID = "tlcgpt-work-nav";
  const STYLE_PATH = "src/teams.css";
  const INJECTED_SELECTORS = [
    ".tlcgpt-header-search",
    ".tlcgpt-message-meta",
    ".tlcgpt-composer-toolbar"
  ];
  const DECORATION_CLASSES = [
    "tlcgpt-app-header",
    "tlcgpt-main-surface",
    "tlcgpt-message-card",
    "tlcgpt-message-content",
    "tlcgpt-message-user",
    "tlcgpt-message-assistant",
    "tlcgpt-input-shell",
    "tlcgpt-input-control"
  ];

  let enabled = false;
  let observer = null;
  let decorationFrame = 0;

  function isExtensionContextAvailable() {
    return typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
  }

  function getStyleUrl() {
    if (isExtensionContextAvailable()) {
      return chrome.runtime.getURL(STYLE_PATH);
    }

    return STYLE_PATH;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = getStyleUrl();

    (document.head || document.documentElement).appendChild(link);
  }

  function removeStyle() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function createNavItem(label, icon, isActive) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "tlcgpt-work-nav__item";
    item.setAttribute("aria-label", label);

    if (isActive) {
      item.classList.add("is-active");
      item.setAttribute("aria-current", "page");
    }

    const iconNode = document.createElement("span");
    iconNode.className = "tlcgpt-work-nav__icon";
    iconNode.setAttribute("aria-hidden", "true");
    iconNode.textContent = icon;

    const labelNode = document.createElement("span");
    labelNode.className = "tlcgpt-work-nav__label";
    labelNode.textContent = label;

    item.append(iconNode, labelNode);
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".tlcgpt-work-nav__item")
        .forEach((button) => {
          button.classList.remove("is-active");
          button.removeAttribute("aria-current");
        });

      item.classList.add("is-active");
      item.setAttribute("aria-current", "page");
    });

    return item;
  }

  function ensureNav() {
    if (!document.body || document.getElementById(NAV_ID)) {
      return;
    }

    const nav = document.createElement("nav");
    nav.id = NAV_ID;
    nav.className = "tlcgpt-work-nav";
    nav.setAttribute("aria-label", "Work chat theme navigation");

    const brand = document.createElement("div");
    brand.className = "tlcgpt-work-nav__brand";
    brand.title = "Work Chat Theme";
    brand.textContent = "W";

    const list = document.createElement("div");
    list.className = "tlcgpt-work-nav__list";
    list.append(
      createNavItem("Activity", "A", false),
      createNavItem("Chat", "C", true),
      createNavItem("Meet", "M", false),
      createNavItem("Files", "F", false)
    );

    nav.append(brand, list);
    document.body.prepend(nav);
  }

  function removeNav() {
    document.getElementById(NAV_ID)?.remove();
  }

  function isThemeElement(element) {
    return Boolean(element?.closest?.(`#${NAV_ID}`));
  }

  function addClasses(element, classNames) {
    if (!element || isThemeElement(element)) {
      return;
    }

    element.classList.add(...classNames);
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function findPrimaryHeader() {
    const headers = Array.from(
      document.querySelectorAll('header, [role="banner"]')
    );

    return headers.find((header) => !isThemeElement(header));
  }

  function getChatTitle(header) {
    const documentTitle = document.title
      .replace(/\s*[-|]\s*ChatGPT.*$/i, "")
      .replace(/^ChatGPT\s*[-|]\s*/i, "")
      .trim();

    if (documentTitle && !/^chatgpt$/i.test(documentTitle)) {
      return documentTitle;
    }

    const blockedWords = /share|search|menu|profile|new chat|\u5171\u6709|\u691c\u7d22|\u30e1\u30cb\u30e5\u30fc|\u65b0\u3057\u3044/i;
    const candidates = Array.from(
      header.querySelectorAll('h1, [data-testid*="title"], [aria-label]')
    );

    for (const candidate of candidates) {
      const text = (candidate.textContent || candidate.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim();

      if (text && text.length <= 64 && !blockedWords.test(text)) {
        return text;
      }
    }

    return "Current chat";
  }

  function ensureHeaderDecoration() {
    const header = findPrimaryHeader();

    if (!header) {
      return;
    }

    addClasses(header, ["tlcgpt-app-header"]);
    header.dataset.tlcgptChatTitle = getChatTitle(header);

    if (header.querySelector(".tlcgpt-header-search")) {
      return;
    }

    const search = document.createElement("div");
    search.className = "tlcgpt-header-search";
    search.setAttribute("aria-hidden", "true");

    const icon = createTextElement("span", "tlcgpt-header-search__icon", "/");
    const label = createTextElement(
      "span",
      "tlcgpt-header-search__label",
      "Search work chats"
    );

    search.append(icon, label);
    header.append(search);
  }

  function decorateMainSurface() {
    document
      .querySelectorAll('main, [role="main"], [data-testid*="conversation"]')
      .forEach((surface) => addClasses(surface, ["tlcgpt-main-surface"]));
  }

  function findUserMessageCardTarget(node) {
    return (
      node.querySelector(
        [
          '[class*="bg-token-message"]',
          '[class*="bg-token-user"]',
          '[class*="message-surface"]',
          '[class*="whitespace-pre-wrap"]',
          '[class*="break-words"]'
        ].join(",")
      ) ||
      node.firstElementChild ||
      node
    );
  }

  function ensureMessageMeta(cardTarget, role) {
    if (!cardTarget || cardTarget.querySelector(":scope > .tlcgpt-message-meta")) {
      return;
    }

    const isUser = role === "user";
    const meta = document.createElement("div");
    meta.className = "tlcgpt-message-meta";
    meta.setAttribute("aria-hidden", "true");

    const avatar = createTextElement(
      "span",
      "tlcgpt-message-avatar",
      isUser ? "Y" : "AI"
    );
    const label = createTextElement(
      "span",
      "tlcgpt-message-label",
      isUser ? "You" : "Assistant"
    );
    const time = createTextElement(
      "span",
      "tlcgpt-message-time",
      isUser ? "09:42" : "09:41"
    );

    meta.append(avatar, label, time);
    cardTarget.prepend(meta);
  }

  function decorateMessages() {
    const messageNodes = document.querySelectorAll(
      '[data-message-author-role="user"], [data-message-author-role="assistant"]'
    );

    messageNodes.forEach((node) => {
      const role = node.getAttribute("data-message-author-role");
      const roleClass =
        role === "user" ? "tlcgpt-message-user" : "tlcgpt-message-assistant";
      const cardTarget =
        role === "user" ? findUserMessageCardTarget(node) : node;

      addClasses(node, ["tlcgpt-message-content"]);
      addClasses(cardTarget, [
        "tlcgpt-message-card",
        roleClass
      ]);
      node.dataset.tlcgptMessageRole = role;
      cardTarget.dataset.tlcgptMessageRole = role;

      ensureMessageMeta(cardTarget, role);
    });
  }

  function isLikelyComposerInput(input) {
    if (input.closest?.(`#${NAV_ID}`)) {
      return false;
    }

    const ariaLabel = (input.getAttribute("aria-label") || "").toLowerCase();
    const placeholder = (input.getAttribute("placeholder") || "").toLowerCase();
    const dataTestId = (input.getAttribute("data-testid") || "").toLowerCase();
    const role = (input.getAttribute("role") || "").toLowerCase();

    return (
      input.closest("form") ||
      role === "textbox" ||
      ariaLabel.includes("message") ||
      ariaLabel.includes("prompt") ||
      placeholder.includes("message") ||
      placeholder.includes("prompt") ||
      dataTestId.includes("composer") ||
      dataTestId.includes("prompt")
    );
  }

  function findComposerShell(input) {
    const form = input.closest("form");

    if (form) {
      return form;
    }

    let current = input.parentElement;

    while (current && current !== document.body) {
      const hasInput = current.querySelector(
        'textarea, [contenteditable="true"], [role="textbox"]'
      );
      const hasControls = current.querySelector('button, [role="button"]');

      if (hasInput && hasControls) {
        return current;
      }

      current = current.parentElement;
    }

    const namedComposer = input.closest(
      '[data-testid*="composer"], [class*="composer"]'
    );

    return namedComposer && namedComposer !== input
      ? namedComposer
      : form || input.parentElement;
  }

  function ensureComposerToolbar(shell) {
    if (!shell || shell.querySelector(".tlcgpt-composer-toolbar")) {
      return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "tlcgpt-composer-toolbar";
    toolbar.setAttribute("aria-hidden", "true");

    [
      ["+", ""],
      ["A", ""],
      [":)", ""],
      ["Attach", ""],
      ["Send", "tlcgpt-composer-tool--send"]
    ].forEach(([label, modifier]) => {
      const tool = createTextElement(
        "span",
        `tlcgpt-composer-tool ${modifier}`.trim(),
        label
      );
      toolbar.append(tool);
    });

    shell.dataset.tlcgptComposer = "true";
    shell.append(toolbar);
  }

  function decorateComposer() {
    document
      .querySelectorAll('textarea, [contenteditable="true"], [role="textbox"]')
      .forEach((input) => {
        if (!isLikelyComposerInput(input)) {
          return;
        }

        const shell = findComposerShell(input);

        addClasses(input, ["tlcgpt-input-control"]);
        addClasses(shell, ["tlcgpt-input-shell"]);
        ensureComposerToolbar(shell);
      });
  }

  function decoratePage() {
    if (!enabled || !document.documentElement.classList.contains(ROOT_CLASS)) {
      return;
    }

    ensureNav();
    ensureHeaderDecoration();
    decorateMainSurface();
    decorateMessages();
    decorateComposer();
  }

  function scheduleDecorate() {
    if (decorationFrame) {
      return;
    }

    decorationFrame = window.requestAnimationFrame(() => {
      decorationFrame = 0;
      decoratePage();
    });
  }

  function cleanupDecorations() {
    if (decorationFrame) {
      window.cancelAnimationFrame(decorationFrame);
      decorationFrame = 0;
    }

    document
      .querySelectorAll(INJECTED_SELECTORS.join(","))
      .forEach((element) => element.remove());

    document
      .querySelectorAll(DECORATION_CLASSES.map((name) => `.${name}`).join(","))
      .forEach((element) => {
        element.classList.remove(...DECORATION_CLASSES);
        delete element.dataset.tlcgptMessageRole;
        delete element.dataset.tlcgptChatTitle;
        delete element.dataset.tlcgptComposer;
      });
  }

  function startObserver() {
    if (observer || !document.body) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (
        enabled &&
        mutations.some((mutation) => mutation.addedNodes.length > 0)
      ) {
        scheduleDecorate();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function stopObserver() {
    observer?.disconnect();
    observer = null;
  }

  function enableTheme() {
    enabled = true;
    injectStyle();

    document.documentElement.classList.add(ROOT_CLASS);
    document.documentElement.dataset.tlcgptTheme = "work-chat";

    if (document.body) {
      document.body.dataset.tlcgptTheme = "work-chat";
    }

    ensureNav();
    decoratePage();
    startObserver();
  }

  function disableTheme() {
    enabled = false;
    stopObserver();
    cleanupDecorations();

    document.documentElement.classList.remove(ROOT_CLASS);
    delete document.documentElement.dataset.tlcgptTheme;

    if (document.body) {
      delete document.body.dataset.tlcgptTheme;
    }

    removeNav();
    removeStyle();
  }

  function setTheme(nextEnabled) {
    if (nextEnabled) {
      enableTheme();
      return;
    }

    disableTheme();
  }

  function installRouteHooks() {
    if (window.__tlcgptRouteHooksInstalled) {
      return;
    }

    window.__tlcgptRouteHooksInstalled = true;

    ["pushState", "replaceState"].forEach((methodName) => {
      const original = history[methodName];

      history[methodName] = function patchedHistoryMethod() {
        const result = original.apply(this, arguments);
        window.dispatchEvent(new Event("tlcgpt:locationchange"));
        return result;
      };
    });

    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("tlcgpt:locationchange"));
    });

    window.addEventListener("tlcgpt:locationchange", () => {
      window.setTimeout(scheduleDecorate, 80);
    });
  }

  function installMessageListener() {
    if (!isExtensionContextAvailable() || !chrome.runtime.onMessage) {
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || message.type !== "TLCGPT_THEME_SET") {
        return false;
      }

      setTheme(Boolean(message.enabled));
      sendResponse({ ok: true, enabled });
      return false;
    });
  }

  function initWhenReady(callback) {
    if (document.body) {
      callback();
      return;
    }

    window.addEventListener("DOMContentLoaded", callback, { once: true });
  }

  initWhenReady(async () => {
    installRouteHooks();
    installMessageListener();

    const storage = globalThis.TLCGPTStorage;
    const initialEnabled = storage
      ? await storage.getEnabled()
      : true;

    setTheme(initialEnabled);

    storage?.onEnabledChange((nextEnabled) => {
      setTheme(nextEnabled);
    });
  });
})();
