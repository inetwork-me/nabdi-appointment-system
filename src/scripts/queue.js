/* =====================================================================
   Medical Pointing System — Appointment Queue
   ---------------------------------------------------------------------
   The doctor's main workspace. Enhances the three entry points:
     • Search — live-filters today's appointments.
     • Manual appointment code — resolves to a patient (found → open
       Patient Details, with a success state) or shows a not-found error.
   Selecting a row's "فتح الملف" is a plain link (handled in HTML).
   No inline JS.
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

  document.addEventListener("DOMContentLoaded", function () {
    // --- Search filter ------------------------------------------------
    var search = document.querySelector("[data-search]");
    var rows = Array.prototype.slice.call(
      document.querySelectorAll("[data-appt-row]")
    );
    var empty = document.querySelector("[data-search-empty]");
    if (search) {
      search.addEventListener("input", function () {
        var q = norm(search.value);
        var visible = 0;
        rows.forEach(function (r) {
          var hay = norm(r.getAttribute("data-search-text") || r.textContent);
          var show = !q || hay.indexOf(q) !== -1;
          r.hidden = !show;
          if (show) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
      });
    }

    // --- Manual appointment code -------------------------------------
    // Feedback is delivered via transient toasts (toast.js) — no permanent
    // inline success/error messages.
    var form = document.querySelector("[data-code-form]");
    if (!form) return;
    var input = form.querySelector("[data-code-input]");
    var valid = (form.getAttribute("data-valid-codes") || "")
      .split(",")
      .map(norm)
      .filter(Boolean);

    function toast(message, type) {
      if (typeof window.showToast === "function") window.showToast(message, type);
    }
    function T(key, fallback) {
      return window.i18n ? window.i18n.t(key, fallback) : fallback;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = norm(input.value).replace(/[^0-9a-z-]/g, "");
      if (!code) {
        input.setAttribute("aria-invalid", "true");
        return;
      }
      var found = valid.some(function (c) {
        return c.indexOf(code) !== -1;
      });
      if (found) {
        input.removeAttribute("aria-invalid");
        toast(T("toast.found", "تم العثور على الموعد"), "success");
        setTimeout(function () {
          window.location.href = "patient-details.html";
        }, 900);
      } else {
        input.setAttribute("aria-invalid", "true");
        toast(T("toast.notFound", "لم يتم العثور على الموعد"), "destructive");
      }
    });

    input.addEventListener("input", function () {
      input.removeAttribute("aria-invalid");
    });
  });
})();
