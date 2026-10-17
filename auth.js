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
  let currentProfile = null;
  let lastFocused = null;
  let profileRequest = 0;
  let readyResolve;
  const ready = new Promise(resolve => { readyResolve = resolve; });

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
  function setProfileFeedback(message, type = "") {
    const node = el("profile-edit-feedback");
    if (!node) return;
    node.textContent = message || "";
    node.className = "auth-feedback" + (type ? " " + type : "");
  }
  function dispatchState() {
    window.dispatchEvent(new CustomEvent("ml:auth-state", { detail: {
      session: currentSession,
      profile: currentProfile,
      isAdmin: currentProfile?.role === "admin"
    }}));
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
  function fillProfileEditor(profile) {
    if (!profile) return;
    el("profile-edit-display-name").value = profile.display_name || profile.username || "";
    el("profile-edit-avatar-url").value = profile.avatar_url || "";
    el("profile-edit-bio").value = profile.bio || "";
  }
  async function refreshProfile() {
    const requestId = ++profileRequest;
    if (!client || !currentSession?.user) {
      currentProfile = null;
      dispatchState();
      return null;
    }
    try {
      const { data, error } = await client.from("profiles")
        .select("id, username, display_name, bio, avatar_url, role, created_at")
        .eq("id", currentSession.user.id)
        .maybeSingle();
      if (requestId !== profileRequest) return currentProfile;
      if (error) throw error;
      currentProfile = data || null;
      if (currentProfile) {
        const username = currentProfile.username || currentSession.user.user_metadata?.username || "oyuncu";
        const name = currentProfile.display_name || username;
        el("profile-name").textContent = name;
        el("profile-summary-username").textContent = "@" + username;
        el("profile-username").textContent = "@" + username;
        const avatarNode = el("profile-avatar");
        avatarNode.textContent = (name.trim().slice(0, 2) || "ML").toUpperCase();
        if (currentProfile.avatar_url && /^https:\/\//i.test(currentProfile.avatar_url)) {
          const img = document.createElement("img");
          img.src = currentProfile.avatar_url; img.alt = name + " profil fotoğrafı"; img.referrerPolicy = "no-referrer";
          img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "cover";
          avatarNode.replaceChildren(img);
        }
        el("profile-status").textContent = currentProfile.role === "admin" ? "Yönetici hesabı" : "Oturum açık";
        fillProfileEditor(currentProfile);
        el("profile-admin-open").hidden = currentProfile.role !== "admin";
        el("profile-feedback").textContent = "";
      } else {
        el("profile-status").textContent = "Profil kaydı bulunamadı";
        el("profile-feedback").textContent = "Supabase SQL dosyasını uygulayıp kayıt tetikleyicisini kontrol et.";
        el("profile-admin-open").hidden = true;
      }
    } catch (error) {
      if (requestId !== profileRequest) return currentProfile;
      currentProfile = null;
      el("profile-status").textContent = "Profil okunamadı";
      el("profile-feedback").textContent = error?.message || "Profil bilgileri alınamadı. SQL kurulumunu kontrol et.";
      el("profile-admin-open").hidden = true;
    }
    dispatchState();
    return currentProfile;
  }
  async function showProfile() {
    formPanel.hidden = true;
    profilePanel.hidden = false;
    if (currentSession?.user) await refreshProfile();
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
    if (!currentSession) currentProfile = null;
    dispatchState();
    if (currentSession?.user) {
      // Do not await profile I/O from Supabase's auth-state callback.
      Promise.resolve().then(() => refreshProfile()).then(() => {
        if (!backdrop.hidden) showProfile();
      });
    }
  }
  async function initClient() {
    if (!isConfigured()) {
      setupNote.textContent = "Supabase yapılandırması eksik. config.js içindeki proje URL'sini ve publishable key'i kontrol et.";
      readyResolve(false);
      window.dispatchEvent(new Event("ml:ready"));
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      setupNote.textContent = "Supabase istemci kütüphanesi yüklenemedi. İnternet bağlantısını kontrol edip sayfayı yenile.";
      readyResolve(false);
      window.dispatchEvent(new Event("ml:ready"));
      return;
    }
    const cfg = window.MORTA_CONFIG;
    // Keep the session in this browser's persistent localStorage so normal page visits
    // and reloads do not require signing in again. The key matches Supabase's default
    // project key, so existing sessions remain readable. Signing out or clearing site data
    // intentionally removes the saved session.
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage,
        storageKey: "sb-dxznuiqachpggwxmczwn-auth-token"
      }
    });
    setupNote.textContent = "Kayıtta yalnızca kullanıcı adı ve şifre istenir. Supabase'te Email → Confirm email kapalı olmalı; SQL kurulum dosyasını bir kez çalıştır.";
    client.auth.onAuthStateChange((_event, session) => updateHeader(session));
    const { data, error } = await client.auth.getSession();
    if (!error) updateHeader(data.session);
    readyResolve(true);
    window.dispatchEvent(new Event("ml:ready"));
    dispatchState();
  }

  async function listProfiles() {
    if (!client) throw new Error("Supabase bağlantısı kurulamadı.");
    const fields = currentSession?.user
      ? "id, username, display_name, bio, avatar_url, created_at"
      : "username, display_name, bio, avatar_url, created_at";
    const { data, error } = await client.from("profiles")
      .select(fields)
      .order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    return data || [];
  }
  async function listAdminProfiles() {
    if (!isAdmin()) throw new Error("Bu işlem için yönetici yetkisi gerekli.");
    const { data, error } = await client.from("profiles")
      .select("id, username, display_name, bio, avatar_url, role, created_at")
      .order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return data || [];
  }
  async function listAnnouncements() {
    if (!client) throw new Error("Supabase bağlantısı kurulamadı.");
    const { data, error } = await client.from("announcements")
      .select("id, title, content, created_at, created_by")
      .order("created_at", { ascending: false }).limit(100);
    if (error) {
      if (/relation .*announcements.* does not exist|could not find the table/i.test(error.message || "")) {
        throw new Error("Duyurular için SQL dosyasındaki announcements tablosu henüz kurulmamış.");
      }
      throw error;
    }
    return data || [];
  }
  async function saveOwnProfile(changes) {
    if (!client || !currentSession?.user) throw new Error("Önce hesabına giriş yap.");
    const payload = {
      display_name: String(changes.display_name || "").trim(),
      bio: String(changes.bio || "").trim(),
      avatar_url: changes.avatar_url ? String(changes.avatar_url).trim() : null
    };
    if (!payload.display_name || payload.display_name.length > 40) throw new Error("Görünen ad 1–40 karakter olmalı.");
    if (payload.bio.length > 240) throw new Error("Biyografi en fazla 240 karakter olabilir.");
    if (payload.avatar_url && !/^https:\/\//i.test(payload.avatar_url)) throw new Error("Profil fotoğrafı bağlantısı https:// ile başlamalı.");
    const { error } = await client.from("profiles").update(payload).eq("id", currentSession.user.id);
    if (error) throw error;
    await refreshProfile();
    return currentProfile;
  }
  async function saveManagedProfile(id, changes) {
    if (!isAdmin()) throw new Error("Bu işlem için yönetici yetkisi gerekli.");
    const payload = {
      display_name: String(changes.display_name || "").trim(),
      bio: String(changes.bio || "").trim(),
      avatar_url: changes.avatar_url ? String(changes.avatar_url).trim() : null
    };
    if (!payload.display_name || payload.display_name.length > 40) throw new Error("Görünen ad 1–40 karakter olmalı.");
    if (payload.bio.length > 240) throw new Error("Biyografi en fazla 240 karakter olabilir.");
    if (payload.avatar_url && !/^https:\/\//i.test(payload.avatar_url)) throw new Error("Profil fotoğrafı bağlantısı https:// ile başlamalı.");
    const { error } = await client.from("profiles").update(payload).eq("id", id);
    if (error) throw error;
  }
  async function createAnnouncement({ title, content }) {
    if (!isAdmin() || !currentSession?.user) throw new Error("Duyuru yayınlamak için yönetici yetkisi gerekli.");
    const t = String(title || "").trim(); const c = String(content || "").trim();
    if (!t || t.length > 100) throw new Error("Başlık 1–100 karakter olmalı.");
    if (!c || c.length > 3000) throw new Error("Duyuru içeriği 1–3000 karakter olmalı.");
    const { error } = await client.from("announcements").insert({ title: t, content: c, created_by: currentSession.user.id });
    if (error) throw error;
  }
  async function deleteAnnouncement(id) {
    if (!isAdmin()) throw new Error("Duyuru kaldırmak için yönetici yetkisi gerekli.");
    const { error } = await client.from("announcements").delete().eq("id", id);
    if (error) throw error;
  }
  async function createDirectConversation(targetUserId) {
    if (!client || !currentSession?.user) throw new Error("Özel mesaj göndermek için giriş yapmalısın.");
    const { data, error } = await client.rpc("create_direct_conversation", { target_user_id: targetUserId });
    if (error) {
      if (/blocked|engell|42501/i.test(`${error.message || ""} ${error.code || ""}`)) throw new Error("Bu oyuncuyla sohbet başlatılamıyor. Taraflardan biri diğerini engellemiş olabilir.");
      throw error;
    }
    return data;
  }
  async function canDirectMessage(targetUserId) {
    if (!client || !currentSession?.user) return false;
    const { data, error } = await client.rpc("can_direct_message", { target_user_id: targetUserId });
    if (error) throw error;
    return data === true;
  }
  async function listDirectConversations() {
    if (!client || !currentSession?.user) throw new Error("Sohbetlerini görmek için giriş yapmalısın.");
    const userId = currentSession.user.id;
    const { data: conversations, error } = await client.from("dm_conversations")
      .select("id, user_one, user_two, created_at, last_message_at, last_message_preview, last_message_sender_id")
      .or(`user_one.eq.${userId},user_two.eq.${userId}`)
      .order("last_message_at", { ascending: false }).limit(100);
    if (error) throw error;
    const rows = conversations || [];
    if (!rows.length) return [];
    const otherIds = [...new Set(rows.map(c => c.user_one === userId ? c.user_two : c.user_one))];
    const [{ data: profiles, error: profilesError }, { data: unreadRows, error: unreadError }] = await Promise.all([
      client.from("profiles").select("id, username, display_name, avatar_url, bio, created_at").in("id", otherIds),
      client.from("dm_messages").select("id, conversation_id").in("conversation_id", rows.map(c => c.id)).neq("sender_id", userId).is("read_at", null)
    ]);
    if (profilesError) throw profilesError;
    if (unreadError) throw unreadError;
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const unreadMap = new Map();
    (unreadRows || []).forEach(m => unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1));
    return rows.map(c => ({ ...c, otherProfile: profileMap.get(c.user_one === userId ? c.user_two : c.user_one) || null, unreadCount: unreadMap.get(c.id) || 0 }))
      .filter(c => c.otherProfile);
  }
  async function listDirectMessages(conversationId) {
    if (!client || !currentSession?.user) throw new Error("Önce giriş yapmalısın.");
    const { data, error } = await client.from("dm_messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(300);
    if (error) {
      if (/dm_messages|schema cache|could not find the table/i.test(error.message || "")) throw new Error("Özel mesajlar için ZIP içindeki 02_direct_messages.sql dosyasını Supabase SQL Editor'de çalıştır.");
      throw error;
    }
    return (data || []).reverse();
  }
  async function sendDirectMessage(conversationId, body) {
    if (!client || !currentSession?.user) throw new Error("Mesaj göndermek için giriş yapmalısın.");
    const text = String(body || "").trim();
    if (!text) throw new Error("Boş mesaj gönderemezsin.");
    if (text.length > 2000) throw new Error("Mesaj en fazla 2000 karakter olabilir.");
    const { error } = await client.from("dm_messages").insert({ conversation_id: conversationId, sender_id: currentSession.user.id, body: text });
    if (error) {
      if (/row-level security|42501|blocked|engell/i.test(`${error.message || ""} ${error.code || ""}`)) throw new Error("Mesaj gönderilemedi. Sohbet erişimini veya engelleme durumunu kontrol et.");
      throw error;
    }
  }
  async function markDirectMessagesRead(conversationId) {
    if (!client || !currentSession?.user) return;
    const { error } = await client.from("dm_messages").update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId).neq("sender_id", currentSession.user.id).is("read_at", null);
    if (error) throw error;
  }
  async function listDirectBlocks() {
    if (!client || !currentSession?.user) return [];
    const { data, error } = await client.from("dm_blocks").select("blocked_id").eq("blocker_id", currentSession.user.id);
    if (error) throw error;
    return (data || []).map(row => row.blocked_id);
  }
  async function blockDirectUser(targetUserId) {
    if (!client || !currentSession?.user) throw new Error("Oyuncuyu engellemek için giriş yapmalısın.");
    const { error } = await client.from("dm_blocks").insert({ blocker_id: currentSession.user.id, blocked_id: targetUserId });
    if (error && error.code !== "23505") throw error;
  }
  async function unblockDirectUser(targetUserId) {
    if (!client || !currentSession?.user) throw new Error("Oyuncu engelini kaldırmak için giriş yapmalısın.");
    const { error } = await client.from("dm_blocks").delete().eq("blocker_id", currentSession.user.id).eq("blocked_id", targetUserId);
    if (error) throw error;
  }
  function isAdmin() { return currentProfile?.role === "admin"; }

  window.MortaLeague = {
    get client() { return client; },
    get session() { return currentSession; },
    get profile() { return currentProfile; },
    ready,
    isAdmin,
    openAuth: showModal,
    closeAuth: closeModal,
    refreshProfile,
    listProfiles,
    listAdminProfiles,
    listAnnouncements,
    saveOwnProfile,
    saveManagedProfile,
    createAnnouncement,
    deleteAnnouncement,
    createDirectConversation,
    canDirectMessage,
    listDirectConversations,
    listDirectMessages,
    sendDirectMessage,
    markDirectMessagesRead,
    listDirectBlocks,
    blockDirectUser,
    unblockDirectUser
  };

  document.querySelectorAll("[data-auth-open]").forEach(btn => btn.addEventListener("click", showModal));
  el("auth-close")?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.querySelectorAll("[data-auth-mode]").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.authMode)));
  el("profile-back")?.addEventListener("click", () => { setMode("login"); showForm(); });
  el("profile-view-players")?.addEventListener("click", () => { closeModal(); window.MortaUI?.showPage("players"); });
  el("profile-admin-open")?.addEventListener("click", () => { closeModal(); window.MortaUI?.showPage("admin"); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && backdrop && !backdrop.hidden) closeModal(); });

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    setFeedback("");
    if (!client) { setFeedback("Hesap sistemi bağlı değil. Supabase yapılandırmasını kontrol et.", "error"); return; }
    const submit = el("auth-submit");
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = "İşleniyor…";
    const username = normalizeUsername(el("auth-username").value);
    const password = el("auth-password").value;
    try {
      if (!validUsername(username)) { setFeedback("Kullanıcı adı 3–20 karakter olmalı; yalnızca İngilizce harf, rakam ve alt çizgi kullan.", "error"); return; }
      const email = authIdentity(username);
      if (signupMode.current === "signup") {
        if (password.length < 8) { setFeedback("Şifre en az 8 karakter olmalı.", "error"); return; }
        const { data: existing, error: lookupError } = await client.from("profiles").select("username").eq("username", username).maybeSingle();
        if (lookupError) {
          if (/relation .*profiles.* does not exist|could not find the table/i.test(lookupError.message || "")) throw new Error("Önce ZIP içindeki 01_profiles_auth.sql dosyasını Supabase SQL Editor'de çalıştır.");
          throw lookupError;
        }
        if (existing) { setFeedback("Bu kullanıcı adı alınmış. Başka bir kullanıcı adı seç.", "error"); return; }
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { username, display_name: username } } });
        if (error) {
          const message = String(error.message || "");
          if (/database error saving new user|duplicate key|already registered|already been registered/i.test(message)) { setFeedback("Bu kullanıcı adı kullanılamıyor. Başka bir kullanıcı adı seç.", "error"); return; }
          throw error;
        }
        if (data.session) {
          updateHeader(data.session);
          await refreshProfile();
          await showProfile();
          setProfileFeedback("Hesabın oluşturuldu. Hoş geldin!", "success");
        } else {
          setFeedback("Supabase e-posta doğrulaması istedi. Authentication → Providers → Email bölümünde Confirm email ayarını kapatıp tekrar dene.", "error");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          if (/invalid login credentials/i.test(String(error.message || ""))) { setFeedback("Kullanıcı adı veya şifre hatalı.", "error"); return; }
          throw error;
        }
        updateHeader(data.session);
        await refreshProfile();
        await showProfile();
      }
    } catch (error) {
      setFeedback(typeof error?.message === "string" ? error.message : "İşlem tamamlanamadı. Tekrar deneyin.", "error");
    } finally {
      submit.disabled = false;
      submit.innerHTML = original;
    }
  });

  el("profile-edit-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const button = el("profile-save");
    button.disabled = true; button.textContent = "Kaydediliyor…";
    setProfileFeedback("");
    try {
      await saveOwnProfile({
        display_name: el("profile-edit-display-name").value,
        avatar_url: el("profile-edit-avatar-url").value,
        bio: el("profile-edit-bio").value
      });
      setProfileFeedback("Profilin güncellendi.", "success");
    } catch (error) {
      setProfileFeedback(error?.message || "Profil kaydedilemedi.", "error");
    } finally {
      button.disabled = false; button.textContent = "Profili Kaydet ↗";
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
