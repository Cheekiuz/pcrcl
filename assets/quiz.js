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
      min: 90,
      name: "The Tiny Emperor",
      emoji: "👑",
      story: "The sofa has a throne. The good blanket has been annexed. You live here on a visitor pass.",
      weakness: "A sigh from across the room",
      privilege: "The entire sofa",
      status: "Furniture with thumbs",
      closer: "There are no bad poodles. Only extremely well - served ones."
    },
    {
      min: 70,
      name: "The Velvet Dictator",
      emoji: "🛋️",
      story: "The rules exist. Your poodle has granted a few exceptions, and then kept them.",
      weakness: "Eye contact during a treat",
      privilege: "The evening lap",
      status: "Staff, with benefits",
      closer: "The dictatorship is soft. The terms are not."
    },
    {
      min: 50,
      name: "The Treat Negotiator",
      emoji: "🦴",
      story: "One more treat is a meeting. You bring the cheese. They bring the terms.",
      weakness: "A crinkly packet",
      privilege: "The last bite, always",
      status: "Chief negotiator, losing",
      closer: "You said just one. They heard the opening offer."
    },
    {
      min: 30,
      name: "The Perfectly Innocent One",
      emoji: "😇",
      story: "The routine is real. So is the face that did not touch the sandwich.",
      weakness: "Looking adorable near food",
      privilege: "The spot by your feet",
      status: "Still technically in charge",
      closer: "Innocent until the wrapper opens. Then the case reopens."
    },
    {
      min: 0,
      name: "The Tiny Auditor",
      emoji: "📋",
      story: "The schedule is real. Your poodle has reviewed it and requested several amendments.",
      weakness: "A late dinner",
      privilege: "A proper walk, on their clock",
      status: "Management, under review",
      closer: "The rules stand. The side-eye has been filed."
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

  function shareBlurb(type, score) {
    return [
      "My poodle is " + score + "% spoiled and officially " + type.name + " " + type.emoji,
      type.story,
      "Apparently, I'm " + type.status.toLowerCase() + ".",
      "",
      "What's yours? 🐩",
      QUIZ_URL
    ].join("\n");
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
    ctx.fillStyle = "#b22110";
    ctx.font = "800 54px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(score + "% SPOILED", 540, 390);
    var nameSize = fitFont(ctx, type.name, 900, 64);
    ctx.fillStyle = "#171c23";
    ctx.font = "800 " + nameSize + "px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(type.name, 540, 490);
    ctx.fillStyle = "#5b403c";
    ctx.font = "600 32px 'Plus Jakarta Sans', sans-serif";
    var storyLines = wrapCentered(ctx, type.story, 540, 590, 860, 44);
    var y = 590 + storyLines * 44 + 28;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    [
      ["MAIN WEAKNESS", type.weakness],
      ["FAVOURITE PRIVILEGE", type.privilege],
      ["HUMAN STATUS", type.status]
    ].forEach(function (row) {
      fillRound(ctx, 110, y, 860, 96, 22, "#ffffff");
      ctx.fillStyle = "#b22110";
      ctx.font = "800 18px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(row[0], 140, y + 16);
      ctx.fillStyle = "#171c23";
      ctx.font = "700 28px 'Plus Jakarta Sans', sans-serif";
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

  function shareCard(file, caption, url) {
    var payload = { title: "Poodle Circle", text: caption, url: url };
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) payload.files = [file];
    } catch (e) {}
    if (!navigator.share) return Promise.resolve("unsupported");
    return navigator.share(payload).then(function () {
      return "shared";
    }, function (error) {
      if (error && error.name === "AbortError") return "cancel";
      return "failed";
    });
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

  function pill(label, primary) {
    var el = document.createElement(primary ? "a" : "button");
    if (!primary) el.type = "button";
    el.className = "inline-flex items-center justify-center min-h-14 px-6 rounded-full text-[15px] font-semibold " +
      (primary ? "bg-primary text-white" : "bg-[#eaeef8] text-[#171c23]");
    el.textContent = label;
    return el;
  }

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

  function renderResult() {
    var score = Math.round((points / scoredMaxPoints) * 100);
    var type = typeFor(score);
    var blurb = shareBlurb(type, score);
    var cardFile = null;
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
    addText(card, "p", "quiz-score-num", score + "%");
    addText(card, "p", "quiz-score-label", "spoiled");
    addText(card, "p", "quiz-result-story", type.story);
    var stats = document.createElement("div");
    stats.className = "quiz-stats";
    [
      ["Main weakness", type.weakness],
      ["Favourite privilege", type.privilege],
      ["Human status", type.status]
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
    addText(share, "h3", "quiz-share-title", "Share your result 🐩");
    var note = document.createElement("p");
    note.className = "quiz-share-note";
    note.setAttribute("aria-live", "polite");
    share.appendChild(note);

    var grid = document.createElement("div");
    grid.className = "quiz-share-grid";

    function button(label) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "quiz-share-btn";
      el.textContent = label;
      return el;
    }

    function link(label, href) {
      var el = document.createElement("a");
      el.className = "quiz-share-btn";
      el.textContent = label;
      el.href = href;
      if (href.indexOf("mailto:") !== 0) {
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
      return el;
    }

    var canNative = typeof navigator.share === "function";
    var wide = window.matchMedia("(min-width: 760px)").matches;
    var items = {};
    items.copy = button("Copy result");
    items.copy.classList.add("share-copy");
    if (canNative) {
      items.native = button("Share");
      items.native.classList.add("share-native");
    }
    items.whatsapp = link("WhatsApp", "https://wa.me/?text=" + encodeURIComponent(blurb));
    items.whatsapp.classList.add("share-whatsapp");
    items.email = link("Email", "mailto:?subject=" + encodeURIComponent("My poodle is officially spoiled 🐩") + "&body=" + encodeURIComponent(blurb));
    items.email.classList.add("share-email");
    items.facebook = link("Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(QUIZ_URL));
    items.facebook.classList.add("share-facebook");
    var xText = "My poodle is " + score + "% spoiled and officially " + type.name + " " + type.emoji + "\nApparently, I'm " + type.status.toLowerCase() + ".\n\nWhat's yours? 🐩";
    items.x = link("X", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(xText) + "&url=" + encodeURIComponent(QUIZ_URL));
    items.x.classList.add("share-x");
    items.image = button("Save result image");
    items.image.classList.add("share-image");

    var order = wide
      ? ["copy", "email", "facebook", "x", "image", "native", "whatsapp"]
      : ["native", "whatsapp", "copy", "image", "email", "facebook", "x"];
    order.forEach(function (key) {
      if (!items[key]) return;
      grid.appendChild(items[key]);
    });
    share.appendChild(grid);
    wrap.appendChild(share);

    var again = document.createElement("button");
    again.type = "button";
    again.className = "quiz-again";
    again.textContent = "Take it again";
    wrap.appendChild(again);

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

    function showFallback() {
      fallback.hidden = false;
      fallbackCopy.focus();
      fallbackCopy.select();
    }

    items.copy.addEventListener("click", function () {
      copyText(blurb).then(function (result) {
        if (result === "copied") {
          note.textContent = "Copied! 🐩";
          fallback.hidden = true;
          return;
        }
        note.textContent = "Select the result and copy it.";
        showFallback();
      });
    });

    if (items.native) {
      items.native.addEventListener("click", function () {
        var payload = {
          title: type.name + " " + type.emoji,
          text: "My poodle is " + score + "% spoiled and officially " + type.name + " " + type.emoji + "\n\n" + type.story + "\n\nWhat's yours? 🐩",
          url: QUIZ_URL
        };
        try {
          if (cardFile && navigator.canShare && navigator.canShare({ files: [cardFile] })) payload.files = [cardFile];
        } catch (e) {}
        navigator.share(payload).then(function () {
          note.textContent = "Shared! 🐩";
        }, function (error) {
          if (error && error.name === "AbortError") return;
          copyText(blurb).then(function (result) {
            note.textContent = result === "copied" ? "Copied! 🐩" : "Select the result and copy it.";
            if (result !== "copied") showFallback();
          });
        });
      });
    }

    items.image.addEventListener("click", function () {
      var ready = cardFile
        ? Promise.resolve(cardFile)
        : document.fonts.ready.then(function () { return drawCard(type, score); }).then(function (blob) {
            if (!blob) return null;
            cardFile = new File([blob], "poodle-circle-spoiled.jpg", { type: "image/jpeg" });
            return cardFile;
          });
      ready.then(function (file) {
        if (!file) {
          note.textContent = "The image is not ready yet. Try again in a moment.";
          return;
        }
        var objectUrl = URL.createObjectURL(file);
        var a = document.createElement("a");
        a.href = objectUrl;
        a.download = "poodle-circle-spoiled.jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 1500);
        note.textContent = "Saved! 🐩";
      }).catch(function () {
        note.textContent = "The image is not ready yet. Try again in a moment.";
      });
    });

    again.addEventListener("click", function () {
      index = 0;
      points = 0;
      locked = false;
      renderQuestion();
    });

    stage.appendChild(wrap);
    window.setTimeout(function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      wrap.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 40);

    if (score >= 90) {
      ["👑", "✨", "🐾", "✨", "👑"].forEach(function (mark, i) {
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

  startBtn.addEventListener("click", function () {
    heading.hidden = true;
    progress.hidden = false;
    renderQuestion();
  });
})();
