(function () {
  var board = document.getElementById("parkour-board");
  var canvas = document.getElementById("parkour-canvas");
  if (!board || !canvas) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var startEl = document.getElementById("parkour-start");
  var overEl = document.getElementById("parkour-over");
  var bannerEl = document.getElementById("parkour-banner");
  var powerEl = document.getElementById("parkour-power");
  var treatsEl = document.getElementById("parkour-treats");
  var bestEl = document.getElementById("parkour-best");
  var resultEl = document.getElementById("parkour-result");
  var timeEl = document.getElementById("parkour-time");
  var quipEl = document.getElementById("parkour-quip");

  var quips = [
    "Your poodle would like to speak to your lawyer.",
    "The vacuum cleaner wins this round.",
    "Your poodle demands compensation in treats.",
    "Honestly, that was the sofa's fault.",
    "Your poodle has requested a snack break.",
    "Still faster than most humans.",
    "Tiny legs. Massive ambition."
  ];
  var lowTypes = ["poop", "toy", "sofa", "basket"];
  var allTypes = ["vacuum", "toy", "broccoli", "sofa", "poop", "cat", "dog", "basket"];

  var viewW = 800;
  var viewH = 360;
  var mode = "ready";
  var speed = 168;
  var elapsed = 0;
  var power = 0;
  var treats = 0;
  var poodleY = 0;
  var poodleVy = 0;
  var onGround = true;
  var coyote = 0;
  var obstacles = [];
  var pickups = [];
  var clouds = [];
  var houses = [];
  var bushes = [];
  var flowers = [];
  var pops = [];
  var spawnIn = 1.35;
  var treatIn = 0.8;
  var eventIn = 16;
  var frenzyLeft = 0;
  var zoomies = 0;
  var royal = 0;
  var hit = 0;
  var clock = 0;
  var last = 0;
  var raf = 0;
  var best = 0;
  var shareText = "Poodle Power 0.";
  var shareUrl = "https://poodlecircle.com/#parkour";
  var shareBtn = document.getElementById("parkour-share");

  try { best = Number(sessionStorage.getItem("poodlecircle-parkour-best")) || 0; } catch (e) {}
  bestEl.textContent = String(best);

  function groundY() { return viewH - 52; }
  function poodleX() { return Math.max(78, Math.min(128, viewW * 0.2)); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = Math.max(280, rect.width);
    viewH = Math.max(220, rect.height);
    canvas.width = Math.floor(viewW * dpr);
    canvas.height = Math.floor(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!clouds.length) seedScenery();
  }

  function seedScenery() {
    clouds = [];
    houses = [];
    bushes = [];
    flowers = [];
    var i;
    for (i = 0; i < 4; i++) clouds.push({ x: i * 260 + 40, y: 28 + (i % 3) * 22, s: 0.7 + (i % 2) * 0.35 });
    for (i = 0; i < 3; i++) houses.push({ x: 80 + i * 340, w: 70 + (i % 2) * 24, h: 46 + (i % 3) * 10 });
    for (i = 0; i < 6; i++) bushes.push({ x: i * 180, s: 0.8 + (i % 3) * 0.15 });
    for (i = 0; i < 10; i++) flowers.push({ x: i * 90 + 20, c: i % 2 ? "#e7b7c8" : "#d9c6ef" });
  }

  function resetRun() {
    speed = 168;
    elapsed = 0;
    power = 0;
    treats = 0;
    poodleY = 0;
    poodleVy = 0;
    onGround = true;
    coyote = 0;
    obstacles = [];
    pickups = [];
    pops = [];
    spawnIn = 1.35;
    treatIn = 0.7;
    eventIn = 16;
    frenzyLeft = 0;
    zoomies = 0;
    royal = 0;
    hit = 0;
    clock = 0;
    paintHud();
  }

  function paintHud() {
    powerEl.textContent = String(Math.floor(power));
    treatsEl.textContent = String(treats);
  }

  function banner(text) {
    bannerEl.textContent = text;
    bannerEl.classList.remove("show");
    void bannerEl.offsetWidth;
    bannerEl.classList.add("show");
  }

  function popText(text, x, y) {
    var el = document.createElement("span");
    el.className = "parkour-float";
    el.textContent = text;
    el.style.left = Math.max(12, x) + "px";
    el.style.top = Math.max(48, y) + "px";
    board.appendChild(el);
    window.setTimeout(function () { el.remove(); }, 750);
  }

  function jump() {
    if (mode !== "play" || hit) return;
    if (onGround || coyote > 0) {
      poodleVy = 690;
      onGround = false;
      coyote = 0;
    }
  }

  function start() {
    resetRun();
    mode = "play";
    if (window.poodlecircleTrack) window.poodlecircleTrack("parkour_start");
    startEl.hidden = true;
    overEl.hidden = true;
    board.focus();
    last = performance.now();
  }

  function finish() {
    mode = "over";
    var score = Math.floor(power);
    var seconds = Math.max(1, Math.round(elapsed));
    if (score > best) {
      best = score;
      bestEl.textContent = String(best);
      try { sessionStorage.setItem("poodlecircle-parkour-best", String(best)); } catch (e) {}
    }
    shareText = "Poodle Power " + score + ".";
    if (window.poodlecircleTrack) window.poodlecircleTrack("parkour_score", { score: score, seconds: seconds });
    if (shareBtn) shareBtn.textContent = "Post this score";
    resultEl.textContent = shareText;
    timeEl.textContent = "You survived " + seconds + (seconds === 1 ? " second." : " seconds.");
    quipEl.textContent = quips[Math.floor(Math.random() * quips.length)];
    overEl.hidden = false;
  }

  function addObstacle(type) {
    var size = {
      vacuum: [58, 50],
      toy: [42, 44],
      broccoli: [38, 56],
      sofa: [78, 38],
      poop: [36, 28],
      cat: [50, 42],
      dog: [72, 58],
      basket: [50, 46]
    }[type];
    obstacles.push({ type: type, x: viewW + 30, w: size[0], h: size[1] });
  }

  function addTreat(kind, x, y) {
    pickups.push({ kind: kind, x: x, y: y, r: kind === "ball" ? 15 : 13 });
  }

  function arcTreats() {
    var i;
    for (i = 0; i < 5; i++) {
      addTreat("bone", viewW + 20 + i * 38, groundY() - 78 - Math.sin((i / 4) * Math.PI) * 78);
    }
  }

  function triggerEvent() {
    var roll = Math.random();
    if (roll < 0.28) {
      zoomies = 3;
      banner("ZOOMIES!!! 💨🐩");
    } else if (roll < 0.55) {
      frenzyLeft = 7;
      banner("TREAT ATTACK! 🦴🦴🦴");
    } else if (roll < 0.8) {
      addTreat("ball", viewW + 40, groundY() - 96);
      banner("THE BALL! 🎾");
    } else {
      royal = 4;
      power += 40;
      banner("ROYAL POODLE 👑");
    }
  }

  function update(dt) {
    elapsed += dt;
    clock += dt;
    if (Math.floor(elapsed / 12) > Math.floor((elapsed - dt) / 12)) speed = Math.min(360, speed * 1.075);
    var run = speed * (zoomies > 0 ? 1.85 : 1);
    if (zoomies > 0) zoomies -= dt;
    if (royal > 0) royal -= dt;

    if (onGround) coyote = 0.12;
    else coyote -= dt;
    poodleY += poodleVy * dt;
    poodleVy -= 2050 * dt;
    if (poodleY <= 0) {
      poodleY = 0;
      poodleVy = 0;
      onGround = true;
    } else onGround = false;

    power += 14 * dt * (royal > 0 ? 1.5 : 1);
    paintHud();

    sceneryStep(clouds, run * 0.22, dt);
    sceneryStep(houses, run * 0.38, dt);
    sceneryStep(bushes, run * 0.62, dt);
    sceneryStep(flowers, run, dt);

    obstacles.forEach(function (o) { o.x -= run * dt; });
    pickups.forEach(function (p) { p.x -= run * dt; });
    obstacles = obstacles.filter(function (o) { return o.x + o.w > -40; });
    pickups = pickups.filter(function (p) { return p.x > -30; });

    spawnIn -= dt;
    if (spawnIn <= 0) {
      var pool = elapsed < 10 ? lowTypes : allTypes;
      addObstacle(pool[Math.floor(Math.random() * pool.length)]);
      if (elapsed > 18 && Math.random() < 0.28) {
        window.setTimeout(function () {
          if (mode === "play") addObstacle(lowTypes[Math.floor(Math.random() * lowTypes.length)]);
        }, 280);
      }
      var gap = Math.max(0.95, 1.85 - elapsed * 0.025);
      spawnIn = gap * (168 / speed);
    }

    treatIn -= dt;
    if (treatIn <= 0) {
      if (Math.random() < 0.22) arcTreats();
      else {
        var kind = Math.random() < 0.14 ? "ball" : (Math.random() < 0.22 ? "star" : "bone");
        addTreat(kind, viewW + 10, groundY() - (kind === "bone" ? 58 : 88));
      }
      treatIn = 1.15 + Math.random() * 1.1;
    }

    if (frenzyLeft > 0) {
      frenzyLeft -= dt * 3.2;
      if (Math.random() < dt * 6) addTreat("bone", viewW + 8, groundY() - 50 - Math.random() * 90);
    }

    eventIn -= dt;
    if (eventIn <= 0) {
      triggerEvent();
      eventIn = 18 + Math.random() * 12;
    }

    var px = poodleX();
    var body = { x: px - 14, y: groundY() - 48 - poodleY, w: 34, h: 38 };
    if (zoomies <= 0) {
      obstacles.forEach(function (o) {
        var box = { x: o.x + o.w * 0.18, y: groundY() - o.h + 6, w: o.w * 0.64, h: o.h * 0.72 };
        if (overlap(body, box)) hit = 0.01;
      });
    }
    pickups.slice().forEach(function (p) {
      var dx = (p.x) - (px + 6);
      var dy = p.y - (groundY() - 30 - poodleY);
      if (dx * dx + dy * dy < (p.r + 18) * (p.r + 18)) {
        pickups.splice(pickups.indexOf(p), 1);
        treats += 1;
        if (p.kind === "ball") {
          power += 50;
          popText("🎾 +50", p.x, p.y - 10);
        } else if (p.kind === "star") {
          power += 30;
          popText("⭐ +30", p.x, p.y - 10);
        } else {
          power += 10;
        }
      }
    });

    if (hit) {
      hit += dt;
      if (hit > 0.45) finish();
    }
  }

  function sceneryStep(list, pxPerSec, dt) {
    list.forEach(function (item) {
      item.x -= pxPerSec * dt;
    });
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function blob(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPoodle() {
    var x = poodleX();
    var y = groundY() - poodleY;
    var bob = onGround && !hit && !reduced ? Math.abs(Math.sin(clock * 12)) * 3.5 : 0;
    ctx.save();
    ctx.translate(x, y - bob);
    if (!onGround && !hit) ctx.rotate(-0.38);
    if (hit) ctx.rotate(0.55);
    ctx.strokeStyle = "#c9896a";
    ctx.lineWidth = 3.4;
    ctx.lineCap = "round";
    var phase = reduced ? 0.4 : clock * 14;
    [[-10, 0], [-3, Math.PI], [7, 0.6], [14, Math.PI + 0.6]].forEach(function (leg) {
      var swing = onGround && !hit ? Math.sin(phase + leg[1]) * 6 : -7;
      ctx.beginPath();
      ctx.moveTo(leg[0], -10);
      ctx.lineTo(leg[0] + swing, 2);
      ctx.stroke();
    });
    ctx.fillStyle = "#f6d3bc";
    blob(-26, -30, 9);
    ctx.fillStyle = "#f3c2a4";
    blob(-4, -24, 12);
    blob(8, -22, 14);
    blob(2, -16, 13);
    blob(20, -38, 14);
    ctx.fillStyle = "#e7ae8a";
    blob(8, -46, 10);
    blob(30, -44, 10);
    ctx.fillStyle = "#2c241f";
    blob(15, -39, 1.7);
    blob(23, -39, 1.7);
    if (hit) {
      ctx.strokeStyle = "#2c241f";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(13, -41);
      ctx.lineTo(17, -37);
      ctx.moveTo(17, -41);
      ctx.lineTo(13, -37);
      ctx.moveTo(21, -41);
      ctx.lineTo(25, -37);
      ctx.moveTo(25, -41);
      ctx.lineTo(21, -37);
      ctx.stroke();
    }
    ctx.fillStyle = "#2c241f";
    ctx.beginPath();
    ctx.ellipse(19, -33, 2.3, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(226, 120, 110, 0.5)";
    blob(11, -33, 2.3);
    blob(27, -33, 2.3);
    if (royal > 0) {
      ctx.fillStyle = "#e2b657";
      ctx.beginPath();
      ctx.moveTo(10, -52);
      ctx.lineTo(14, -62);
      ctx.lineTo(19, -52);
      ctx.lineTo(24, -62);
      ctx.lineTo(29, -52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (hit) {
      ctx.fillStyle = "#b22110";
      ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("OH NO!", x - 18, y - 78);
    }
  }

  function drawObstacle(o) {
    var x = o.x;
    var y = groundY() - o.h;
    ctx.save();
    if (o.type === "vacuum") {
      ctx.fillStyle = "#d9dee8";
      roundRect(x, y + 10, 46, 28, 10); ctx.fill();
      ctx.fillStyle = "#b22110";
      blob(x + 16, y + 22, 4);
      ctx.strokeStyle = "#8d93a3";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 18);
      ctx.quadraticCurveTo(x + 58, y - 6, x + 36, y + 4);
      ctx.stroke();
      ctx.fillStyle = "#5c616e";
      blob(x + 12, y + 40, 6);
      blob(x + 34, y + 40, 6);
    } else if (o.type === "toy") {
      ctx.fillStyle = "#f2d36b";
      blob(x + 20, y + 24, 18);
      ctx.fillStyle = "#2c241f";
      blob(x + 14, y + 20, 2);
      blob(x + 26, y + 20, 2);
      ctx.strokeStyle = "#2c241f";
      ctx.beginPath();
      ctx.arc(x + 20, y + 26, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (o.type === "broccoli") {
      ctx.strokeStyle = "#7d9a62";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 54);
      ctx.lineTo(x + 18, y + 24);
      ctx.stroke();
      ctx.fillStyle = "#8fb56a";
      blob(x + 10, y + 18, 12);
      blob(x + 26, y + 16, 13);
      blob(x + 18, y + 8, 11);
    } else if (o.type === "sofa") {
      ctx.fillStyle = "#e7d3ea";
      roundRect(x, y + 12, 74, 24, 10); ctx.fill();
      ctx.fillStyle = "#f7e7f4";
      roundRect(x + 6, y + 6, 28, 16, 8); ctx.fill();
      roundRect(x + 40, y + 6, 28, 16, 8); ctx.fill();
      ctx.fillStyle = "#c7b0c4";
      blob(x + 10, y + 38, 4);
      blob(x + 64, y + 38, 4);
    } else if (o.type === "poop") {
      ctx.fillStyle = "#8b5a3c";
      blob(x + 18, y + 20, 12);
      blob(x + 12, y + 12, 8);
      blob(x + 24, y + 10, 7);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      blob(x + 14, y + 10, 2);
    } else if (o.type === "cat") {
      ctx.fillStyle = "#f0b089";
      blob(x + 24, y + 26, 16);
      blob(x + 24, y + 10, 11);
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 8);
      ctx.lineTo(x + 18, y - 4);
      ctx.lineTo(x + 22, y + 8);
      ctx.moveTo(x + 26, y + 8);
      ctx.lineTo(x + 30, y - 4);
      ctx.lineTo(x + 34, y + 8);
      ctx.fill();
      ctx.fillStyle = "#2c241f";
      blob(x + 20, y + 10, 1.5);
      blob(x + 28, y + 10, 1.5);
      ctx.strokeStyle = "#f0b089";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 24);
      ctx.quadraticCurveTo(x - 4, y + 8, x + 10, y + 14);
      ctx.stroke();
    } else if (o.type === "dog") {
      ctx.fillStyle = "#d8b48a";
      roundRect(x + 8, y + 18, 52, 28, 14); ctx.fill();
      blob(x + 54, y + 16, 14);
      ctx.fillStyle = "#c49a72";
      blob(x + 44, y + 8, 8);
      blob(x + 64, y + 10, 8);
      ctx.fillStyle = "#2c241f";
      blob(x + 58, y + 14, 1.6);
      ctx.fillStyle = "#2c241f";
      ctx.fillRect(x + 16, y + 42, 4, 12);
      ctx.fillRect(x + 46, y + 42, 4, 12);
    } else {
      ctx.fillStyle = "#e6d2b8";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + 44, y + 8);
      ctx.lineTo(x + 50, y + 44);
      ctx.lineTo(x + 2, y + 44);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#c9b296";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 10);
      ctx.lineTo(x + 14, y + 42);
      ctx.moveTo(x + 30, y + 10);
      ctx.lineTo(x + 30, y + 42);
      ctx.stroke();
      ctx.fillStyle = "#f4b4c4";
      blob(x + 20, y + 6, 6);
      ctx.fillStyle = "#b9d4f2";
      blob(x + 32, y + 4, 5);
    }
    ctx.restore();
  }

  function drawTreat(p) {
    var bob = reduced ? 0 : Math.sin(clock * 5 + p.x) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    if (p.kind === "ball") {
      ctx.fillStyle = "#d6e26a";
      blob(0, 0, 12);
      ctx.strokeStyle = "#f7f7f2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0.4, 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 7, 2.2, 3.3);
      ctx.stroke();
    } else if (p.kind === "star") {
      ctx.fillStyle = "#e2b657";
      ctx.beginPath();
      var i;
      for (i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        var b = a + Math.PI / 5;
        if (i === 0) ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
        else ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.lineTo(Math.cos(b) * 5, Math.sin(b) * 5);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#e0a15a";
      roundRect(-11, -5, 22, 10, 5);
      ctx.fill();
      blob(-11, 0, 6);
      blob(11, 0, 6);
    }
    ctx.restore();
  }

  function drawWorld() {
    var sky = ctx.createLinearGradient(0, 0, 0, viewH);
    sky.addColorStop(0, "#f3efe8");
    sky.addColorStop(1, "#e4eaf6");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewW, viewH);

    clouds.forEach(function (c) {
      if (c.x < -120) c.x = viewW + 40;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      blob(c.x, c.y, 18 * c.s);
      blob(c.x + 16 * c.s, c.y + 4, 14 * c.s);
      blob(c.x - 16 * c.s, c.y + 6, 12 * c.s);
    });

    houses.forEach(function (h) {
      if (h.x < -140) h.x = viewW + 80;
      var base = groundY() - h.h - 8;
      ctx.fillStyle = "#efe4f2";
      roundRect(h.x, base, h.w, h.h, 6);
      ctx.fill();
      ctx.fillStyle = "#e7b7c8";
      ctx.beginPath();
      ctx.moveTo(h.x - 6, base + 8);
      ctx.lineTo(h.x + h.w / 2, base - 16);
      ctx.lineTo(h.x + h.w + 6, base + 8);
      ctx.fill();
    });

    bushes.forEach(function (b) {
      if (b.x < -80) b.x = viewW + 30;
      ctx.fillStyle = "#d5e3c4";
      blob(b.x, groundY() - 10, 16 * b.s);
      blob(b.x + 14, groundY() - 6, 12 * b.s);
    });

    ctx.fillStyle = "#e7d3c0";
    ctx.fillRect(0, groundY(), viewW, viewH - groundY());
    ctx.fillStyle = "#d7e4c8";
    ctx.fillRect(0, groundY(), viewW, 8);

    flowers.forEach(function (f) {
      if (f.x < -20) f.x = viewW + 16;
      ctx.fillStyle = f.c;
      blob(f.x, groundY() - 4, 3.5);
    });

    ctx.fillStyle = "rgba(44, 36, 31, 0.08)";
    ctx.beginPath();
    ctx.ellipse(poodleX(), groundY() + 4, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    pickups.forEach(drawTreat);
    obstacles.forEach(drawObstacle);
    drawPoodle();
  }

  function frame(now) {
    var dt = Math.min(0.032, (now - last) / 1000 || 0);
    last = now;
    if (mode === "ready" && !reduced) clock += dt;
    if (mode === "play" && !hit) update(dt);
    else if (mode === "play" && hit) {
      hit += dt;
      if (hit > 0.45) finish();
    }
    resize();
    drawWorld();
    raf = requestAnimationFrame(frame);
  }

  document.getElementById("parkour-start-btn").addEventListener("click", function (event) {
    event.stopPropagation();
    start();
  });
  startEl.addEventListener("pointerdown", function (event) {
    if (event.target.closest("button")) return;
    event.preventDefault();
    start();
  });
  document.getElementById("parkour-again").addEventListener("click", function (event) {
    event.stopPropagation();
    start();
  });
  if (shareBtn) {
    shareBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      event.preventDefault();
      var post = window.poodlecirclePost;
      if (!post) return;
      if (window.poodlecircleTrack) window.poodlecircleTrack("parkour_share");
      post(shareText, shareUrl).then(function (result) {
        if (result === "cancel") return;
        shareBtn.textContent = result === "shared" ? "Shared." : result === "copied" ? "Copied." : "Could not copy that.";
      }).catch(function () {
        shareBtn.textContent = "Could not copy that.";
      });
    });
  }
  board.addEventListener("pointerdown", function (event) {
    if (event.target.closest("button, a, .parkour-overlay")) return;
    board.focus();
    if (mode === "ready") start();
    else jump();
  });
  window.addEventListener("keydown", function (event) {
    if (event.code !== "Space" && event.code !== "Enter") return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    var playing = mode === "play";
    var focused = board.contains(document.activeElement) || document.activeElement === board;
    if (!playing && !focused && event.code === "Enter") return;
    if (!playing && !focused && event.code === "Space") return;
    event.preventDefault();
    if (mode !== "play") start();
    else if (!event.repeat) jump();
  });

  window.addEventListener("resize", resize);
  resize();
  drawWorld();
  raf = requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", function () {
    last = performance.now();
  });
})();
