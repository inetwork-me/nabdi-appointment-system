/* =====================================================================
   Medical Pointing System — Additional Medical Services (core feature)
   ---------------------------------------------------------------------
   Three-column consultation workspace. Selecting a service card's
   checkbox highlights it and immediately adds it to the sticky Treatment
   Plan (qty stepper + remove + running total). Category filter + search
   narrow the catalog. The plan (+ internal notes) is handed to the
   Review page via sessionStorage. No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  function toArabic(n) {
    return String(n).replace(/\d/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩"[d];
    });
  }
  function norm(s) {
    return (s || "")
      .replace(/[٠-٩]/g, function (d) {
        return "٠١٢٣٤٥٦٧٨٩".indexOf(d);
      })
      .toLowerCase()
      .trim();
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
  // "١٥٠٠ ر.س" in Arabic, "SAR 1500" in English.
  function money(n) {
    var cur = T("currency.sar", "ر.س");
    return isEn() ? cur + " " + n : toArabic(n) + " " + cur;
  }

  var TRASH =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  document.addEventListener("DOMContentLoaded", function () {
    var cards = Array.prototype.slice.call(
      document.querySelectorAll(".service-card")
    );
    var itemsEl = document.querySelector("[data-plan-items]");
    var emptyEl = document.querySelector("[data-plan-empty]");
    var countEl = document.querySelector("[data-plan-count]");
    var totalEl = document.querySelector("[data-plan-total]");
    var reviewBtn = document.querySelector("[data-review]");
    var notesEl = document.querySelector("[data-plan-notes]");

    var plan = {}; // id -> { nameKey, catKey, price, qty }

    function meta(card) {
      return {
        id: card.getAttribute("data-id"),
        nameKey: card.getAttribute("data-name-key"),
        catKey: card.getAttribute("data-cat-key"),
        price: Number(card.getAttribute("data-price")) || 0,
      };
    }

    // Re-price the static service cards for the active language (English
    // shows Western numerals + SAR; Arabic keeps its original formatting).
    function formatCardPrices() {
      cards.forEach(function (card) {
        var el = card.querySelector(".service-card__price");
        if (!el) return;
        if (!el.hasAttribute("data-orig"))
          el.setAttribute("data-orig", el.textContent);
        var price = Number(card.getAttribute("data-price")) || 0;
        el.textContent = isEn() ? money(price) : el.getAttribute("data-orig");
      });
    }

    function renderPlan() {
      var ids = Object.keys(plan);
      itemsEl.innerHTML = ids
        .map(function (id) {
          var it = plan[id];
          var sub = it.price * it.qty;
          return (
            '<div class="plan-item" data-plan-item="' + id + '">' +
            '<div class="plan-item__top">' +
            '<span class="plan-item__name">' + T(it.nameKey) + "</span>" +
            '<button class="icon-btn icon-btn--danger" type="button" data-plan-remove aria-label="' +
            T("aria.removeService", "إزالة الخدمة") + '">' +
            TRASH +
            "</button></div>" +
            '<div class="plan-item__bottom">' +
            '<div class="qty">' +
            '<button class="qty__btn" type="button" data-qty-dec aria-label="' +
            T("aria.decreaseQty", "إنقاص الكمية") + '">−</button>' +
            '<span class="qty__val" data-qty>' + num(it.qty) + "</span>" +
            '<button class="qty__btn" type="button" data-qty-inc aria-label="' +
            T("aria.increaseQty", "زيادة الكمية") + '">+</button>' +
            "</div>" +
            '<span class="plan-item__subtotal">' + money(sub) + "</span>" +
            "</div></div>"
          );
        })
        .join("");

      var count = ids.length;
      var total = ids.reduce(function (s, id) {
        return s + plan[id].price * plan[id].qty;
      }, 0);
      if (countEl) countEl.textContent = num(count);
      if (totalEl) totalEl.textContent = money(total);
      if (emptyEl) emptyEl.hidden = count !== 0;
      if (itemsEl) itemsEl.hidden = count === 0;
      if (reviewBtn) {
        var none = count === 0;
        reviewBtn.classList.toggle("is-disabled", none);
        reviewBtn.setAttribute("aria-disabled", String(none));
      }
    }

    function setSelected(card, on) {
      var m = meta(card);
      var cb = card.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = on;
      card.classList.toggle("is-selected", on);
      if (on) {
        if (!plan[m.id])
          plan[m.id] = { nameKey: m.nameKey, catKey: m.catKey, price: m.price, qty: 1 };
      } else {
        delete plan[m.id];
      }
      renderPlan();
    }

    // Checkbox selection
    cards.forEach(function (card) {
      var cb = card.querySelector('input[type="checkbox"]');
      cb.addEventListener("change", function () {
        setSelected(card, cb.checked);
      });
      if (cb.checked) setSelected(card, true);
    });

    // Plan interactions (event delegation: remove / qty)
    if (itemsEl) {
      itemsEl.addEventListener("click", function (e) {
        var line = e.target.closest("[data-plan-item]");
        if (!line) return;
        var id = line.getAttribute("data-plan-item");
        if (!plan[id]) return;
        if (e.target.closest("[data-plan-remove]")) {
          var card = document.querySelector('.service-card[data-id="' + id + '"]');
          if (card) setSelected(card, false);
          else {
            delete plan[id];
            renderPlan();
          }
        } else if (e.target.closest("[data-qty-inc]")) {
          plan[id].qty++;
          renderPlan();
        } else if (e.target.closest("[data-qty-dec]")) {
          plan[id].qty = Math.max(1, plan[id].qty - 1);
          renderPlan();
        }
      });
    }

    // Category filter + search
    var catItems = Array.prototype.slice.call(
      document.querySelectorAll(".category-item")
    );
    var servicesEmpty = document.querySelector("[data-services-empty]");
    var search = document.querySelector("[data-search]");
    var activeCat = "all";

    function applyFilter() {
      var q = norm(search && search.value);
      var visible = 0;
      cards.forEach(function (card) {
        var okCat =
          activeCat === "all" || card.getAttribute("data-category") === activeCat;
        var okQ =
          !q ||
          norm(
            card.getAttribute("data-name") + " " + card.getAttribute("data-desc")
          ).indexOf(q) !== -1;
        var show = okCat && okQ;
        card.hidden = !show;
        if (show) visible++;
      });
      if (servicesEmpty) servicesEmpty.hidden = visible !== 0;
    }

    catItems.forEach(function (btn) {
      btn.addEventListener("click", function () {
        catItems.forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        activeCat = btn.getAttribute("data-category");
        applyFilter();
      });
    });
    if (search) search.addEventListener("input", applyFilter);

    // Hand the plan to the Review page
    if (reviewBtn) {
      reviewBtn.addEventListener("click", function (e) {
        if (reviewBtn.classList.contains("is-disabled")) {
          e.preventDefault();
          return;
        }
        try {
          var items = Object.keys(plan).map(function (id) {
            return {
              id: id,
              nameKey: plan[id].nameKey,
              catKey: plan[id].catKey,
              price: plan[id].price,
              qty: plan[id].qty,
            };
          });
          sessionStorage.setItem(
            "mps.plan",
            JSON.stringify({ items: items, notes: (notesEl && notesEl.value) || "" })
          );
        } catch (err) {
          /* storage unavailable — navigation still proceeds */
        }
      });
    }

    formatCardPrices();
    renderPlan();
    applyFilter();

    // Re-render everything language-dependent on a language switch.
    document.addEventListener("i18n:changed", function () {
      formatCardPrices();
      renderPlan();
    });
  });
})();
