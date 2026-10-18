(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));
  const initials = value => String(value || "ML").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "ML";
  let conversations = [];
  let activeConversationId = null;
  let activePeer = null;
  let activeChannel = null;
  let currentCanSend = false;
  let myBlockedIds = new Set();
  let profileCache = [];
  let profileCacheAt = 0;
  let loadingConversations = false;
  let loadingMessages = false;
  let pollTimer = null;
  let typingStopTimer = null;
  let peerTypingTimer = null;
  let localTypingActive = false;

  function say(id, message, type = "") {
    const node = $(id);
    if (!node) return;
    node.textContent = message || "";
    node.className = id === "dm-list-status" ? "inline-status" + (type ? ` ${type}` : "") : "dm-chat-status" + (type ? ` ${type}` : "");
  }
  function friendlyError(error, fallback = "İşlem tamamlanamadı. Biraz sonra tekrar dene.") {
    const raw = String(error?.message || "").toLowerCase(), code = String(error?.code || "");
    if (code === "42501" || /row-level security|permission denied|not allowed/.test(raw)) return "Bu işlem için erişim izni yok. Oturumunu ve Supabase politikalarını kontrol et.";
    if (/failed to fetch|networkerror|load failed|fetch failed/.test(raw)) return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
    if (/schema cache|could not find the table|relation .* does not exist/.test(raw)) return "Mesajlaşma tabloları eksik. 02_direct_messages.sql ve 06_profiles_pwa_realtime.sql kurulumlarını kontrol et.";
    return fallback;
  }
  function nowTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(d);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return time;
    return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" }).format(d);
  }
  function avatarHTML(profile, extraClass) {
    const name = profile?.display_name || profile?.username || "Oyuncu";
    const url = String(profile?.avatar_url || "");
    if (/^https:\/\//i.test(url)) return `<span class="${extraClass}"><img src="${esc(url)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer"></span>`;
    return `<span class="${extraClass}">${esc(initials(name))}</span>`;
  }
  function currentUserId() { return window.MortaLeague?.session?.user?.id || null; }
  function currentClient() { return window.MortaLeague?.client || null; }
  function setPeerStatus(online, label) {
    const node=$("dm-peer-status");if(!node)return;
    node.textContent=label|| (online?"Çevrimiçi":"Çevrimdışı");
    node.classList.toggle("is-online",Boolean(online));
  }
  function showPeerTyping(typing) {
    const node=$("dm-typing-status");if(!node)return;
    node.hidden=!typing;node.textContent=typing?`${activePeer?.display_name||activePeer?.username||"Oyuncu"} yazıyor…`:"";
  }
  function broadcastTyping(typing) {
    if(!activeChannel||!currentUserId())return;
    if(typing===localTypingActive&&!typing)return;
    localTypingActive=Boolean(typing);
    try{Promise.resolve(activeChannel.send({type:"broadcast",event:"typing",payload:{user_id:currentUserId(),typing:localTypingActive}})).catch(()=>{});}catch(_){}
  }
  function noteTypingInput() {
    if(!currentCanSend||!activeChannel)return;
    if(!localTypingActive)broadcastTyping(true);
    clearTimeout(typingStopTimer);
    typingStopTimer=setTimeout(()=>broadcastTyping(false),1100);
  }
  function setNavUnread(count) {
    const badge = $("dm-nav-unread");
    if (!badge) return;
    const n = Number(count) || 0;
    badge.hidden = n < 1;
    badge.textContent = n > 99 ? "99+" : String(n);
    const navButton = badge.closest("button");
    if (navButton) navButton.setAttribute("aria-label", n ? `Mesajlar, ${n} okunmamış mesaj` : "Mesajlar");
  }
  function renderConversations() {
    const host = $("dm-conversation-list");
    if (!host) return;
    const query = ($("dm-conversation-search")?.value || "").trim().toLocaleLowerCase("tr-TR");
    const visible = conversations.filter(conv => {
      const p = conv.otherProfile || {};
      const haystack = `${p.display_name || ""} ${p.username || ""} ${conv.last_message_preview || ""}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(query);
    });
    if (!visible.length) {
      host.innerHTML = `<div class="dm-sidebar-empty">${query ? "Eşleşen sohbet yok." : "Henüz sohbet yok."}</div>`;
      return;
    }
    host.innerHTML = visible.map(conv => {
      const p = conv.otherProfile;
      const name = p?.display_name || p?.username || "Oyuncu";
      const preview = conv.last_message_preview || "İlk mesajı gönder";
      return `<button class="dm-conversation-item${conv.id === activeConversationId ? " active" : ""}" type="button" data-dm-conversation="${esc(conv.id)}" aria-label="${esc(name)} ile sohbeti aç">
        ${avatarHTML(p, "dm-list-avatar")}
        <span class="dm-conversation-copy"><strong>${esc(name)}</strong><small>@${esc(p?.username || "oyuncu")}</small><span class="dm-conversation-preview">${esc(preview)}</span></span>
        <span class="dm-conversation-meta"><time>${esc(nowTime(conv.last_message_at || conv.created_at))}</time>${conv.unreadCount ? `<span class="dm-unread-count">${conv.unreadCount > 99 ? "99+" : conv.unreadCount}</span>` : ""}</span>
      </button>`;
    }).join("");
  }
  async function loadConversations() {
    if (loadingConversations) return;
    if (!currentUserId()) {
      conversations = [];
      renderConversations();
      setNavUnread(0);
      say("dm-list-status", "Özel mesajları kullanmak için giriş yap.");
      return;
    }
    loadingConversations = true;
    const listHost = $("dm-conversation-list");
    if(listHost && !conversations.length) listHost.innerHTML = '<div class="skeleton-card skeleton-player" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-medium"></span></div><div class="skeleton-card skeleton-player" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span></div>';
    try {
      const result = await window.MortaLeague.listDirectConversations();
      conversations = Array.isArray(result) ? result : [];
      renderConversations();
      const unread = conversations.reduce((sum, row) => sum + (row.unreadCount || 0), 0);
      setNavUnread(unread);
      say("dm-list-status", conversations.length ? `${conversations.length} sohbet` : "");
      if (activeConversationId) {
        const active = conversations.find(c => c.id === activeConversationId);
        if (active?.otherProfile) activePeer = active.otherProfile;
      }
    } catch (error) {
      say("dm-list-status", friendlyError(error,"Sohbet listesi yüklenemedi. 02_direct_messages.sql dosyasının Supabase'te kurulu olduğunu kontrol et."), "error");
      if(listHost)listHost.innerHTML='<div class="dm-sidebar-empty">Sohbetler yüklenemedi. İnternet bağlantını ve SQL kurulumunu kontrol et.</div>';
    } finally {
      loadingConversations = false;
    }
  }
  async function fetchProfiles(force = false) {
    if (!currentUserId()) return [];
    if (!force && profileCache.length && Date.now() - profileCacheAt < 60000) return profileCache;
    const rows = await window.MortaLeague.listProfiles();
    profileCache = (rows || []).filter(p => p.id && p.id !== currentUserId());
    profileCacheAt = Date.now();
    return profileCache;
  }
  function renderSearchResults(rows) {
    const host = $("dm-user-search-results");
    if (!host) return;
    host.hidden = false;
    if (!rows.length) {
      host.innerHTML = '<p class="dm-help-text">Oyuncu bulunamadı.</p>';
      return;
    }
    host.innerHTML = rows.slice(0, 12).map(p => `<div class="dm-user-result">
      ${avatarHTML(p, "dm-search-avatar")}
      <span><strong>${esc(p.display_name || p.username)}</strong><small>@${esc(p.username)}</small></span>
      <button type="button" class="dm-start-button" data-dm-start="${esc(p.id)}">Mesaj</button>
    </div>`).join("");
  }
  async function searchPlayers() {
    const query = ($("dm-user-search")?.value || "").trim().toLocaleLowerCase("tr-TR");
    const host = $("dm-user-search-results");
    if (!host) return;
    if (query.length < 2) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    if (!currentUserId()) { host.innerHTML = '<p class="dm-help-text">Giriş yapman gerekiyor.</p>'; return; }
    host.innerHTML = '<p class="dm-help-text">Aranıyor…</p>';
    try {
      const profiles = await fetchProfiles();
      const matches = profiles.filter(p => `${p.username || ""} ${p.display_name || ""}`.toLocaleLowerCase("tr-TR").includes(query));
      renderSearchResults(matches);
    } catch (error) {
      host.innerHTML = `<p class="dm-help-text is-error">${esc(error?.message || "Oyuncular aranamadı.")}</p>`;
    }
  }
  function renderMessages(rows) {
    const host = $("dm-message-list");
    if (!host) return;
    if (!rows.length) {
      host.innerHTML = '<div class="dm-message-intro"><span>✦</span><strong>İlk mesajı gönder</strong></div>';
      return;
    }
    const viewerId = currentUserId();
    host.innerHTML = rows.map(message => {
      const own = message.sender_id === viewerId;
      const receipt = own ? (message.read_at ? "Okundu" : "Gönderildi") : "";
      return `<article class="dm-message-row ${own ? "mine" : "theirs"}" data-message-id="${esc(message.id)}"><div class="dm-message-bubble"><p>${esc(message.body)}</p><footer><time>${esc(nowTime(message.created_at))}</time>${receipt ? `<span>${receipt}</span>` : ""}${!own?`<button type="button" class="dm-report-message" data-report-dm-message="${esc(message.id)}" title="Mesajı şikâyet et">Şikâyet</button>`:""}</footer></div></article>`;
    }).join("");
    host.scrollTop = host.scrollHeight;
  }
  async function setReadOnlyState() {
    const input = $("dm-message-input"), button = $("dm-send-button");
    if (input) input.disabled = !currentCanSend;
    if (button) button.disabled = !currentCanSend;
    const form = $("dm-send-form");
    if (form) form.classList.toggle("is-readonly", !currentCanSend);
    const msg = currentCanSend ? "Yalnızca bu sohbetin katılımcıları mesajları görebilir." : "Bu oyuncuyla mesajlaşma kapalı. Taraflardan biri diğerini engellemiş olabilir.";
    say("dm-chat-status", msg, currentCanSend ? "" : "error");
  }
  async function refreshActiveMessages(markRead = true) {
    if (!activeConversationId || !currentUserId() || loadingMessages) return;
    loadingMessages = true;
    try {
      const rows = await window.MortaLeague.listDirectMessages(activeConversationId);
      renderMessages(rows);
      if (markRead) {
        await window.MortaLeague.markDirectMessagesRead(activeConversationId);
      }
    } catch (error) {
      say("dm-chat-status", friendlyError(error,"Mesajlar yüklenemedi. Sohbet SQL kurulumunu ve bağlantını kontrol et."), "error");
    } finally {
      loadingMessages = false;
    }
  }
  async function updateCurrentBlockState() {
    if (!activePeer?.id) return;
    try {
      myBlockedIds = new Set(await window.MortaLeague.listDirectBlocks());
      currentCanSend = await window.MortaLeague.canDirectMessage(activePeer.id);
    } catch (_) {
      currentCanSend = false;
    }
    const blockButton = $("dm-block-button");
    if (blockButton) {
      blockButton.textContent = myBlockedIds.has(activePeer.id) ? "Engeli kaldır" : "Engelle";
      blockButton.setAttribute("aria-pressed", String(myBlockedIds.has(activePeer.id)));
    }
    await setReadOnlyState();
  }
  async function openConversation(conversationId, peer) {
    if (!conversationId || !peer) return;
    clearTimeout(typingStopTimer);clearTimeout(peerTypingTimer);localTypingActive=false;showPeerTyping(false);
    if (activeChannel && currentClient()) {
      try { await currentClient().removeChannel(activeChannel); } catch (_) {}
      activeChannel = null;
    }
    activeConversationId = conversationId;
    activePeer = peer;
    document.querySelector(".messages-shell")?.classList.add("dm-mobile-chat-open");
    conversations = conversations.map(c => ({ ...c, id: c.id }));
    renderConversations();
    $("dm-chat-empty").hidden = true;
    $("dm-chat-view").hidden = false;
    const name = peer.display_name || peer.username || "Oyuncu";
    const avatar = $("dm-chat-avatar");
    avatar.innerHTML = avatarHTML(peer, "dm-chat-avatar-inner");
    $("dm-chat-name").textContent = name;
    $("dm-chat-username").textContent = "@" + (peer.username || "oyuncu");
    setPeerStatus(false,"Bağlanıyor…");
    $("dm-message-list").innerHTML = '<div class="skeleton-card skeleton-message" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-medium"></span></div><div class="skeleton-card skeleton-message skeleton-message-right" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span></div>';
    say("dm-chat-status", "Sohbet yükleniyor…");
    await updateCurrentBlockState();
    await refreshActiveMessages(true);
    await loadConversations();
    const client = currentClient();
    if (client) {
      activeChannel = client.channel(`mortaleague-dm-${conversationId}`, {
        config: { private: true, presence: { key: currentUserId() }, broadcast: { ack: true } }
      })
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${conversationId}` }, async () => {
          await refreshActiveMessages(true);
          await loadConversations();
        })
        .on("presence", { event: "sync" }, () => {
          if (!activeChannel || !activePeer) return;
          const presence = activeChannel.presenceState() || {};
          setPeerStatus(Boolean(presence[activePeer.id]?.length));
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (!payload || payload.user_id === currentUserId()) return;
          showPeerTyping(payload.typing === true);
          clearTimeout(peerTypingTimer);
          if (payload.typing === true) peerTypingTimer=setTimeout(()=>showPeerTyping(false),2200);
        })
        .subscribe(async status => {
          if (status === "SUBSCRIBED" && activeChannel) {
            try { await activeChannel.track({ user_id: currentUserId(), online_at: new Date().toISOString() }); }
            catch (_) { setPeerStatus(false,"Durum alınamadı"); }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setPeerStatus(false,"Canlı durum kullanılamıyor");
          }
        });
    }
    const input = $("dm-message-input");
    if (input && currentCanSend) input.focus({ preventScroll: true });
  }
  async function openChat(targetUserId) {
    if (!currentUserId()) { window.MortaLeague?.openAuth(); return; }
    if (!targetUserId || targetUserId === currentUserId()) return;
    try {
      let peer = (await fetchProfiles()).find(p => p.id === targetUserId);
      if (!peer) {
        const rows = await fetchProfiles(true);
        peer = rows.find(p => p.id === targetUserId);
      }
      if (!peer) throw new Error("Bu oyuncunun profili bulunamadı. Oyuncu listesini yenile.");
      const allowed = await window.MortaLeague.canDirectMessage(targetUserId);
      if (!allowed) throw new Error("Bu oyuncuyla sohbet başlatılamıyor. Taraflardan biri diğerini engellemiş olabilir.");
      const conversationId = await window.MortaLeague.createDirectConversation(targetUserId);
      activeConversationId = conversationId;
      activePeer = peer;
      window.MortaUI?.showPage("messages");
    } catch (error) {
      if (!$("page-messages")?.classList.contains("active")) {
        // Navigate first so the load handler cannot overwrite the error below.
        window.MortaUI?.showPage("messages");
      }
      const node = $("dm-list-status");
      if (node) {
        node.textContent = error?.message || "Sohbet başlatılamadı.";
        node.className = "inline-status error";
      }
    }
  }
  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (!$("page-messages")?.classList.contains("active") || !currentUserId()) return;
      await loadConversations();
      if (activeConversationId) await refreshActiveMessages(true);
    }, 9000);
  }
  document.addEventListener("click", event => {
    const start = event.target.closest("[data-dm-start], [data-message-user]");
    if (start) {
      event.preventDefault();
      openChat(start.dataset.dmStart || start.dataset.messageUser);
      return;
    }
    const item = event.target.closest("[data-dm-conversation]");
    if (item) {
      const conversation = conversations.find(c => c.id === item.dataset.dmConversation);
      if (conversation?.otherProfile) openConversation(conversation.id, conversation.otherProfile);
      return;
    }
    if (event.target.closest("#public-profile-message")) {
      const profile = window.MortaUI?.currentPublicProfile;
      if (profile?.id) {
        const backdrop = $("public-profile-backdrop");
        if (backdrop) backdrop.hidden = true;
        document.body.style.overflow = "";
        openChat(profile.id);
      }
    }
  });
  $("dm-conversation-search")?.addEventListener("input", renderConversations);
  $("dm-user-search")?.addEventListener("input", () => { clearTimeout(searchPlayers.delay); searchPlayers.delay = setTimeout(searchPlayers, 220); });
  $("dm-mobile-back")?.addEventListener("click", () => {
    document.querySelector(".messages-shell")?.classList.remove("dm-mobile-chat-open");
  });
  $("dm-refresh")?.addEventListener("click", async () => {
    await loadConversations();
    if (activeConversationId) await refreshActiveMessages(true);
  });
  const messageInput = $("dm-message-input");
  function resizeMessageInput() {
    if (!messageInput) return;
    messageInput.style.height = "auto";
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 150)}px`;
  }
  messageInput?.addEventListener("input", event => {
    const count = $("dm-character-count");
    if (count) count.textContent = `${event.target.value.length} / 2000`;
    resizeMessageInput();
    noteTypingInput();
  });
  messageInput?.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (messageInput.value.trim()) $("dm-send-form")?.requestSubmit();
    }
  });
  $("dm-send-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!activeConversationId || !activePeer) return;
    const input = $("dm-message-input");
    const button = $("dm-send-button");
    const body = input.value.trim();
    if (!body || !currentCanSend) return;
    button.disabled = true;
    button.textContent = "Gönderiliyor…";
    clearTimeout(typingStopTimer);broadcastTyping(false);
    try {
      await window.MortaLeague.sendDirectMessage(activeConversationId, body);
      input.value = "";
      input.style.height = "48px";
      $("dm-character-count").textContent = "0 / 2000";
      say("dm-chat-status", "Mesaj gönderildi.", "success");
      await refreshActiveMessages(true);
      await loadConversations();
    } catch (error) {
      say("dm-chat-status", error?.message || "Mesaj gönderilemedi.", "error");
    } finally {
      button.textContent = "Gönder ↗";
      button.disabled = !currentCanSend;
      if (currentCanSend) input.focus({ preventScroll: true });
    }
  });
  $("dm-block-button")?.addEventListener("click", async event => {
    if (!activePeer?.id) return;
    const button = event.currentTarget;
    button.disabled = true;
    try {
      if (myBlockedIds.has(activePeer.id)) {
        await window.MortaLeague.unblockDirectUser(activePeer.id);
        say("dm-chat-status", "Oyuncu engeli kaldırıldı.", "success");
      } else {
        const confirmBlock = window.confirm(`${activePeer.display_name || activePeer.username} adlı oyuncuyu engellemek istiyor musun? Engelleme sırasında yeni mesaj gönderilemez.`);
        if (!confirmBlock) return;
        await window.MortaLeague.blockDirectUser(activePeer.id);
        say("dm-chat-status", "Oyuncu engellendi. Geçmiş mesajlar görünür kalır; yeni mesaj gönderilemez.", "success");
      }
      await updateCurrentBlockState();
      await loadConversations();
    } catch (error) {
      say("dm-chat-status", friendlyError(error,"Engelleme işlemi tamamlanamadı."), "error");
    } finally {
      button.disabled = false;
    }
  });
  window.addEventListener("ml:messages-open", async () => {
    if (!currentUserId()) {
      say("dm-list-status", "Özel mesajları kullanmak için giriş yap.");
      window.MortaLeague?.openAuth();
      return;
    }
    await loadConversations();
    startPolling();
    if (activeConversationId && activePeer) await openConversation(activeConversationId, activePeer);
  });
  window.addEventListener("ml:ready", async () => {
    if (currentUserId()) await loadConversations();
  });
  window.addEventListener("ml:auth-state", async event => {
    profileCache = [];
    profileCacheAt = 0;
    if (!event.detail?.session?.user) {
      conversations = [];
      activeConversationId = null;
      activePeer = null;
      currentCanSend = false;
      clearTimeout(typingStopTimer);clearTimeout(peerTypingTimer);localTypingActive=false;showPeerTyping(false);setPeerStatus(false);
      document.querySelector(".messages-shell")?.classList.remove("dm-mobile-chat-open");
      setNavUnread(0);
      if (activeChannel && currentClient()) {
        try { await currentClient().removeChannel(activeChannel); } catch (_) {}
        activeChannel = null;
      }
      if ($("page-messages")?.classList.contains("active")) window.MortaUI?.showPage("home");
      renderConversations();
      return;
    }
    if ($("page-messages")?.classList.contains("active")) {
      await loadConversations();
      if (activeConversationId && activePeer) await openConversation(activeConversationId, activePeer);
    }
  });
  window.addEventListener("ml:page-change", event => {
    if (event.detail?.page !== "messages" && activeChannel && currentClient()) {
      clearTimeout(typingStopTimer);clearTimeout(peerTypingTimer);localTypingActive=false;
      currentClient().removeChannel(activeChannel).catch(() => {});
      activeChannel = null;showPeerTyping(false);setPeerStatus(false);
    }
  });
  $("dm-chat-empty").hidden = false;
  $("dm-chat-view").hidden = true;
  setNavUnread(0);
})();
