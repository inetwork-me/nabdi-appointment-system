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
  function T(key, fb) {
    return window.i18n ? window.i18n.t(key, fb) : fb != null ? fb : key;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var store;
    try {
      store = JSON.parse(sessionStorage.getItem("mps.plan") || "null");
    } catch (e) {
      store = null;
    }

    // The free-follow-up branch hands over a one-shot visit flag. Read it,
    // then clear it so the treatment-services path is unaffected next time.
    var visit = null;
    try {
      visit = JSON.parse(sessionStorage.getItem("mps.visit") || "null");
      sessionStorage.removeItem("mps.visit");
    } catch (e) {
      visit = null;
    }
    var isFollowup = !!(visit && visit.kind === "followup");

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
    // Any manually added services trigger the Nabd-review informational note.
    var hasManual = !!(
      store &&
      store.items &&
      store.items.some(function (it) {
        return it.manual;
      })
    );

    function paint() {
      if (isFollowup) {
        var titleEl = document.querySelector("[data-success-title]");
        var descEl = document.querySelector("[data-success-desc]");
        var metaEl = document.querySelector("[data-success-meta]");
        if (titleEl)
          titleEl.textContent = T(
            "success.followupTitle",
            "تم حفظ الموعد وإرساله بنجاح"
          );
        if (descEl)
          descEl.textContent = T(
            "success.followupDesc",
            "تم جدولة موعد متابعة مجاني للمريض خلال ١٤ يومًا. سيصله إشعار بموعد المتابعة عبر تطبيق المريض دون أي رسوم."
          );
        if (metaEl)
          metaEl.textContent =
            T("nextVisit.opt1.title", "استشارة متابعة مجانية") +
            " · " +
            T("followUp.within14", "خلال ١٤ يومًا");
        return;
      }
      var countEl = document.querySelector("[data-success-count]");
      var totalEl = document.querySelector("[data-success-total]");
      if (countEl) countEl.textContent = num(count);
      if (totalEl) totalEl.textContent = money(total);
      var manualEl = document.querySelector("[data-success-manual]");
      if (manualEl) manualEl.hidden = !hasManual;
    }

    paint();
    document.addEventListener("i18n:changed", paint);
  });
})();
