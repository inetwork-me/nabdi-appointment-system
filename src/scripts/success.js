/* =====================================================================
   Medical Pointing System — Success summary
   ---------------------------------------------------------------------
   Reflects the saved treatment plan (sessionStorage "mps.plan") in the
   confirmation summary. Falls back to the static values if opened
   directly. No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  function toArabic(n) {
    return String(n).replace(/\d/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩"[d];
    });
  }
  function isEn() {
    return !!(window.i18n && window.i18n.lang === "en");
  }
  function num(n) {
    return isEn() ? String(n) : toArabic(n);
  }
  function money(n) {
    var cur = window.i18n ? window.i18n.t("currency.sar", "ر.س") : "ر.س";
    return isEn() ? cur + " " + n : toArabic(n) + " " + cur;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var store;
    try {
      store = JSON.parse(sessionStorage.getItem("mps.plan") || "null");
    } catch (e) {
      store = null;
    }
    // Fall back to the static demo summary (3 services / 2600) if opened
    // directly without a handoff.
    var count = 3;
    var total = 2600;
    if (store && store.items && store.items.length) {
      count = store.items.length;
      total = store.items.reduce(function (s, it) {
        return s + (Number(it.price) || 0) * (Number(it.qty) || 1);
      }, 0);
    }

    function paint() {
      var countEl = document.querySelector("[data-success-count]");
      var totalEl = document.querySelector("[data-success-total]");
      if (countEl) countEl.textContent = num(count);
      if (totalEl) totalEl.textContent = money(total);
    }

    paint();
    document.addEventListener("i18n:changed", paint);
  });
})();
