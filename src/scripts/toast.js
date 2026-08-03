/* =====================================================================
   Medical Pointing System — Toast notifications
   ---------------------------------------------------------------------
   Reusable, framework-free transient feedback. Any script can call
   window.showToast(message, type, duration) after a user action.
   Toasts are appended to a single fixed viewport and auto-dismiss, so
   they never occupy permanent page space. Types: success | destructive |
   info. No inline JS on pages.
   ===================================================================== */
(function () {
  "use strict";

  var ICONS = {
    success:
      '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    destructive:
      '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  };

  function viewport() {
    var v = document.querySelector(".toast-viewport");
    if (!v) {
      v = document.createElement("div");
      v.className = "toast-viewport";
      v.setAttribute("role", "status");
      v.setAttribute("aria-live", "polite");
      document.body.appendChild(v);
    }
    return v;
  }

  function iconMarkup(type) {
    return (
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[type] || ICONS.info) +
      "</svg>"
    );
  }

  window.showToast = function (message, type, duration) {
    type = type || "info";
    duration = duration || 3500;

    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    var span = document.createElement("span");
    span.textContent = message; // text, not HTML — safe
    el.innerHTML = iconMarkup(type);
    el.appendChild(span);
    viewport().appendChild(el);

    function remove() {
      el.classList.add("is-leaving");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }
    var timer = setTimeout(remove, duration);
    el.addEventListener("click", function () {
      clearTimeout(timer);
      remove();
    });
    return el;
  };
})();
