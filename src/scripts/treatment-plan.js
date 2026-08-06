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
  // Catalog items carry i18n keys; manual items carry literal strings.
  function nameOf(it) {
    return it.nameKey ? T(it.nameKey) : it.name || "";
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
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
          var displayName = it.nameKey ? T(it.nameKey) : escapeHtml(it.name);
          var manualBadge = it.manual
            ? ' <span class="badge badge--warning">' +
              T("manual.badgePending", "قيد المراجعة") +
              "</span>"
            : "";
          return (
            '<div class="plan-item" data-plan-item="' + id + '">' +
            '<div class="plan-item__top">' +
            '<span class="plan-item__name">' + displayName + manualBadge + "</span>" +
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

    // Add service — search the catalog first; create a manual service only
    // when nothing suitable exists (prevents duplicate services from differing
    // naming). Both steps share one dialog. Manual items live in the same
    // `plan` map, flagged `manual`, so they carry a "review" badge and reach
    // the success message downstream.
    var manualDialog = document.querySelector("[data-manual-dialog]");
    var manualForm = document.querySelector("[data-manual-form]");
    var manualOpen = document.querySelector("[data-manual-open]");
    var searchStep = manualDialog
      ? manualDialog.querySelector('[data-manual-step="search"]')
      : null;
    var manualSearch = document.querySelector("[data-manual-search]");
    var resultsEl = document.querySelector("[data-manual-results]");
    var suggestEl = document.querySelector("[data-manual-suggest]");
    var suggestListEl = document.querySelector("[data-manual-suggest-list]");
    var emptyEl = document.querySelector("[data-manual-empty]");
    var promptEl = document.querySelector("[data-manual-prompt]");
    var createWrap = document.querySelector("[data-manual-create-wrap]");
    var stillNote = document.querySelector("[data-manual-still-note]");
    var createBtn = document.querySelector("[data-manual-create]");
    var manualSeq = 0;

    var CAL_ICON =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>';

    // Catalog index built from the existing service cards (single source of
    // truth — no duplicated data).
    var CATALOG = cards.map(function (card) {
      var sessEl = card.querySelector(".service-card__sessions [data-i18n]");
      return {
        id: card.getAttribute("data-id"),
        nameKey: card.getAttribute("data-name-key"),
        catKey: card.getAttribute("data-cat-key"),
        sessionsKey: sessEl ? sessEl.getAttribute("data-i18n") : "",
        price: Number(card.getAttribute("data-price")) || 0,
        dataName: card.getAttribute("data-name") || "",
        dataDesc: card.getAttribute("data-desc") || "",
        dataCat: card.getAttribute("data-cat") || "",
      };
    });
    // Search haystack = static Arabic text + active-language translations, so a
    // query matches whichever language the doctor types in.
    function haystack(c) {
      return norm(
        c.dataName + " " + c.dataDesc + " " + c.dataCat + " " +
          T(c.nameKey) + " " + T(c.catKey)
      );
    }
    function resultHtml(c) {
      return (
        '<div class="plan-item">' +
        '<div class="plan-item__top">' +
        '<span class="plan-item__name">' + T(c.nameKey) + "</span>" +
        '<span class="badge badge--muted">' + T(c.catKey) + "</span>" +
        "</div>" +
        '<div class="plan-item__bottom">' +
        '<span class="service-card__sessions">' + CAL_ICON +
        "<span>" + (c.sessionsKey ? T(c.sessionsKey) : "") + "</span></span>" +
        '<span class="plan-item__subtotal">' + money(c.price) + "</span>" +
        "</div>" +
        '<button class="btn btn--primary btn--block" type="button" data-use-service="' +
        c.id + '">' + T("manualSearch.use", "استخدام هذه الخدمة") + "</button>" +
        "</div>"
      );
    }

    function hideEl(el) {
      if (el) el.hidden = true;
    }
    function showEl(el) {
      if (el) el.hidden = false;
    }

    function renderSearch() {
      var q = norm((manualSearch && manualSearch.value) || "");
      hideEl(resultsEl);
      if (resultsEl) resultsEl.innerHTML = "";
      hideEl(suggestEl);
      if (suggestListEl) suggestListEl.innerHTML = "";
      hideEl(emptyEl);
      hideEl(createWrap);
      hideEl(stillNote);
      hideEl(promptEl);

      if (!q) {
        showEl(promptEl);
        return;
      }

      var direct = CATALOG.filter(function (c) {
        return haystack(c).indexOf(q) !== -1;
      });
      if (direct.length) {
        if (resultsEl) resultsEl.innerHTML = direct.map(resultHtml).join("");
        showEl(resultsEl);
        return;
      }

      // No direct match — surface close "did you mean" matches by token overlap,
      // then always offer to create a new manual service.
      var tokens = q.split(/\s+/).filter(Boolean);
      var scored = CATALOG.map(function (c) {
        var h = haystack(c);
        var score = tokens.reduce(function (s, t) {
          return s + (t && h.indexOf(t) !== -1 ? 1 : 0);
        }, 0);
        return { c: c, score: score };
      })
        .filter(function (x) {
          return x.score > 0;
        })
        .sort(function (a, b) {
          return b.score - a.score;
        })
        .slice(0, 6);

      if (scored.length) {
        if (suggestListEl)
          suggestListEl.innerHTML = scored
            .map(function (x) {
              return resultHtml(x.c);
            })
            .join("");
        showEl(suggestEl);
        showEl(stillNote);
      } else {
        showEl(emptyEl);
      }
      showEl(createWrap);
    }

    function showStep(step) {
      if (searchStep) searchStep.hidden = step !== "search";
      if (manualForm) manualForm.hidden = step !== "form";
      if (manualDialog) {
        Array.prototype.slice
          .call(manualDialog.querySelectorAll("[data-manual-head]"))
          .forEach(function (h) {
            h.hidden = h.getAttribute("data-manual-head") !== step;
          });
      }
    }

    function clearInvalid() {
      if (!manualForm) return;
      Array.prototype.slice
        .call(manualForm.querySelectorAll('[aria-invalid="true"]'))
        .forEach(function (el) {
          el.removeAttribute("aria-invalid");
        });
    }
    function resetManualForm() {
      if (manualForm) manualForm.reset();
      clearInvalid();
    }
    function resetDialog() {
      if (manualSearch) manualSearch.value = "";
      resetManualForm();
      showStep("search");
      renderSearch();
    }
    function closeManual() {
      if (manualDialog && typeof manualDialog.close === "function")
        manualDialog.close();
    }

    if (manualOpen && manualDialog) {
      manualOpen.addEventListener("click", function () {
        resetDialog();
        if (typeof manualDialog.showModal === "function")
          manualDialog.showModal();
        if (manualSearch) manualSearch.focus();
      });
    }
    if (manualSearch) manualSearch.addEventListener("input", renderSearch);

    // "استخدام هذه الخدمة" — reuse an existing catalog service (adds it exactly
    // like ticking its card, keeping the catalog list in sync), then close.
    if (searchStep) {
      searchStep.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-use-service]");
        if (!btn) return;
        var id = btn.getAttribute("data-use-service");
        var card = document.querySelector('.service-card[data-id="' + id + '"]');
        if (card) setSelected(card, true);
        closeManual();
      });
    }
    // Reveal the manual form only after the doctor chooses to create a new one.
    if (createBtn) {
      createBtn.addEventListener("click", function () {
        showStep("form");
        var nameEl = manualForm && manualForm.querySelector("[data-manual-name]");
        if (nameEl) {
          var q = manualSearch ? manualSearch.value.trim() : "";
          if (q && !nameEl.value) nameEl.value = q; // carry the search term over
          nameEl.focus();
        }
      });
    }
    if (manualDialog) {
      // Cancel / close buttons
      Array.prototype.slice
        .call(manualDialog.querySelectorAll("[data-manual-close]"))
        .forEach(function (c) {
          c.addEventListener("click", closeManual);
        });
      // Click on the backdrop (the <dialog> element itself) closes it
      manualDialog.addEventListener("click", function (e) {
        if (e.target === manualDialog) closeManual();
      });
      // Reset to the search step on any close (buttons, backdrop, native Esc)
      manualDialog.addEventListener("close", resetDialog);
    }
    if (manualForm) {
      manualForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameEl = manualForm.querySelector("[data-manual-name]");
        var priceEl = manualForm.querySelector("[data-manual-price]");
        var catEl = manualForm.querySelector("[data-manual-cat]");
        var sessEl = manualForm.querySelector("[data-manual-sessions]");
        var notesEl2 = manualForm.querySelector("[data-manual-notes]");

        var name = ((nameEl && nameEl.value) || "").trim();
        var priceRaw = ((priceEl && priceEl.value) || "").trim();
        var price = Number(priceRaw);

        var ok = true;
        if (!name) {
          if (nameEl) nameEl.setAttribute("aria-invalid", "true");
          ok = false;
        } else if (nameEl) nameEl.removeAttribute("aria-invalid");
        if (!priceRaw || isNaN(price) || price < 0) {
          if (priceEl) priceEl.setAttribute("aria-invalid", "true");
          ok = false;
        } else if (priceEl) priceEl.removeAttribute("aria-invalid");
        if (!ok) {
          var firstBad = manualForm.querySelector('[aria-invalid="true"]');
          if (firstBad) firstBad.focus();
          return;
        }

        manualSeq++;
        plan["manual-" + manualSeq] = {
          name: name,
          cat: ((catEl && catEl.value) || "").trim(),
          price: price,
          qty: 1,
          sessions: ((sessEl && sessEl.value) || "").trim(),
          itemNotes: ((notesEl2 && notesEl2.value) || "").trim(),
          manual: true,
        };
        renderPlan();
        closeManual();
      });
    }

    // Hand the plan to the Review page
    if (reviewBtn) {
      reviewBtn.addEventListener("click", function (e) {
        if (reviewBtn.classList.contains("is-disabled")) {
          e.preventDefault();
          return;
        }
        try {
          var items = Object.keys(plan).map(function (id) {
            var p = plan[id];
            return {
              id: id,
              nameKey: p.nameKey,
              catKey: p.catKey,
              name: p.name,
              cat: p.cat,
              price: p.price,
              qty: p.qty,
              sessions: p.sessions,
              itemNotes: p.itemNotes,
              manual: !!p.manual,
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
      // Keep open search results/labels/prices in the active language.
      if (manualDialog && manualDialog.open) renderSearch();
    });
  });
})();
