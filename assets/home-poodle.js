(function () {
  var root = document.getElementById("hero-poodle");
  if (!root) return;
  var btn = root.querySelector(".hero-poodle-btn");
  if (!btn) return;
  var toast = root.querySelector(".hero-poodle-toast");
  var pupils = root.querySelectorAll(".hero-poodle-pupil");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lines = [
    "Good pet.",
    "Tiny tail emergency.",
    "Boof.",
    "More pets, please.",
    "You may keep worrying about puddles."
  ];
  var line = 0;
  var wagTimer;

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
      }, 2400);
    }
    if (typeof window.poodlecircleTrack === "function") {
      window.poodlecircleTrack("hero_poodle_pet");
    }
  }

  function spawnHeart(event) {
    var rect = btn.getBoundingClientRect();
    var x = rect.width / 2;
    var y = rect.height * 0.35;
    if (event && typeof event.clientX === "number") {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    var heart = document.createElement("span");
    heart.className = "hero-poodle-float";
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
      var cy = rect.top + rect.height * 0.36;
      var dx = (event.clientX - cx) / (rect.width * 0.45);
      var dy = (event.clientY - cy) / (rect.height * 0.35);
      dx = Math.max(-1, Math.min(1, dx));
      dy = Math.max(-1, Math.min(1, dy));
      pupils.forEach(function (pupil) {
        pupil.setAttribute("transform", "translate(" + (dx * 3.5).toFixed(2) + " " + (dy * 2.5).toFixed(2) + ")");
      });
    });
    btn.addEventListener("pointerleave", function () {
      pupils.forEach(function (pupil) {
        pupil.setAttribute("transform", "translate(0 0)");
      });
    });
  }
})();
