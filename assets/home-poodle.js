(function () {
  var script = document.currentScript;
  var assetBase = script ? new URL(".", script.src).href : "assets/";
  if (!document.getElementById("page-poodle-styles")) {
    var stylesheet = document.createElement("link");
    stylesheet.id = "page-poodle-styles";
    stylesheet.rel = "stylesheet";
    stylesheet.href = assetBase + "home-poodle.css";
    document.head.appendChild(stylesheet);
  }

  var root = document.getElementById("page-poodle");
  if (!root) {
    root = document.createElement("div");
    root.className = "page-poodle face-left";
    root.id = "page-poodle";
    root.innerHTML =
      '<button class="page-poodle-btn" type="button" aria-label="Pet the toy poodle. It trots beside you as you scroll.">' +
        '<span class="page-poodle-body">' +
          '<img class="page-poodle-art" src="' + assetBase + 'poodle-scroll-mascot.png" width="684" height="721" alt="" decoding="async"/>' +
        '</span>' +
      '</button>' +
      '<p class="page-poodle-toast" hidden></p>';
    document.body.appendChild(root);
  }
  if (!root) return;
  var btn = root.querySelector(".page-poodle-btn");
  if (!btn) return;
  var toast = root.querySelector(".page-poodle-toast");
  var pupils = root.querySelectorAll(".page-poodle-pupil");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function isNarrow() {
    return window.matchMedia("(max-width: 639px)").matches;
  }
  var main = document.querySelector("main");
  var lines = [
    "Good pet.",
    "Tiny tail emergency.",
    "Boof.",
    "Still here.",
    "You scroll, I supervise."
  ];
  var line = 0;
  var wagTimer;
  var lastScroll = window.scrollY;
  var walkTimer;
  var ticking = false;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function paintWalk() {
    if (reduce) return;
    var delta = Math.abs(window.scrollY - lastScroll);
    lastScroll = window.scrollY;
    if (delta < 2) return;
    root.classList.add("is-walking");
    clearTimeout(walkTimer);
    walkTimer = setTimeout(function () {
      root.classList.remove("is-walking");
    }, 280);
  }

  function paintPath() {
    if (!main) return;

    var header = 76;
    var size = root.offsetHeight || 64;
    var minY = header + 6;
    var maxY = window.innerHeight - size - 10;
    var trackY = window.scrollY + window.innerHeight * 0.46;
    var start = main.offsetTop + 100;
    var end = Math.max(start + 1, main.offsetTop + main.offsetHeight - 100);
    var docY = clamp(trackY, start, end);
    var progress = clamp((docY - start) / (end - start), 0, 1);
    paintAt(docY, progress * 8, minY, maxY, header, size);
  }

  function paintAt(docY, pathIndex, minY, maxY, header, size) {
    var screenY = clamp(docY - window.scrollY, minY, maxY);
    root.style.top = screenY + "px";

    var sideFlip = pathIndex % 2 < 1;
    if (isNarrow()) {
      root.style.left = "auto";
      root.style.right = "10px";
      root.classList.toggle("face-left", true);
    } else {
      if (sideFlip) {
        root.style.left = "auto";
        root.style.right = "max(12px, calc((100vw - 1240px) / 2 + 8px))";
        root.classList.toggle("face-left", true);
      } else {
        root.style.right = "auto";
        root.style.left = "max(12px, calc((100vw - 1240px) / 2 + 8px))";
        root.classList.toggle("face-left", false);
      }
    }

    var hero = document.getElementById("top");
    var onHero = hero && docY < hero.offsetTop + hero.offsetHeight * 0.9;
    root.classList.toggle("page-poodle--on-hero", !!onHero);
  }

  function onScroll() {
    paintWalk();
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      paintPath();
      ticking = false;
    });
  }

  function pet(event) {
    root.classList.remove("is-wag", "is-hop");
    void root.offsetWidth;
    root.classList.add("is-wag", "is-hop");
    clearTimeout(wagTimer);
    wagTimer = setTimeout(function () {
      root.classList.remove("is-wag", "is-hop");
    }, 900);
    spawnHeart(event);
    if (toast) {
      toast.hidden = false;
      toast.textContent = lines[line % lines.length];
      line += 1;
      clearTimeout(pet.hideTimer);
      pet.hideTimer = setTimeout(function () {
        toast.hidden = true;
      }, 2200);
    }
    if (typeof window.poodlecircleTrack === "function") {
      window.poodlecircleTrack("hero_poodle_pet");
    }
  }

  function spawnHeart(event) {
    var rect = btn.getBoundingClientRect();
    var x = rect.width / 2;
    var y = rect.height * 0.32;
    if (event && typeof event.clientX === "number") {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    var heart = document.createElement("span");
    heart.className = "page-poodle-float";
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = "\u2665";
    heart.style.left = x + "px";
    heart.style.top = y + "px";
    root.appendChild(heart);
    heart.addEventListener("animationend", function () {
      heart.remove();
    });
  }

  btn.addEventListener("click", pet);
  btn.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pet(event);
    }
  });

  if (!reduce && pupils.length) {
    btn.addEventListener("pointermove", function (event) {
      var rect = btn.getBoundingClientRect();
      var cx = rect.left + rect.width * 0.5;
      var cy = rect.top + rect.height * 0.42;
      var dx = (event.clientX - cx) / (rect.width * 0.55);
      var dy = (event.clientY - cy) / (rect.height * 0.45);
      dx = clamp(dx, -1, 1);
      dy = clamp(dy, -1, 1);
      pupils.forEach(function (pupil) {
        pupil.setAttribute("transform", "translate(" + (dx * 2.2).toFixed(2) + " " + (dy * 1.8).toFixed(2) + ")");
      });
    });
    btn.addEventListener("pointerleave", function () {
      pupils.forEach(function (pupil) {
        pupil.setAttribute("transform", "translate(0 0)");
      });
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  var art = root.querySelector(".page-poodle-art");
  if (art && !art.complete) art.addEventListener("load", paintPath, { once: true });
  paintPath();
})();
