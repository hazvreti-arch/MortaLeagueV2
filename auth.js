(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const backdrop = el("auth-backdrop");
  const formPanel = el("auth-form-panel");
  const profilePanel = el("profile-panel");
  const form = el("auth-form");
  const feedback = el("auth-feedback");
  const setupNote = el("auth-setup-note");
  const triggerLabel = el("account-trigger-label");
  const signupMode = { current: "login" };
  const LOGIN_DOMAIN = "accounts.mortaleague.invalid";
  let client = null;
  let currentSession = null;
  let lastFocused = null;
  let profileRequest = 0;

  function isConfigured() {
    const cfg = window.MORTA_CONFIG || {};
    return typeof cfg.supabaseUrl === "string"
      && /^https:\/\/.+/.test(cfg.supabaseUrl)
      && !cfg.supabaseUrl.includes("PASTE_")
      && typeof cfg.supabasePublishableKey === "string"
      && cfg.supabasePublishableKey.length > 15
      && !cfg.supabasePublishableKey.includes("PASTE_");
  }
  function normalizeUsername(value) { return String(value || "").trim().toLowerCase(); }
  function validUsername(value) { return /^[a-z0-9_]{3,20}$/.test(value); }
  function authIdentity(username) { return `${username}@${LOGIN_DOMAIN}`; }
  function setFeedback(message, type = "") {
    feedback.textContent = message || "";
    feedback.className = "auth-feedback" + (type ? " " + type : "");
  }
  function showModal() {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    if (currentSession) showProfile();
    else setTimeout(() => el("auth-username").focus(), 30);
  }
  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }
  function setMode(mode) {
    signupMode.current = mode === "signup" ? "signup" : "login";
    const isSignup = signupMode.current === "signup";
    el("auth-title").textContent = isSignup ? "Kendi hikâyeni başlat." : "Tekrar hoş geldin.";
    el("auth-subtitle").textContent = isSignup
      ? "Kullanıcı adını ve şifreni belirleyerek oyuncu hesabını oluştur."
      : "Kullanıcı adın ve şifrenle MortaLeague dünyasına dön.";
    el("auth-username").required = true;
    el("auth-password").autocomplete = isSignup ? "new-password" : "current-password";
    el("auth-submit").innerHTML = isSignup ? "Hesap oluştur <span>↗</span>" : "Giriş yap <span>↗</span>";
    document.querySelectorAll("[data-auth-mode]").forEach(btn => {
      const selected = btn.dataset.authMode === signupMode.current;
      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-selected", String(selected));
    });
    setFeedback("");
  }
  function showForm() {
    formPanel.hidden = false;
    profilePanel.hidden = true;
    setMode(signupMode.current);
  }
  async function loadProfile(user) {
    const requestId = ++profileRequest;
    let profile = null;
    let profileError = null;
    if (client && user) {
      const result = await client.from("profiles")
        .select("username, display_name, bio, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (requestId !== profileRequest) return;
      profile = result.data;
      profileError = result.error;
    }
    if (requestId !== profileRequest) return;
    const username = profile?.username || user?.user_metadata?.username || "oyuncu";
    const name = profile?.display_name || user?.user_metadata?.display_name || username || "MortaLeague oyuncusu";
    el("profile-name").textContent = name;
    el("profile-summary-username").textContent = "@" + username;
    el("profile-username").textContent = "@" + username;
    el("profile-avatar").textContent = (name.trim().slice(0, 2) || "ML").toUpperCase();
    el("profile-status").textContent = profileError ? "Oturum açık · profil okunamadı" : "Oturum açık";
    el("profile-feedback").textContent = profileError
      ? "Oturum açıldı ancak profil okunamadı. SQL şemasının Supabase'e uygulandığını kontrol et."
      : "";
  }
  async function showProfile() {
    formPanel.hidden = true;
    profilePanel.hidden = false;
    if (currentSession?.user) await loadProfile(currentSession.user);
    else {
      el("profile-name").textContent = "MortaLeague ziyaretçisi";
      el("profile-summary-username").textContent = "—";
      el("profile-username").textContent = "—";
      el("profile-status").textContent = "Bağlantı bekleniyor";
      el("profile-feedback").textContent = "Supabase bağlantısı kurulamadı.";
    }
  }
  function updateHeader(session) {
    currentSession = session || null;
    triggerLabel.textContent = currentSession?.user ? "Hesabım" : "Giriş Yap";
    document.querySelectorAll(".mobile-auth-nav").forEach(btn => {
      btn.textContent = currentSession?.user ? "Hesabım" : "Giriş Yap";
    });
    const trigger = el("account-trigger");
    if (trigger) trigger.setAttribute("aria-label", currentSession?.user ? "Hesabımı aç" : "Giriş yap");
    if (currentSession?.user && !backdrop.hidden) showProfile();
  }
  async function initClient() {
    if (!isConfigured()) {
      setupNote.textContent = "Supabase bağlantısı ayarlanmamış. Project URL ve publishable key'i index.html içindeki yapılandırmaya ekle.";
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setupNote.textContent = "Supabase istemci kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.";
      return;
    }
    const cfg = window.MORTA_CONFIG;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    setupNote.textContent = "Yalnızca kullanıcı adı ve şifre kullanılır. Supabase → Authentication → Sign In / Providers → Email altında e-posta doğrulaması kapalı olmalıdır.";
    const { data, error } = await client.auth.getSession();
    if (!error) updateHeader(data.session);
    client.auth.onAuthStateChange((_event, session) => updateHeader(session));
  }

  document.querySelectorAll("[data-auth-open]").forEach(btn => btn.addEventListener("click", showModal));
  el("auth-close")?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.querySelectorAll("[data-auth-mode]").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.authMode)));
  el("profile-back")?.addEventListener("click", () => { setMode("login"); showForm(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && backdrop && !backdrop.hidden) closeModal();
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    setFeedback("");
    if (!client) {
      setFeedback("Hesap sistemi bağlı değil. Supabase yapılandırmasını kontrol et.", "error");
      return;
    }
    const submit = el("auth-submit");
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = "İşleniyor…";
    const username = normalizeUsername(el("auth-username").value);
    const password = el("auth-password").value;
    try {
      if (!validUsername(username)) {
        setFeedback("Kullanıcı adı 3–20 karakter olmalı; yalnızca İngilizce harf, rakam ve alt çizgi kullan.", "error");
        return;
      }
      const email = authIdentity(username);
      if (signupMode.current === "signup") {
        if (password.length < 8) {
          setFeedback("Şifre en az 8 karakter olmalı.", "error");
          return;
        }
        const { data: existing, error: lookupError } = await client.from("profiles")
          .select("id").eq("username", username).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) {
          setFeedback("Bu kullanıcı adı alınmış. Başka bir kullanıcı adı seç.", "error");
          return;
        }
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: username } }
        });
        if (error) {
          const message = String(error.message || "");
          if (/database error saving new user|duplicate key|already registered|already been registered/i.test(message)) {
            setFeedback("Bu kullanıcı adı kullanılamıyor. Başka bir kullanıcı adı seç.", "error");
            return;
          }
          throw error;
        }
        if (data.session) {
          updateHeader(data.session);
          await showProfile();
          el("profile-feedback").textContent = "Hesabın oluşturuldu. Hoş geldin!";
        } else {
          setFeedback("Supabase e-posta doğrulaması istedi. Kullanıcı adıyla kayıt için Authentication ayarlarında e-posta doğrulamasını kapatıp yeniden dene.", "error");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          if (/invalid login credentials/i.test(String(error.message || ""))) {
            setFeedback("Kullanıcı adı veya şifre hatalı.", "error");
            return;
          }
          throw error;
        }
        updateHeader(data.session);
        await showProfile();
      }
    } catch (error) {
      setFeedback(typeof error?.message === "string" ? error.message : "İşlem tamamlanamadı. Tekrar deneyin.", "error");
    } finally {
      submit.disabled = false;
      submit.innerHTML = original;
    }
  });

  el("auth-signout")?.addEventListener("click", async () => {
    const btn = el("auth-signout");
    btn.disabled = true;
    el("profile-feedback").textContent = "Oturum kapatılıyor…";
    try {
      if (!client) { updateHeader(null); closeModal(); return; }
      const { error } = await client.auth.signOut();
      if (error) throw error;
      updateHeader(null);
      setMode("login");
      showForm();
      closeModal();
    } catch (error) {
      el("profile-feedback").textContent = error?.message || "Oturum kapatılamadı.";
    } finally {
      btn.disabled = false;
    }
  });
  setMode("login");
  initClient();
})();
