(function () {
  var themeButton = document.getElementById("theme-toggle");
  var themeIcon = document.getElementById("theme-icon");
  function paintTheme(theme) {
    var dark = theme === "dark";
    if (dark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    if (!themeButton) return;
    themeButton.setAttribute("aria-pressed", dark ? "true" : "false");
    themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    if (themeIcon) themeIcon.textContent = dark ? "light_mode" : "dark_mode";
  }
  paintTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

  var siteBar = document.querySelector(".site-bar");
  function paintHeader() {
    if (siteBar) siteBar.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  paintHeader();
  window.addEventListener("scroll", paintHeader, { passive: true });

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("poodlecircle-theme", next); } catch (e) {}
      paintTheme(next);
    });
  }

  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-nav");
  var icon = document.getElementById("nav-icon");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (icon) icon.textContent = open ? "close" : "menu";
  });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      if (icon) icon.textContent = "menu";
    });
  });
})();
