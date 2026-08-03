/* =====================================================================
   Medical Pointing System — Review Treatment Plan
   ---------------------------------------------------------------------
   Renders the treatment plan handed over from the services catalog
   (sessionStorage "mps.plan"), or a sensible default if opened directly.
   Removing a service live-updates the count and total; the (possibly
   edited) plan is written back so the success screen reflects it.
   Services carry i18n keys (nameKey/catKey) so the table re-renders in
   the active language. No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  var KEY = "mps.plan";
  var TRASH =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';

  // Fallback plan when the page is opened directly (no handoff).
  var DEFAULT = [
    { id: "root-canal", nameKey: "catalog.svc.rootCanal", catKey: "cat.endodontics", price: 900, qty: 1 },
    { id: "crown", nameKey: "catalog.svc.crown", catKey: "cat.prosthoShort", price: 1500, qty: 1 },
    { id: "cleaning", nameKey: "catalog.svc.cleaning", catKey: "cat.generalShort", price: 200, qty: 1 },
  ];

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
  function num(n) {
    return isEn() ? String(n) : toArabic(n);
  }
  function money(n) {
    var cur = T("currency.sar", "ر.س");
    return isEn() ? cur + " " + n : toArabic(n) + " " + cur;
  }

  // Older handoffs may carry resolved names (name/cat) instead of keys;
  // keep them working by falling back to the literal string.
  function nameOf(it) {
    return it.nameKey ? T(it.nameKey) : it.name || "";
  }
  function catOf(it) {
    return it.catKey ? T(it.catKey) : it.cat || "";
  }

  function rowHtml(it) {
    var line = it.price * it.qty;
    return (
      '<tr data-service-row data-id="' + it.id +
      '" data-name-key="' + (it.nameKey || "") + '" data-cat-key="' + (it.catKey || "") +
      '" data-price="' + it.price + '" data-qty="' + it.qty + '">' +
      "<td>" + nameOf(it) + "</td>" +
      '<td><span class="badge badge--muted">' + catOf(it) + "</span></td>" +
      '<td class="table__num">' + num(it.qty) + "</td>" +
      '<td class="table__num">' + money(it.price) + "</td>" +
      '<td class="table__num">' + money(line) + "</td>" +
      '<td class="table__action"><button class="icon-btn icon-btn--danger" type="button" data-remove aria-label="' +
      T("aria.removeService", "إزالة الخدمة") + '">' +
      TRASH + "</button></td></tr>"
    );
  }

  function readStore() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var tbody = document.querySelector("[data-plan-rows]");
    var notesEl = document.querySelector("#notes");
    var store = readStore();
    var items = store && store.items && store.items.length ? store.items.slice() : DEFAULT.slice();

    function serialize() {
      try {
        sessionStorage.setItem(
          KEY,
          JSON.stringify({ items: items, notes: notesEl ? notesEl.value : "" })
        );
      } catch (e) {
        /* storage unavailable — non-fatal */
      }
    }

    function recalc() {
      var total = items.reduce(function (s, it) {
        return s + it.price * it.qty;
      }, 0);
      var countEl = document.querySelector("[data-service-count]");
      var totalEl = document.querySelector("[data-total-amount]");
      if (countEl) countEl.textContent = num(items.length);
      if (totalEl) totalEl.textContent = money(total);

      var empty = document.querySelector("[data-empty]");
      var table = document.querySelector("[data-services-table]");
      var submit = document.querySelector("[data-submit]");
      var isEmpty = items.length === 0;
      if (empty) empty.hidden = !isEmpty;
      if (table) table.hidden = isEmpty;
      if (submit) {
        submit.classList.toggle("is-disabled", isEmpty);
        submit.setAttribute("aria-disabled", String(isEmpty));
      }
    }

    function render() {
      if (tbody) tbody.innerHTML = items.map(rowHtml).join("");
      recalc();
    }

    if (notesEl && store && store.notes) notesEl.value = store.notes;
    render();

    if (tbody) {
      tbody.addEventListener("click", function (e) {
        if (e.target.closest("[data-remove]")) {
          var row = e.target.closest("[data-service-row]");
          if (row) {
            var id = row.getAttribute("data-id");
            items = items.filter(function (it) {
              return it.id !== id;
            });
            render();
          }
        }
      });
    }

    var submit = document.querySelector("[data-submit]");
    if (submit) {
      submit.addEventListener("click", function (e) {
        if (submit.classList.contains("is-disabled")) {
          e.preventDefault();
          return;
        }
        serialize();
      });
    }

    // Re-render the table (names, categories, numerals, currency) on switch.
    document.addEventListener("i18n:changed", render);
  });
})();
