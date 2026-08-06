/* =====================================================================
   Medical Pointing System — Free follow-up confirmation
   ---------------------------------------------------------------------
   The free-follow-up branch of the consultation workflow reuses the
   shared Success page. On "حفظ وإرسال" we record the visit kind in
   sessionStorage ("mps.visit") so success.js renders a follow-up
   summary instead of the treatment-services summary. The flag is a
   one-shot handoff — success.js clears it after reading. No inline JS.
   ===================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var save = document.querySelector("[data-followup-save]");
    if (!save) return;
    save.addEventListener("click", function () {
      try {
        sessionStorage.setItem(
          "mps.visit",
          JSON.stringify({ kind: "followup", period: 14 })
        );
      } catch (e) {
        /* storage unavailable — non-fatal, success falls back gracefully */
      }
    });
  });
})();
