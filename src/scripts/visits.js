/* =====================================================================
   Medical Pointing System — Visit Management (إدارة الزيارات)
   ---------------------------------------------------------------------
   • Recently Arrived cards: waiting duration updates automatically, and
     the most recently arrived patient always sorts to the top.
   • Starting a visit ("بدء الكشف") marks it In Progress (persisted), so
     on return the patient leaves the highlighted area but remains in the
     table as "قيد الكشف". Keeps the highlighted area to waiting patients.
   • Visits table: live search + Status / Doctor / Clinic / Date filters.
   No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  var KEY = "mps.inProgress";

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
  function T(key, fb) {
    return window.i18n ? window.i18n.t(key, fb) : fb;
  }
  // Western numerals in English, Arabic-Indic otherwise.
  function num(n) {
    return window.i18n && window.i18n.lang === "en" ? String(n) : toArabic(n);
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function markInProgress(id) {
    try {
      var a = loadState();
      if (a.indexOf(id) === -1) {
        a.push(id);
        localStorage.setItem(KEY, JSON.stringify(a));
      }
    } catch (e) {
      /* storage unavailable — non-fatal */
    }
  }

  // Language-aware "waiting for N minutes" (Arabic dual/plural or English)
  function waitingText(mins) {
    if (mins <= 0) return T("visits.waitingNow", "وصل الآن");
    if (mins === 1) return T("visits.waitingSince1", "بانتظار منذ دقيقة");
    if (mins === 2) return T("visits.waitingSince2", "بانتظار منذ دقيقتين");
    var few = mins >= 3 && mins <= 10;
    var fb = "بانتظار منذ " + toArabic(mins) + " " + (few ? "دقائق" : "دقيقة");
    return T(few ? "visits.waitingSinceN" : "visits.waitingSinceMany", fb).replace(
      "{n}",
      num(mins)
    );
  }

  function renderWaiting() {
    document.querySelectorAll("[data-waiting]").forEach(function (el) {
      var m = parseInt(el.getAttribute("data-arrival-mins"), 10) || 0;
      var t = el.querySelector("[data-waiting-text]") || el;
      t.textContent = waitingText(m);
    });
  }

  function tick() {
    document.querySelectorAll("[data-waiting]").forEach(function (el) {
      var m = (parseInt(el.getAttribute("data-arrival-mins"), 10) || 0) + 1;
      el.setAttribute("data-arrival-mins", m);
    });
    renderWaiting();
  }

  // Most recently arrived (smallest waiting) first
  function sortArrivals() {
    var grid = document.querySelector(".arrivals-grid");
    if (!grid) return;
    function mins(card) {
      var w = card.querySelector("[data-waiting]");
      return w ? parseInt(w.getAttribute("data-arrival-mins"), 10) || 0 : 0;
    }
    Array.prototype.slice
      .call(grid.querySelectorAll(".arrival-card"))
      .sort(function (a, b) {
        return mins(a) - mins(b);
      })
      .forEach(function (c) {
        grid.appendChild(c);
      });
  }

  function refreshArrivalsCount() {
    var grid = document.querySelector(".arrivals-grid");
    var empty = document.querySelector("[data-arrivals-empty]");
    if (!grid) return;
    var count = grid.querySelectorAll(".arrival-card").length;
    var badge = document.querySelector("[data-arrivals-count]");
    if (badge) badge.textContent = num(count);
    grid.hidden = count === 0;
    if (empty) empty.hidden = count !== 0;
  }

  // Apply persisted In-Progress state: drop the arrival card, flip the row
  function applyInProgress() {
    loadState().forEach(function (id) {
      var card = document.querySelector('.arrival-card[data-visit-id="' + id + '"]');
      if (card) card.remove();
      var row = document.querySelector('[data-visit-row][data-visit-id="' + id + '"]');
      if (row) {
        row.setAttribute("data-status", "in-progress");
        var badge = row.querySelector("[data-status-badge]");
        if (badge) {
          badge.className = "badge badge--warning";
          // Tag it so later language switches re-translate via translateDOM.
          badge.setAttribute("data-i18n", "status.inProgress");
          badge.textContent = T("status.inProgress", "قيد الكشف");
        }
      }
    });
  }

  function initStartButtons() {
    document.querySelectorAll("[data-start-visit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        // Synchronous write completes before the link navigates away.
        markInProgress(btn.getAttribute("data-start-visit"));
      });
    });
  }

  function initFilters() {
    var search = document.querySelector("[data-search]");
    var fStatus = document.querySelector("[data-filter-status]");
    var fDoctor = document.querySelector("[data-filter-doctor]");
    var fClinic = document.querySelector("[data-filter-clinic]");
    var fDate = document.querySelector("[data-filter-date]");
    var rows = Array.prototype.slice.call(
      document.querySelectorAll("[data-visit-row]")
    );
    var empty = document.querySelector("[data-visits-empty]");

    function apply() {
      var q = norm(search && search.value);
      var st = fStatus ? fStatus.value : "";
      var dc = fDoctor ? fDoctor.value : "";
      var cl = fClinic ? fClinic.value : "";
      var dt = fDate ? fDate.value : "";
      var visible = 0;
      rows.forEach(function (r) {
        var show =
          (!q || norm(r.getAttribute("data-search-text")).indexOf(q) !== -1) &&
          (!st || r.getAttribute("data-status") === st) &&
          (!dc || r.getAttribute("data-doctor") === dc) &&
          (!cl || r.getAttribute("data-clinic") === cl) &&
          (!dt || r.getAttribute("data-date") === dt);
        r.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    }

    [search, fStatus, fDoctor, fClinic, fDate].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });
    apply();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initStartButtons();
    applyInProgress();
    sortArrivals();
    refreshArrivalsCount();
    renderWaiting();
    initFilters();
    setInterval(tick, 60000);
    // Re-render runtime strings/numerals whenever the language changes.
    document.addEventListener("i18n:changed", function () {
      renderWaiting();
      refreshArrivalsCount();
    });
  });

  // Exposed so the auto-updater can be driven on demand (and verified).
  window.mpsVisits = { tick: tick };
})();
