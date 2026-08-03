/* =====================================================================
   Medical Pointing System — Authentication interactions
   ---------------------------------------------------------------------
   Progressive enhancement only. Every page renders and is readable
   without JS; this layer adds password reveal, OTP UX, live password
   requirements, a resend countdown, and demo navigation between the
   five auth screens. No framework, no dependencies.
   ===================================================================== */
(function () {
  "use strict";

  function T(key, fb) {
    return window.i18n ? window.i18n.t(key, fb) : fb;
  }
  function num(n) {
    if (window.i18n && window.i18n.lang === "en") return String(n);
    return String(n).replace(/\d/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩"[d];
    });
  }

  /* --- Password reveal ------------------------------------------------- */
  function initPasswordToggles() {
    document.querySelectorAll("[data-password-toggle]").forEach(function (btn) {
      var input = document.getElementById(btn.getAttribute("data-password-toggle"));
      if (!input) return;
      btn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.classList.toggle("is-visible", show);
        btn.setAttribute("aria-pressed", String(show));
        btn.setAttribute(
          "aria-label",
          show
            ? T("auth.hidePassword", "إخفاء كلمة المرور")
            : T("auth.showPassword", "إظهار كلمة المرور")
        );
      });
    });
  }

  /* --- OTP group ------------------------------------------------------- */
  function initOtp() {
    var group = document.querySelector("[data-otp]");
    if (!group) return;
    var slots = Array.prototype.slice.call(group.querySelectorAll(".otp__slot"));
    var hidden = document.getElementById(group.getAttribute("data-otp"));
    var submitBtn = document.querySelector('[data-otp-submit]');

    function sync() {
      var code = slots
        .map(function (s) {
          return s.value;
        })
        .join("");
      if (hidden) hidden.value = code;
      if (submitBtn) submitBtn.disabled = code.length !== slots.length;
    }

    slots.forEach(function (slot, i) {
      slot.addEventListener("input", function () {
        slot.value = slot.value.replace(/\D/g, "").slice(-1);
        if (slot.value && i < slots.length - 1) slots[i + 1].focus();
        sync();
      });
      slot.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && !slot.value && i > 0) {
          slots[i - 1].focus();
        }
      });
      slot.addEventListener("paste", function (e) {
        e.preventDefault();
        var digits = (e.clipboardData || window.clipboardData)
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, slots.length);
        for (var j = 0; j < digits.length; j++) slots[j].value = digits[j];
        (slots[Math.min(digits.length, slots.length - 1)] || slot).focus();
        sync();
      });
    });
    sync();
  }

  /* --- Resend countdown ------------------------------------------------ */
  function initResend() {
    var el = document.querySelector("[data-resend]");
    if (!el) return;
    var btn = el.querySelector("button");
    var counter = el.querySelector("[data-resend-count]");
    var seconds = parseInt(el.getAttribute("data-resend"), 10) || 30;

    function tick(remaining) {
      if (remaining <= 0) {
        btn.disabled = false;
        if (counter) counter.textContent = "";
        var prompt = el.querySelector("[data-resend-prompt]");
        if (prompt) prompt.textContent = T("auth.otp.noCode", "لم يصلك الرمز؟ ");
        return;
      }
      btn.disabled = true;
      if (counter)
        counter.textContent = T(
          "auth.otp.resendIn",
          "إعادة الإرسال خلال {n} ثانية"
        ).replace("{n}", num(remaining));
      setTimeout(function () {
        tick(remaining - 1);
      }, 1000);
    }

    btn.addEventListener("click", function () {
      tick(seconds);
    });
    tick(seconds);
  }

  /* --- Live password requirements ------------------------------------- */
  function initPasswordReqs() {
    var input = document.querySelector("[data-password-input]");
    var list = document.querySelector("[data-password-reqs]");
    if (!input || !list) return;
    var rules = {
      length: function (v) {
        return v.length >= 8;
      },
      case: function (v) {
        return /[a-z]/.test(v) && /[A-Z]/.test(v);
      },
      number: function (v) {
        return /\d/.test(v);
      },
    };
    input.addEventListener("input", function () {
      var v = input.value;
      list.querySelectorAll("[data-req]").forEach(function (item) {
        var key = item.getAttribute("data-req");
        if (rules[key]) item.classList.toggle("is-met", rules[key](v));
      });
    });
  }

  /* --- Demo navigation between screens --------------------------------- */
  function initFlowNavigation() {
    document.querySelectorAll("form[data-next]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Confirm-password match guard on the reset screen.
        var pw = form.querySelector("[data-password-input]");
        var confirm = form.querySelector("[data-confirm-input]");
        var errEl = form.querySelector("[data-confirm-error]");
        if (pw && confirm && pw.value !== confirm.value) {
          confirm.setAttribute("aria-invalid", "true");
          if (errEl) errEl.hidden = false;
          confirm.focus();
          return;
        }

        var btn = form.querySelector('[type="submit"]');
        if (btn) {
          btn.disabled = true;
          btn.dataset.label = btn.textContent;
          btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
        }
        setTimeout(function () {
          window.location.href = form.getAttribute("data-next");
        }, 650);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPasswordToggles();
    initOtp();
    initResend();
    initPasswordReqs();
    initFlowNavigation();
  });
})();
