(function () {
  if (!document.getElementById("quiz")) return;
  var questions = [
    { text: "Where does your poodle sleep?", mood: "Be honest. The dog is watching.", answers: [
      ["In their own bed. Obviously.", 0],
      ["In my bed.", 1],
      ["Wherever they decide. I just pay the mortgage.", 2]
    ]},
    { text: "How many toys does your poodle have?", mood: "A basket is not a number.", answers: [
      ["A reasonable number.", 0],
      ["More than my shoes.", 1],
      ["We don't count anymore.", 2]
    ]},
    { text: "Your poodle refuses to walk. What happens?", mood: "Selective hearing is a breed talent.", answers: [
      ["I encourage them to continue.", 0],
      ["I negotiate.", 1],
      ["I carry the tiny aristocrat home.", 2]
    ]},
    { text: "Who gets the best spot on the sofa?", mood: "This one is not really a question.", answers: [
      ["Whoever gets there first.", 0],
      ["My poodle.", 1],
      ["I am apparently just furniture now.", 2]
    ]},
    { text: "Your poodle hears a snack wrapper from another room.", mood: "The ears work when cheese is involved.", answers: [
      ["They come running.", 0],
      ["They teleport.", 1],
      ["They were already standing next to me.", 2]
    ]},
    { text: "Dinner is three minutes late.", mood: "Three minutes is a scandal.", answers: [
      ["They wait.", 0],
      ["They stare, personally wounded.", 1],
      ["I have already apologised.", 2]
    ]},
    { text: "Who is actually in charge at home?", mood: "Almost done. You already know.", answers: [
      ["Me.", 0],
      ["It's complicated.", 1],
      ["The poodle. Obviously.", 2]
    ]}
  ];
  var types = [
    {
      id: "sofa_sovereign",
      min: 90,
      name: "The Sofa Sovereign",
      emoji: "🛋️",
      story: "The good cushion has a flag. You may sit, if you ask nicely and bring cheese.",
      traits: ["The good cushion", "Blanket annexation", "Furniture with thumbs"],
      weakness: "A blink that feels like a summons",
      challenge: "Leave the cushion empty for one evening",
      closer: "The household runs on eye contact.",
      ctaId: "circle",
      ctaPath: "#dogs",
      ctaLabel: "The Circle",
      ctaNote: "A photo, a name, and one true sentence. The court can take it from there.",
      ctaText: "Introduce your poodle"
    },
    {
      id: "cheese_parliament",
      min: 70,
      name: "The Cheese Parliament",
      emoji: "🧀",
      story: "A wrapper is a summons. You were already walking to the meeting.",
      traits: ["Wrapper summons", "Unanimous snacks", "Dinner amendments"],
      weakness: "Any crinkle in the house",
      challenge: "Put the cheese away before the meeting is called",
      closer: "The vote is yes. The vote is cheese.",
      ctaId: "circle",
      ctaPath: "#dogs",
      ctaLabel: "The Circle",
      ctaNote: "The committee would like an official seat.",
      ctaText: "Introduce your poodle"
    },
    {
      id: "treat_diplomat",
      min: 50,
      name: "The Treat Diplomat",
      emoji: "🦴",
      story: "You said just one. They heard an opening offer and sent a counter.",
      traits: ["Opening offers", "Patient staring", "Crumbs as signatures"],
      weakness: "The bite that was never the last",
      challenge: "Name the last treat out loud, then stop",
      closer: "You opened the meeting. They closed it.",
      ctaId: "first_30_days",
      ctaPath: "first-30-days/#week-1",
      ctaLabel: "The first 30 days",
      ctaNote: "When the treaty is signed, the month is still waiting.",
      ctaText: "Start the first 30 days"
    },
    {
      id: "innocent_bystander",
      min: 30,
      name: "The Innocent Bystander",
      emoji: "😇",
      story: "They were nowhere near the sandwich. The crumbs have retained counsel.",
      traits: ["Clean conscience", "Perfect timing", "Standing by the plate"],
      weakness: "Looking adorable at the exact wrong moment",
      challenge: "Give the compliment after the plate is cleared",
      closer: "Innocent until the wrapper opens.",
      ctaId: "first_30_days",
      ctaPath: "first-30-days/#week-1",
      ctaLabel: "The first 30 days",
      ctaNote: "When the case rests, the first month is still here.",
      ctaText: "Start the first 30 days"
    },
    {
      id: "house_manager",
      min: 0,
      name: "The House Manager",
      emoji: "📋",
      story: "The routine is real. Your poodle has reviewed it and filed a few notes.",
      traits: ["On-time walks", "Filed sighs", "A reviewed schedule"],
      weakness: "Dinner, three minutes late",
      challenge: "Keep dinner on the clock you already chose",
      closer: "The clock is kept. The sigh is just punctuation.",
      ctaId: "first_30_days",
      ctaPath: "first-30-days/#week-1",
      ctaLabel: "The first 30 days",
      ctaNote: "The routine already has a home.",
      ctaText: "Start the first 30 days"
    }
  ];
  var quizTotal = questions.length;
  var scoredTotal = questions.filter(function (q) { return !q.route; }).length;
  var scoredMaxPoints = scoredTotal * 2;

  var heading = document.getElementById("quiz-heading");
  var stage = document.getElementById("quiz-stage");
  var progress = document.getElementById("quiz-progress");
  var step = document.getElementById("quiz-step");
  var mood = document.getElementById("quiz-mood");
  var bar = document.getElementById("quiz-bar");
  var startBtn = document.getElementById("quiz-start");
  var index = 0;
  var points = 0;
  var locked = false;
  var RESULT_KEY = "poodlecircle-quiz-result";

  function typeFor(score) {
    return types.find(function (type) { return score >= type.min; });
  }

  function addText(parent, tag, className, text) {
    var node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function fillRound(ctx, x, y, w, h, r, color) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function fitFont(ctx, text, maxWidth, start) {
    var size = start;
    while (size > 42) {
      ctx.font = "800 " + size + "px 'Plus Jakarta Sans', sans-serif";
      if (ctx.measureText(text).width <= maxWidth) return size;
      size -= 2;
    }
    return size;
  }

  function wrapCentered(ctx, text, x, y, maxWidth, lineHeight) {
    var words = text.split(" ");
    var lines = [];
    var line = "";
    words.forEach(function (word) {
      var next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    lines.forEach(function (ln, i) {
      ctx.fillText(ln, x, y + i * lineHeight);
    });
    return lines.length;
  }


  var QUIZ_URL = "https://poodlecircle.com/quiz/";

  function plainName(type) {
    return type.name.replace(/^The /, "");
  }

  function shareLine(type) {
    var name = plainName(type);
    var article = /^[aeiou]/i.test(name) ? "an" : "a";
    return "My toy poodle is officially " + article + " " + name + " " + type.emoji;
  }

  function shareClipboard(type) {
    return shareLine(type) + "\nWhat's yours?\npoodlecircle.com/quiz";
  }

  function onQuizPage() {
    return /\/quiz(\/|\/index\.html)?$/.test(window.location.pathname);
  }

  function localHref(path) {
    if (path.charAt(0) === "#") return onQuizPage() ? ".." + path : path;
    return (onQuizPage() ? "../" : "") + path;
  }

  function saveResult(value) {
    try { sessionStorage.setItem(RESULT_KEY, String(value)); } catch (e) {}
  }

  function readResult() {
    try {
      var raw = sessionStorage.getItem(RESULT_KEY);
      if (raw == null || raw === "") return null;
      var n = Number(raw);
      if (!isFinite(n) || n < 0 || n > scoredMaxPoints) return null;
      return n;
    } catch (e) {
      return null;
    }
  }

  function clearResult() {
    try { sessionStorage.removeItem(RESULT_KEY); } catch (e) {}
  }

  function drawCard(type, score) {
    var canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    var ctx = canvas.getContext("2d");
    var wash = ctx.createLinearGradient(0, 0, 180, 1350);
    wash.addColorStop(0, "#fff6f3");
    wash.addColorStop(0.55, "#f6f1ea");
    wash.addColorStop(1, "#f0f4fd");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#b22110";
    ctx.font = "800 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("POODLE CIRCLE", 540, 118);
    ctx.font = "104px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
    ctx.fillText(type.emoji, 540, 250);
    var nameSize = fitFont(ctx, type.name, 900, 72);
    ctx.fillStyle = "#171c23";
    ctx.font = "800 " + nameSize + "px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(type.name, 540, 400);
    ctx.fillStyle = "#b22110";
    ctx.font = "800 28px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(score + "% SPOILED", 540, 470);
    ctx.fillStyle = "#5b403c";
    ctx.font = "600 32px 'Plus Jakarta Sans', sans-serif";
    var storyLines = wrapCentered(ctx, type.story, 540, 540, 860, 44);
    var y = 540 + storyLines * 44 + 36;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    [
      ["KNOWN FOR", type.traits.join(" · ")],
      ["WEAKNESS", type.weakness],
      ["NEXT CHALLENGE", type.challenge]
    ].forEach(function (row) {
      fillRound(ctx, 110, y, 860, 96, 22, "#ffffff");
      ctx.fillStyle = "#b22110";
      ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(row[0], 140, y + 16);
      ctx.fillStyle = "#171c23";
      var valueSize = 28;
      ctx.font = "700 " + valueSize + "px 'Plus Jakarta Sans', sans-serif";
      while (valueSize > 18 && ctx.measureText(row[1]).width > 800) {
        valueSize -= 1;
        ctx.font = "700 " + valueSize + "px 'Plus Jakarta Sans', sans-serif";
      }
      ctx.fillText(row[1], 140, y + 46);
      y += 112;
    });
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#5b403c";
    ctx.font = "italic 600 30px 'Plus Jakarta Sans', sans-serif";
    var closerLines = wrapCentered(ctx, type.closer.replace(/ - /g, "\u00A0-\u00A0"), 540, y + 56, 860, 42);
    ctx.fillStyle = "#b22110";
    ctx.font = "700 26px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("poodlecircle.com/quiz", 540, Math.min(y + 56 + closerLines * 42 + 64, 1270));
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, "image/jpeg", 0.88);
    });
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(function () {
        return "copied";
      }, function () {
        return legacyCopy(value);
      });
    }
    return legacyCopy(value);
  }

  function legacyCopy(value) {
    var area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    area.remove();
    return Promise.resolve(ok ? "copied" : "failed");
  }

  function postResult(text, url) {
    if (navigator.share) {
      return navigator.share({ title: "Poodle Circle", text: text, url: url }).then(function () {
        return "shared";
      }, function (error) {
        if (error && error.name === "AbortError") return "cancel";
        return copyText(text + "\n" + url);
      });
    }
    return copyText(text + "\n" + url);
  }
  window.poodlecirclePost = postResult;

  function trackQuiz(name, params) {
    if (window.poodlecircleTrack) window.poodlecircleTrack(name, params);
  }

  function renderQuestion() {
    var q = questions[index];
    if (index === 0) trackQuiz("quiz_start");
    heading.hidden = true;
    step.textContent = "Question " + (index + 1) + " of " + quizTotal;
    mood.textContent = q.mood;
    bar.style.width = Math.round((index / quizTotal) * 100) + "%";
    stage.innerHTML = "";
    var title = document.createElement("h3");
    title.className = "quiz-q";
    title.textContent = q.text;
    var list = document.createElement("div");
    list.className = "quiz-answers";
    q.answers.forEach(function (answer) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-answer";
      b.textContent = answer[0];
      b.addEventListener("click", function () { choose(answer[1], b); });
      list.appendChild(b);
    });
    stage.appendChild(title);
    stage.appendChild(list);
    stage.classList.remove("is-leaving");
  }

  function choose(value, chosen) {
    if (locked) return;
    locked = true;
    points += value;
    chosen.classList.add("is-picked");
    window.setTimeout(function () {
      stage.classList.add("is-leaving");
      window.setTimeout(function () {
        index += 1;
        locked = false;
        if (index >= questions.length) renderResult();
        else renderQuestion();
      }, 220);
    }, 240);
  }

  function renderResult(options) {
    var fromStore = options && options.points != null;
    var scorePoints = fromStore ? options.points : points;
    var score = Math.round((scorePoints / scoredMaxPoints) * 100);
    var type = typeFor(score);
    var blurb = shareClipboard(type);
    var cardFile = null;
    if (!fromStore) {
      saveResult(points);
      trackQuiz("quiz_complete", { result_name: type.id, score: score });
    }
    heading.hidden = true;
    progress.hidden = false;
    bar.style.width = "100%";
    step.textContent = "Your result";
    mood.textContent = "Your poodle has a title.";
    stage.innerHTML = "";
    stage.classList.remove("is-leaving");

    var wrap = document.createElement("div");
    wrap.className = "relative quiz-pop";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Quiz result");

    var card = document.createElement("div");
    card.className = "quiz-result-card";
    addText(card, "p", "quiz-brand", "Poodle Circle");
    addText(card, "p", "quiz-emoji", type.emoji).setAttribute("aria-hidden", "true");
    addText(card, "h3", "quiz-result-type", type.name);
    addText(card, "p", "quiz-score-num", score + "% spoiled");
    addText(card, "p", "quiz-result-story", type.story);
    var traits = document.createElement("div");
    traits.className = "quiz-traits";
    type.traits.forEach(function (trait) {
      addText(traits, "span", "quiz-trait", trait);
    });
    card.appendChild(traits);
    var stats = document.createElement("div");
    stats.className = "quiz-stats";
    [
      ["Weakness", type.weakness],
      ["Your next challenge", type.challenge]
    ].forEach(function (row) {
      var stat = document.createElement("div");
      stat.className = "quiz-stat";
      addText(stat, "span", "quiz-stat__label", row[0]);
      addText(stat, "span", "quiz-stat__value", row[1]);
      stats.appendChild(stat);
    });
    card.appendChild(stats);
    addText(card, "p", "quiz-closer", type.closer);
    addText(card, "p", "quiz-card-url", "poodlecircle.com/quiz");
    wrap.appendChild(card);

    var share = document.createElement("section");
    share.className = "quiz-share";
    share.setAttribute("aria-label", "Share your result");
    var shareBtn = document.createElement("button");
    shareBtn.type = "button";
    shareBtn.className = "quiz-share-main";
    shareBtn.textContent = "Share my result";
    share.appendChild(shareBtn);
    var note = document.createElement("p");
    note.className = "quiz-share-note";
    note.setAttribute("aria-live", "polite");
    share.appendChild(note);
    wrap.appendChild(share);

    var fallback = document.createElement("div");
    fallback.className = "quiz-share-fallback";
    fallback.hidden = true;
    var fallbackNote = document.createElement("p");
    fallbackNote.textContent = "Select the lines below, then copy them.";
    var fallbackCopy = document.createElement("textarea");
    fallbackCopy.className = "quiz-share-copy";
    fallbackCopy.readOnly = true;
    fallbackCopy.value = blurb;
    fallback.appendChild(fallbackNote);
    fallback.appendChild(fallbackCopy);
    wrap.appendChild(fallback);

    var next = document.createElement("section");
    next.className = "quiz-challenge";
    addText(next, "p", "quiz-challenge__label", type.ctaLabel);
    addText(next, "p", "quiz-challenge__title", type.ctaNote);
    var go = document.createElement("a");
    go.className = "quiz-challenge__go";
    go.href = localHref(type.ctaPath);
    go.textContent = type.ctaText;
    go.addEventListener("click", function () {
      trackQuiz("quiz_cta", { result_name: type.id, cta: type.ctaId });
    });
    next.appendChild(go);
    wrap.appendChild(next);

    var again = document.createElement("button");
    again.type = "button";
    again.className = "quiz-again";
    again.textContent = "Take it again";
    wrap.appendChild(again);

    function showFallback() {
      fallback.hidden = false;
      fallbackCopy.focus();
      fallbackCopy.select();
    }

    function afterCopy(result) {
      if (result === "copied") {
        note.textContent = "Copied.";
        fallback.hidden = true;
        trackQuiz("quiz_share", { result_name: type.id, method: "copy" });
        return;
      }
      note.textContent = "Select the result and copy it.";
      showFallback();
    }

    shareBtn.addEventListener("click", function () {
      var payload = {
        title: "How spoiled is your poodle?",
        text: shareLine(type) + "\nWhat's yours?",
        url: QUIZ_URL
      };
      try {
        if (cardFile && navigator.canShare && navigator.canShare({ files: [cardFile] })) payload.files = [cardFile];
      } catch (e) {}
      if (typeof navigator.share === "function") {
        navigator.share(payload).then(function () {
          note.textContent = "Shared.";
          trackQuiz("quiz_share", { result_name: type.id, method: "native" });
        }, function (error) {
          if (error && error.name === "AbortError") return;
          copyText(blurb).then(afterCopy);
        });
        return;
      }
      copyText(blurb).then(afterCopy);
    });

    again.addEventListener("click", function () {
      clearResult();
      index = 0;
      points = 0;
      locked = false;
      renderQuestion();
    });

    stage.appendChild(wrap);
    if (!fromStore || onQuizPage()) {
      window.setTimeout(function () {
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        wrap.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }, 40);
    }

    if (score >= 90) {
      ["✨", "🐾", "✨", "🐾", "✨"].forEach(function (mark, i) {
        var spark = document.createElement("span");
        spark.className = "quiz-float";
        spark.setAttribute("aria-hidden", "true");
        spark.textContent = mark;
        spark.style.left = (12 + i * 18) + "%";
        spark.style.top = "18px";
        spark.style.animationDelay = (i * 0.12) + "s";
        card.appendChild(spark);
      });
    }

    document.fonts.ready.then(function () {
      return drawCard(type, score);
    }).then(function (blob) {
      if (blob) cardFile = new File([blob], "poodle-circle-spoiled.jpg", { type: "image/jpeg" });
    }).catch(function () {});
  }

  var stored = readResult();
  if (stored != null) renderResult({ points: stored });

  startBtn.addEventListener("click", function () {
    clearResult();
    heading.hidden = true;
    progress.hidden = false;
    renderQuestion();
  });
})();
