(function () {
  var config = window.POODLE_SUPABASE || {};

  function paintTheme(button) {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (!button) return;
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.textContent = dark ? "☀" : "☾";
  }

  function bindTheme() {
    var button = document.getElementById("theme-toggle");
    paintTheme(button);
    if (!button) return;
    button.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem("poodlecircle-theme", next); } catch (e) {}
      paintTheme(button);
    });
  }

  function client() {
    if (!config.url || !config.key || !window.supabase) return null;
    return window.supabase.createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  function profileFrom(user, row) {
    var meta = (user && user.user_metadata) || {};
    var source = row || {};
    return {
      owner_name: source.owner_name || meta.owner_name || "Owner",
      puppy_name: source.puppy_name || meta.puppy_name || "",
      color: source.color || meta.color || "",
      city: source.city || meta.city || "",
      about: source.about || meta.about || "",
      photo_path: source.photo_path || meta.photo_path || "",
      email: source.email || (user && user.email) || "",
      created_at: source.created_at || (user && user.created_at) || ""
    };
  }

  function showError(node, message) {
    node.hidden = !message;
    node.textContent = message || "";
  }

  function friendly(error) {
    var message = (error && error.message) || "Something went wrong. Try again.";
    if (/already registered/i.test(message)) return "This email is already registered. Sign in to open your profile.";
    if (/invalid login/i.test(message)) return "That email and password do not match.";
    if (/email not confirmed/i.test(message)) return "Open the confirmation message, then sign in.";
    if (/password/i.test(message) && /least/i.test(message)) return "Use a password of at least 8 characters.";
    return message;
  }

  async function saveRow(sb, user, fields) {
    var payload = {
      id: user.id,
      email: user.email,
      owner_name: fields.owner_name,
      puppy_name: fields.puppy_name || null,
      color: fields.color || null,
      city: fields.city || null,
      about: fields.about || null
    };
    var saved = await sb.from("owners").upsert(payload).select().maybeSingle();
    if (saved.error) return profileFrom(user, null);
    return profileFrom(user, saved.data);
  }

  function redirectTo() {
    var host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return new URL("../profile/", window.location.href).href;
    }
    return "https://poodlecircle.com/profile/";
  }

  function hideJoinForm() {
    document.querySelector(".switch").style.setProperty("display", "none", "important");
    document.getElementById("register-panel").style.setProperty("display", "none", "important");
    document.getElementById("signin-panel").style.setProperty("display", "none", "important");
    document.getElementById("form-error").style.setProperty("display", "none", "important");
  }

  function showProfileReady(email) {
    hideJoinForm();
    document.getElementById("done-panel").hidden = false;
    document.getElementById("done-email").textContent = email;
    document.getElementById("page-kicker").textContent = "Poodle Circle";
    document.getElementById("page-title").textContent = "Your profile is ready";
    document.getElementById("page-lede").textContent = "This profile stays private. Open it after you confirm the email.";
  }

  function mountJoin() {
    bindTheme();
    var pending = null;
    var sb = client();
    if (sb) {
      sb.auth.getSession().then(function (existing) {
        if (existing.data.session) window.location.replace(redirectTo());
      });
    }
    var registerForm = document.getElementById("register-form");
    var signinForm = document.getElementById("signin-form");
    var registerPanel = document.getElementById("register-panel");
    var signinPanel = document.getElementById("signin-panel");
    var donePanel = document.getElementById("done-panel");
    var errorNode = document.getElementById("form-error");
    var registerButton = document.getElementById("show-register");
    var signinButton = document.getElementById("show-signin");

    function show(mode) {
      var signingIn = mode === "signin";
      registerPanel.hidden = signingIn;
      signinPanel.hidden = !signingIn;
      donePanel.hidden = true;
      registerButton.classList.toggle("is-on", !signingIn);
      signinButton.classList.toggle("is-on", signingIn);
      showError(errorNode, "");
    }

    registerButton.addEventListener("click", function () { show("register"); });
    signinButton.addEventListener("click", function () { show("signin"); });
    show(new URLSearchParams(window.location.search).get("mode") === "signin" ? "signin" : "register");

    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var sb = client();
      if (!sb) {
        showError(errorNode, "Registration is not connected yet. The project API key is still missing.");
        return;
      }
      var data = new FormData(registerForm);
      var fields = {
        owner_name: String(data.get("owner_name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
        puppy_name: String(data.get("puppy_name") || "").trim(),
        color: String(data.get("color") || "").trim(),
        city: String(data.get("city") || "").trim(),
        about: String(data.get("about") || "").trim()
      };
      if (!fields.owner_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
        showError(errorNode, "Add your name and a real email address.");
        return;
      }
      if (fields.password.length < 8) {
        showError(errorNode, "Use a password of at least 8 characters.");
        return;
      }
      showError(errorNode, "");
      var result = await sb.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: {
          data: fields,
          emailRedirectTo: redirectTo()
        }
      });
      if (result.error) {
        showError(errorNode, friendly(result.error));
        return;
      }
      if (result.data.session && result.data.user) {
        await saveRow(sb, result.data.user, fields);
        window.location.href = redirectTo();
        return;
      }
      pending = { email: fields.email, password: fields.password, fields: fields };
      showProfileReady(fields.email);
    });

    signinForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var sb = client();
      if (!sb) {
        showError(errorNode, "Sign in is not connected yet. The project API key is still missing.");
        return;
      }
      var data = new FormData(signinForm);
      var email = String(data.get("email") || "").trim();
      var password = String(data.get("password") || "");
      var result = await sb.auth.signInWithPassword({ email: email, password: password });
      if (result.error) {
        showError(errorNode, friendly(result.error));
        return;
      }
      window.location.href = redirectTo();
    });

    document.getElementById("done-signin").addEventListener("click", async function () {
      var doneError = document.getElementById("done-error");
      if (!pending) {
        showError(doneError, "Register again, then open your profile.");
        return;
      }
      var ready = client();
      if (!ready) {
        showError(doneError, "Registration is not connected yet. The project API key is still missing.");
        return;
      }
      var signed = await ready.auth.signInWithPassword({
        email: pending.email,
        password: pending.password
      });
      if (signed.error) {
        showError(doneError, friendly(signed.error));
        return;
      }
      await saveRow(ready, signed.data.user, pending.fields);
      window.location.href = redirectTo();
    });
  }

  function photoFailure(error) {
    var message = (error && error.message) || "";
    if (/bucket not found|not found/i.test(message)) return "Picture storage is not ready yet. The dog-photos folder still needs to be created.";
    if (/row-level security|unauthorized|403/i.test(message)) return "This picture could not be saved to your profile yet.";
    if (/mime|invalid/i.test(message)) return "Use a JPG, PNG, or WebP picture.";
    if (/size|too large|payload/i.test(message)) return "Use a picture smaller than 5 MB.";
    return "The picture did not upload. Try again.";
  }

  function paintDogPhoto(src, puppyName) {
    var img = document.getElementById("dog-photo-img");
    img.src = src;
    img.alt = puppyName ? puppyName + ", a toy poodle" : "Your toy poodle";
    img.hidden = false;
    document.getElementById("photo").classList.add("has-image");
    document.getElementById("photo-label-text").textContent = "Change picture";
  }

  function clearDogPhoto() {
    var img = document.getElementById("dog-photo-img");
    img.hidden = true;
    img.removeAttribute("src");
    document.getElementById("photo").classList.remove("has-image");
    document.getElementById("photo-label-text").textContent = "Add your dog's picture";
  }

  async function showDogPhoto(sb, path, puppyName) {
    var signed = await sb.storage.from("dog-photos").createSignedUrl(path, 60 * 60);
    if (signed.error || !signed.data || !signed.data.signedUrl) return;
    paintDogPhoto(signed.data.signedUrl, puppyName);
  }

  function formatDate(value) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  async function mountProfile() {
    bindTheme();
    var sb = client();
    var gate = document.getElementById("profile-gate");
    var card = document.getElementById("profile-card");
    if (!sb) {
      gate.hidden = false;
      document.getElementById("gate-copy").textContent = "This profile is not connected yet. The project API key is still missing.";
      return;
    }
    var code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      try { await sb.auth.exchangeCodeForSession(code); } catch (e) {}
    }
    var sessionResult = null;
    try {
      sessionResult = await sb.auth.getSession();
    } catch (e) {
      sessionResult = null;
    }
    var user = sessionResult && sessionResult.data.session && sessionResult.data.session.user;
    if (!user) {
      gate.hidden = false;
      if (/error=|otp_expired|access_denied/.test(window.location.hash + window.location.search)) {
        document.getElementById("gate-copy").textContent = "That confirmation link has expired. Sign in with your email and password.";
      }
      return;
    }
    var rowResult = await sb.from("owners").select("*").eq("id", user.id).maybeSingle();
    var profile = profileFrom(user, rowResult.error ? null : rowResult.data);
    document.getElementById("mark").textContent = profile.owner_name.slice(0, 1).toUpperCase();
    document.getElementById("owner-name").textContent = profile.owner_name;
    document.getElementById("puppy-name").textContent = profile.puppy_name || "Your toy poodle";
    var place = [profile.city, profile.color].filter(Boolean).join(" · ");
    var placeNode = document.getElementById("place");
    placeNode.hidden = !place;
    placeNode.textContent = place;
    var aboutNode = document.getElementById("about");
    aboutNode.hidden = !profile.about;
    aboutNode.textContent = profile.about ? "“" + profile.about + "”" : "";
    document.getElementById("email").textContent = profile.email;
    var joined = formatDate(profile.created_at);
    var joinedNode = document.getElementById("joined");
    joinedNode.hidden = !joined;
    joinedNode.textContent = joined ? "Registered " + joined : "";
    card.hidden = false;
    var photoPath = profile.photo_path;
    if (photoPath) await showDogPhoto(sb, photoPath, profile.puppy_name);

    document.getElementById("dog-photo").addEventListener("change", async function (event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      var photoErrorNode = document.getElementById("photo-error");
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        showError(photoErrorNode, "Use a JPG, PNG, or WebP picture.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError(photoErrorNode, "Use a picture smaller than 5 MB.");
        return;
      }
      showError(photoErrorNode, "");
      var img = document.getElementById("dog-photo-img");
      var previous = img.getAttribute("src") || "";
      var preview = URL.createObjectURL(file);
      paintDogPhoto(preview, profile.puppy_name);
      var path = user.id + "/dog";
      var uploaded = await sb.storage.from("dog-photos").upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "3600"
      });
      URL.revokeObjectURL(preview);
      if (uploaded.error) {
        if (previous && previous.indexOf("blob:") !== 0) paintDogPhoto(previous, profile.puppy_name);
        else clearDogPhoto();
        showError(photoErrorNode, photoFailure(uploaded.error));
        return;
      }
      await sb.auth.updateUser({ data: { photo_path: path } });
      await sb.from("owners").update({ photo_path: path }).eq("id", user.id);
      photoPath = path;
      profile.photo_path = path;
      await showDogPhoto(sb, path, profile.puppy_name);
    });

    document.getElementById("sign-out").addEventListener("click", async function () {
      await sb.auth.signOut();
      window.location.href = "../join/";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page");
    if (page === "join") mountJoin();
    if (page === "profile") mountProfile();
  });
})();
