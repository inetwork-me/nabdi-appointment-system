/* =====================================================================
   Medical Pointing System — Medical Services Catalog (standalone)
   ---------------------------------------------------------------------
   Patient-agnostic browse page: category filter + search over the
   services table, and a per-service details dialog. No patient context,
   no treatment plan. No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  function norm(s) {
    return (s || "")
      .replace(/[٠-٩]/g, function (d) {
        return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
      })
      .toLowerCase()
      .trim();
  }
  function toArabic(n) {
    return String(n).replace(/\d/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩"[d];
    });
  }
  function isEn() {
    return !!(window.i18n && window.i18n.lang === "en");
  }
  function T(key, fb) {
    return window.i18n ? window.i18n.t(key, fb) : fb;
  }
  function money(n) {
    var cur = T("currency.sar", "ر.س");
    return isEn() ? cur + " " + n : toArabic(n) + " " + cur;
  }
  // Re-price the table for the active language (Arabic keeps its original
  // formatted string; English shows Western numerals + SAR).
  function formatPrices() {
    document.querySelectorAll("td[data-price-num]").forEach(function (td) {
      if (!td.hasAttribute("data-orig"))
        td.setAttribute("data-orig", td.textContent);
      var n = Number(td.getAttribute("data-price-num")) || 0;
      td.textContent = isEn() ? money(n) : td.getAttribute("data-orig");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var rows = Array.prototype.slice.call(
      document.querySelectorAll("[data-service-row]")
    );
    var cats = Array.prototype.slice.call(
      document.querySelectorAll(".category-item")
    );
    var search = document.querySelector("[data-search]");
    var empty = document.querySelector("[data-catalog-empty]");
    var activeCat = "all";

    function apply() {
      var q = norm(search && search.value);
      var visible = 0;
      rows.forEach(function (r) {
        var okCat =
          activeCat === "all" || r.getAttribute("data-category") === activeCat;
        var okQ =
          !q || norm(r.getAttribute("data-search-text")).indexOf(q) !== -1;
        var show = okCat && okQ;
        r.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    }

    cats.forEach(function (b) {
      b.addEventListener("click", function () {
        cats.forEach(function (x) {
          x.classList.remove("is-active");
        });
        b.classList.add("is-active");
        activeCat = b.getAttribute("data-category");
        apply();
      });
    });
    if (search) search.addEventListener("input", apply);

    // Service details dialog
    var dlg = document.querySelector("[data-service-dialog]");
    function fill(sel, val) {
      var el = dlg && dlg.querySelector(sel);
      if (el) el.textContent = val;
    }
    document.querySelectorAll("[data-details]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var r = btn.closest("[data-service-row]");
        if (!dlg || !r) return;
        var priceTd = r.querySelector("td[data-price-num]");
        var priceNum = priceTd ? Number(priceTd.getAttribute("data-price-num")) || 0 : 0;
        fill("[data-dialog-title]", T(r.getAttribute("data-name-key")));
        fill("[data-dialog-desc]", T(r.getAttribute("data-desc-key")));
        fill("[data-dialog-cat]", T(r.getAttribute("data-cat-key")));
        fill("[data-dialog-sessions]", T(r.getAttribute("data-sessions-key")));
        fill("[data-dialog-price]", money(priceNum));
        fill("[data-dialog-status]", T(r.getAttribute("data-status-key")));
        if (typeof dlg.showModal === "function") dlg.showModal();
        else dlg.setAttribute("open", "");
      });
    });
    if (dlg) {
      dlg.querySelectorAll("[data-dialog-close]").forEach(function (c) {
        c.addEventListener("click", function () {
          dlg.close();
        });
      });
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg) dlg.close();
      });
    }

    formatPrices();
    apply();

    // Re-price the table when the language changes (cells with data-i18n are
    // handled by the i18n engine's translateDOM).
    document.addEventListener("i18n:changed", formatPrices);
  });
})();
