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

  function setFeedback(message, type = "") {
    feedback.textContent = message || "";
    feedback.className = "auth-feedback" + (type ? " " + type : "");
  }

  function showModal() {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    if (currentSession) showProfile();
    else setTimeout(() => el("auth-email").focus(), 30);
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
      ? "Oyuncu hesabını oluştur ve MortaLeague evrenine katıl."
      : "Hesabına giriş yap ve MortaLeague dünyasına dön.";
    el("display-name-wrap").hidden = !isSignup;
    el("username-wrap").hidden = !isSignup;
    el("auth-display-name").required = isSignup;
    el("auth-username").required = isSignup;
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
    const name = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "MortaLeague oyuncusu";
    const username = profile?.username || user?.user_metadata?.username || "—";
    el("profile-name").textContent = name;
    el("profile-email").textContent = user?.email || "—";
    el("profile-username").textContent = username === "—" ? "Hazırlanıyor" : "@" + username;
    el("profile-avatar").textContent = (name.trim().slice(0, 2) || "ML").toUpperCase();
    el("profile-status").textContent = profileError
      ? "Oturum açık · profil okunamadı"
      : "Oturum açık";
    el("profile-feedback").textContent = profileError
      ? "Oturum açıldı ancak profil tablosu okunamadı. SQL şemasının Supabase'e uygulandığını kontrol et."
      : "";
  }

  async function showProfile() {
    formPanel.hidden = true;
    profilePanel.hidden = false;
    if (currentSession?.user) await loadProfile(currentSession.user);
    else {
      el("profile-name").textContent = "MortaLeague ziyaretçisi";
      el("profile-email").textContent = "Henüz oturum açılmadı";
      el("profile-username").textContent = "—";
      el("profile-status").textContent = "Supabase bağlantısı bekleniyor";
      el("profile-feedback").textContent = "Önce yeni Supabase projesi oluşturulmalı ve yapılandırma eklenmeli.";
    }
  }

  function updateHeader(session) {
    currentSession = session || null;
    triggerLabel.textContent = currentSession?.user ? "Hesabım" : "Giriş Yap";
    const trigger = el("account-trigger");
    if (trigger) trigger.setAttribute("aria-label", currentSession?.user ? "Hesabımı aç" : "Giriş yap");
    if (currentSession?.user && !backdrop.hidden) showProfile();
  }

  async function initClient() {
    if (!isConfigured()) {
      setupNote.textContent = "Supabase bağlantısı henüz yapılandırılmadı. Yeni projenin Project URL ve publishable/anon anahtarı js/config.js dosyasına eklenince hesap işlemleri etkinleşecek.";
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setupNote.textContent = "Supabase istemci kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.";
      return;
    }
    const cfg = window.MORTA_CONFIG;
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    setupNote.textContent = "Supabase bağlantısı yapılandırıldı. Kayıt ve giriş için SQL şemasının projeye uygulanmış olması gerekir.";
    const { data, error } = await client.auth.getSession();
    if (!error) updateHeader(data.session);
    client.auth.onAuthStateChange((_event, session) => {
      updateHeader(session);
    });
  }

  el("account-trigger")?.addEventListener("click", () => {
    showModal();
  });
  document.querySelectorAll("[data-auth-open]").forEach(btn => btn.addEventListener("click", showModal));
  el("auth-close")?.addEventListener("click", closeModal);
  el("auth-backdrop")?.addEventListener("click", event => {
    if (event.target === backdrop) closeModal();
  });
  document.querySelectorAll("[data-auth-mode]").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.authMode));
  });
  el("profile-back")?.addEventListener("click", () => {
    setMode("login");
    showForm();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && backdrop && !backdrop.hidden) closeModal();
  });

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    setFeedback("");
    if (!client) {
      setFeedback("Hesap sistemi henüz bağlı değil. Önce yeni Supabase projesi ve js/config.js ayarı gerekiyor.", "error");
      return;
    }
    const submit = el("auth-submit");
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = "İşleniyor…";
    const email = el("auth-email").value.trim();
    const password = el("auth-password").value;
    try {
      if (signupMode.current === "signup") {
        const rawUsername = el("auth-username").value.trim().toLowerCase();
        const displayName = el("auth-display-name").value.trim();
        if (!/^[a-z0-9_]{3,20}$/.test(rawUsername)) {
          setFeedback("Kullanıcı adı 3–20 karakter olmalı; yalnızca İngilizce harf, rakam ve alt çizgi kullan.", "error");
          return;
        }
        const { data, error } = await client.auth.signUp({
          email, password,
          options: { data: { username: rawUsername, display_name: displayName } }
        });
        if (error) throw error;
        if (data.session) {
          updateHeader(data.session);
          setFeedback("Hesabın oluşturuldu. Profilin hazır.", "success");
          await showProfile();
        } else {
          setFeedback("Kayıt isteği alındı. E-posta doğrulaması açıksa gelen kutunu kontrol et; doğrulamadan giriş yapamayabilirsin.", "success");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        updateHeader(data.session);
        await showProfile();
      }
    } catch (error) {
      const message = typeof error?.message === "string" ? error.message : "İşlem tamamlanamadı. Tekrar deneyin.";
      setFeedback(message, "error");
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
      if (!client) {
        updateHeader(null);
        closeModal();
        return;
      }
      const { error } = await client.auth.signOut();
      if (error) throw error;
      updateHeader(null);
      setMode("login");
      showForm();
      setFeedback("Oturum kapatıldı.", "success");
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
