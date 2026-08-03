/* =====================================================================
   Medical Pointing System — Shared layout engine
   ---------------------------------------------------------------------
   ONE source of truth for both application shells and the primary
   navigation. Every page ships only its own content inside
   <div data-page> … </div> and declares its context on <body>:

     data-layout="dashboard" | "auth"
     data-nav="dashboard"                  (dashboard: active sidebar item)
     data-title / data-subtitle            (dashboard: topbar heading)

   On load this builds the chrome (sidebar + topbar, or brand split),
   then moves the page's content into the shell's content slot. No page
   repeats layout or navigation markup.
   ===================================================================== */
(function () {
  "use strict";

  function svg(paths) {
    return (
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      paths +
      "</svg>"
    );
  }

  /* --- Brand -------------------------------------------------------- */
  var GLYPH =
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>';

  function brand(onPrimary) {
    return (
      '<div class="brand' +
      (onPrimary ? " brand--on-primary" : "") +
      '"><span class="brand__glyph" aria-hidden="true">' +
      svg(GLYPH) +
      '</span><span class="brand__text"><span class="brand__name" data-i18n="brand.name">مجمع الشفاء الطبي</span>' +
      '<span class="brand__sub" data-i18n="brand.sub">بوابة الطاقم الطبي</span></span></div>'
    );
  }

  /* --- Icon set ----------------------------------------------------- */
  var ICONS = {
    dashboard:
      '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    visits:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
    services:
      '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M12 11v6"/>',
    requests:
      '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    settings:
      '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    profile:
      '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    collapse: '<path d="m9 7-5 5 5 5"/><path d="m15 7 5 5-5 5"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.41 5.956-2.738 7.326"/>',
    logout:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    globe:
      '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  };

  /* --- Primary navigation (single source) --------------------------- *
   * Dashboard pages live in one folder, so hrefs are bare filenames.   */
  var NAV = [
    { section: "القائمة", i18n: "section.main" },
    { key: "dashboard", label: "لوحة التحكم", href: "index.html" },
    { key: "visits", label: "إدارة الزيارات", href: "visits.html" },
    { section: "الخدمات الطبية", i18n: "section.medical" },
    { key: "requests", label: "طلبات الخدمات", href: "requests.html", count: "٤" },
    { section: "الحساب", i18n: "section.account" },
    { key: "settings", label: "الإعدادات", href: "settings.html" },
    { key: "profile", label: "الملف الشخصي", href: "profile.html" },
  ];

  function navMarkup(active) {
    return NAV.map(function (n) {
      if (n.section)
        return (
          '<p class="side-nav__label" data-i18n="' +
          n.i18n +
          '">' +
          n.section +
          "</p>"
        );
      var count = n.count
        ? '<span class="badge badge--muted side-nav__count">' + n.count + "</span>"
        : "";
      var isActive = n.key === active;
      var navKey = "nav." + n.key;
      return (
        '<a class="side-nav__item' +
        (isActive ? " is-active" : "") +
        '" href="' +
        n.href +
        '" data-i18n-title="' +
        navKey +
        '" title="' +
        n.label +
        '"' +
        (isActive ? ' aria-current="page"' : "") +
        ">" +
        svg(ICONS[n.key]) +
        '<span data-i18n="' +
        navKey +
        '">' +
        n.label +
        "</span>" +
        count +
        "</a>"
      );
    }).join("");
  }

  /* --- Dashboard shell ---------------------------------------------- */
  function dashboardShell(body) {
    var active = body.getAttribute("data-nav") || "";
    var title = body.getAttribute("data-title") || "";
    var subtitle = body.getAttribute("data-subtitle") || "";
    var titleKey = body.getAttribute("data-title-key") || "";
    var subKey = body.getAttribute("data-subtitle-key") || "";
    var titleAttr = titleKey ? ' data-i18n="' + titleKey + '"' : "";
    var subAttr = subKey ? ' data-i18n="' + subKey + '"' : "";
    return (
      '<div class="app">' +
      '<div class="app__backdrop" data-nav-close></div>' +
      '<aside class="app__sidebar">' +
      '<div class="side-brand">' +
      brand(false) +
      "</div>" +
      '<nav class="side-nav" data-i18n-aria-label="aria.nav" aria-label="التنقّل الرئيسي">' +
      navMarkup(active) +
      "</nav>" +
      '<div class="side-user">' +
      '<span class="avatar avatar--brand" aria-hidden="true">' +
      svg(ICONS.profile) +
      "</span>" +
      '<span class="side-user__text"><span class="side-user__name" data-i18n="user.name">د. سارة المنصور</span>' +
      '<span class="side-user__role" data-i18n="user.role">طبيبة باطنة</span></span>' +
      '<a class="icon-btn" href="../auth/login.html" data-i18n-aria-label="aria.logout" aria-label="تسجيل الخروج">' +
      svg(ICONS.logout) +
      "</a></div>" +
      "</aside>" +
      '<button class="side-collapse" type="button" data-nav-collapse data-i18n-aria-label="aria.toggleSidebar" aria-label="تبديل القائمة" aria-pressed="false">' +
      svg(ICONS.collapse) +
      "</button>" +
      '<div class="app__main">' +
      '<header class="app__topbar">' +
      '<div style="display:flex;align-items:center;gap:0.75rem;min-width:0">' +
      '<button class="icon-btn app__menu" type="button" data-nav-toggle data-i18n-aria-label="aria.menu" aria-label="فتح القائمة" aria-expanded="false">' +
      svg(ICONS.menu) +
      "</button>" +
      '<div class="app__topbar-title"><h1' +
      titleAttr +
      ">" +
      title +
      "</h1>" +
      (subtitle ? "<p" + subAttr + ">" + subtitle + "</p>" : "") +
      "</div></div>" +
      '<div class="app__topbar-actions">' +
      '<label class="lang-switch">' +
      '<span class="lang-switch__icon" aria-hidden="true">' +
      svg(ICONS.globe) +
      "</span>" +
      '<select class="lang-switch__select" data-lang-select data-i18n-aria-label="aria.language" aria-label="اللغة">' +
      '<option value="ar">العربية</option>' +
      '<option value="en">English</option>' +
      "</select></label>" +
      '<button class="icon-btn" type="button" data-i18n-aria-label="aria.notifications" aria-label="الإشعارات">' +
      svg(ICONS.bell) +
      "</button></div>" +
      "</header>" +
      '<main class="app__content" data-content-slot></main>' +
      "</div></div>"
    );
  }

  /* --- Auth shell (brand split) ------------------------------------- */
  var FEATURES = [
    {
      icon: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
      title: "تسجيل الوصول عبر رمز QR",
      body: "سجّل وصول المرضى فور حضورهم بمسح الرمز.",
      tKey: "auth.feature.qr",
      bKey: "auth.feature.qr.body",
    },
    {
      icon: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
      title: "عرض تفاصيل المواعيد",
      body: "اطّلع على بيانات المريض وموعده في لمحة.",
      tKey: "auth.feature.appts",
      bKey: "auth.feature.appts.body",
    },
    {
      icon: '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M12 11v6"/>',
      title: "إضافة خدمات طبية",
      body: "أضِف خدمات من الكتالوج وأرسلها للمريض للتأكيد.",
      tKey: "auth.feature.services",
      bKey: "auth.feature.services.body",
    },
    {
      icon: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
      title: "متابعة حالة الطلبات",
      body: "تتبّع الخدمات المُرسلة من الإرسال حتى التأكيد.",
      tKey: "auth.feature.track",
      bKey: "auth.feature.track.body",
    },
  ];

  function authShell() {
    var features = FEATURES.map(function (f) {
      return (
        '<div class="auth__feature"><span class="auth__feature-icon" aria-hidden="true">' +
        svg(f.icon) +
        '</span><span class="auth__feature-text"><strong data-i18n="' +
        f.tKey +
        '">' +
        f.title +
        '</strong><span data-i18n="' +
        f.bKey +
        '">' +
        f.body +
        "</span></span></div>"
      );
    }).join("");
    return (
      '<div class="auth">' +
      '<main class="auth__main">' +
      '<div class="auth__topbar">' +
      brand(false) +
      "</div>" +
      '<div data-content-slot style="display:contents"></div>' +
      '<p class="auth__legal" data-i18n="auth.copyright">© ٢٠٢٦ مجمع الشفاء الطبي — جميع الحقوق محفوظة.</p>' +
      "</main>" +
      '<aside class="auth__aside">' +
      brand(true) +
      '<div class="auth__aside-body">' +
      '<p class="auth__aside-lead" data-i18n="auth.aside.lead">منصّة متكاملة لتسجيل وصول المرضى وإدارة الخدمات الطبية داخل المجمع.</p>' +
      '<div class="auth__features">' +
      features +
      "</div></div>" +
      '<p class="auth__aside-legal" data-i18n="brand.tagline">نظام النقاط الطبية — وحدة الطاقم الطبي الداخلية.</p>' +
      "</aside></div>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;
    var kind = body.getAttribute("data-layout");
    if (!kind) return;

    var page = document.querySelector("[data-page]");
    var shellHtml = kind === "auth" ? authShell() : dashboardShell(body);

    var frag = document.createElement("div");
    frag.innerHTML = shellHtml;
    var shell = frag.firstElementChild;
    var slot = shell.querySelector("[data-content-slot]");

    if (page && slot) {
      while (page.firstChild) slot.appendChild(page.firstChild);
      page.remove();
    }
    body.insertBefore(shell, body.firstChild);

    // Mobile navigation drawer (dashboard shell only)
    if (kind !== "auth") {
      var app = shell;
      var toggle = shell.querySelector("[data-nav-toggle]");
      var closeNav = function () {
        app.classList.remove("is-nav-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      };
      if (toggle) {
        toggle.addEventListener("click", function () {
          var open = app.classList.toggle("is-nav-open");
          toggle.setAttribute("aria-expanded", String(open));
        });
      }
      shell.querySelectorAll("[data-nav-close]").forEach(function (el) {
        el.addEventListener("click", closeNav);
      });
      shell.querySelectorAll(".side-nav__item").forEach(function (a) {
        a.addEventListener("click", closeNav);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeNav();
      });

      // Desktop: collapse/expand the sidebar to an icons-only rail (persisted)
      var COLLAPSE_KEY = "mps.navCollapsed";
      var collapseBtn = shell.querySelector("[data-nav-collapse]");
      var applyCollapsed = function (collapsed) {
        app.classList.toggle("is-nav-collapsed", collapsed);
        if (collapseBtn) collapseBtn.setAttribute("aria-pressed", String(collapsed));
      };
      var stored = "0";
      try {
        stored = localStorage.getItem(COLLAPSE_KEY) || "0";
      } catch (e) {
        /* storage unavailable */
      }
      applyCollapsed(stored === "1");
      if (collapseBtn) {
        collapseBtn.addEventListener("click", function () {
          var collapsed = !app.classList.contains("is-nav-collapsed");
          applyCollapsed(collapsed);
          try {
            localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
          } catch (e) {
            /* storage unavailable */
          }
        });
      }
    }
  });
})();
