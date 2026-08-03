/* =====================================================================
   Medical Pointing System — Internationalization (i18n) engine
   ---------------------------------------------------------------------
   One shared engine, no duplicate pages. Every UI string lives in
   translations/{ar,en}.json and is referenced by key. Elements are
   tagged with:
     data-i18n="key"              → textContent
     data-i18n-placeholder="key"  → placeholder attribute
     data-i18n-aria-label="key"   → aria-label attribute
     data-i18n-title="key"        → title attribute
   JS-generated strings use window.i18n.t("key").

   Direction/lang: Arabic = rtl/ar (default), English = ltr/en. The
   selected language persists in localStorage and is restored on load.
   ===================================================================== */
(function () {
  "use strict";

  var LS_KEY = "mps.lang";
  var DEFAULT = "ar";
  var META = { ar: { dir: "rtl" }, en: { dir: "ltr" } };

  var dict = {};
  var current = DEFAULT;

  function read() {
    try {
      var l = localStorage.getItem(LS_KEY);
      if (l && META[l]) return l;
    } catch (e) {
      /* storage unavailable */
    }
    return DEFAULT;
  }

  function applyDir(lang) {
    var el = document.documentElement;
    el.setAttribute("lang", lang);
    el.setAttribute("dir", META[lang].dir);
  }

  // Set direction/lang synchronously (this script loads in <head>) so the
  // layout renders in the correct direction with no flash.
  current = read();
  applyDir(current);

  function t(key, fallback) {
    if (dict[key] != null) return dict[key];
    return fallback != null ? fallback : key;
  }

  function translateDOM(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-placeholder")];
      if (v != null) el.setAttribute("placeholder", v);
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-aria-label")];
      if (v != null) el.setAttribute("aria-label", v);
    });
    root.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-title")];
      if (v != null) el.setAttribute("title", v);
    });
  }

  function updateSwitchers() {
    document.querySelectorAll("[data-lang-select]").forEach(function (sel) {
      if (sel.value !== current) sel.value = current;
    });
  }

  function load(lang) {
    return fetch("../../translations/" + lang + ".json", { cache: "no-cache" })
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return {};
      });
  }

  function setLang(lang) {
    if (!META[lang]) lang = DEFAULT;
    current = lang;
    try {
      localStorage.setItem(LS_KEY, lang);
    } catch (e) {
      /* ignore */
    }
    applyDir(lang);
    return load(lang).then(function (d) {
      dict = d || {};
      translateDOM(document);
      updateSwitchers();
      document.dispatchEvent(
        new CustomEvent("i18n:changed", { detail: { lang: lang } })
      );
    });
  }

  window.i18n = {
    t: t,
    setLang: setLang,
    translateDOM: translateDOM,
    get lang() {
      return current;
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    // Language switcher (delegated — the switcher is injected by layout.js)
    document.addEventListener("change", function (e) {
      var sel = e.target.closest && e.target.closest("[data-lang-select]");
      if (sel) setLang(sel.value);
    });
    // Initial dictionary load + translate. The fetch defers to a microtask,
    // so layout.js has already built the shell by the time this runs.
    setLang(current);
  });
})();
