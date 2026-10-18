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
  let conversationListSeq = 0;
  let lastAuthUserId = null;
  let messageRequestSeq = 0;
  let conversationOpenSeq = 0;
  let chatStartSeq = 0;
  let playerSearchSeq = 0;
  let lastConversationRefreshAt = 0;
  let pollInFlight = false;
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
    const requestUserId = currentUserId();
    if (!requestUserId) {
      ++conversationListSeq; // Invalidate any result started by an earlier session.
      loadingConversations = false;
      conversations = [];
      renderConversations();
      setNavUnread(0);
      say("dm-list-status", "Özel mesajları kullanmak için giriş yap.");
      return;
    }
    if (loadingConversations) return;
    const requestSeq = ++conversationListSeq;
    const isCurrent = () => requestSeq === conversationListSeq && requestUserId === currentUserId();
    loadingConversations = true;
    const listHost = $("dm-conversation-list");
    if (listHost && !conversations.length) listHost.innerHTML = '<div class="skeleton-card skeleton-player" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-medium"></span></div><div class="skeleton-card skeleton-player" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span></div>';
    try {
      const result = await window.MortaLeague.listDirectConversations();
      // Do not let an older account's query overwrite the current account's private inbox.
      if (!isCurrent()) return;
      conversations = Array.isArray(result) ? result : [];
      lastConversationRefreshAt = Date.now();
      renderConversations();
      const unread = conversations.reduce((sum, row) => sum + (row.unreadCount || 0), 0);
      setNavUnread(unread);
      say("dm-list-status", conversations.length ? `${conversations.length} sohbet` : "");
      if (activeConversationId) {
        const active = conversations.find(c => c.id === activeConversationId);
        if (active?.otherProfile) activePeer = active.otherProfile;
      }
    } catch (error) {
      if (!isCurrent()) return;
      say("dm-list-status", friendlyError(error, "Sohbet listesi yüklenemedi. Bağlantını ve mesajlaşma kurulumunu kontrol et."), "error");
      if (listHost) listHost.innerHTML = '<div class="dm-sidebar-empty">Sohbetler yüklenemedi. İnternet bağlantını ve kurulumunu kontrol et.</div>';
    } finally {
      if (requestSeq === conversationListSeq) loadingConversations = false;
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
    const requestId = ++playerSearchSeq;
    const query = ($("dm-user-search")?.value || "").trim().toLocaleLowerCase("tr-TR");
    const host = $("dm-user-search-results");
    if (!host) return;
    if (query.length < 2) { host.innerHTML = ""; host.hidden = true; return; }
    host.hidden = false;
    if (!currentUserId()) { host.innerHTML = '<p class="dm-help-text">Giriş yapman gerekiyor.</p>'; return; }
    host.innerHTML = '<p class="dm-help-text">Aranıyor…</p>';
    try {
      const profiles = await fetchProfiles();
      if (requestId !== playerSearchSeq || query !== ($("dm-user-search")?.value || "").trim().toLocaleLowerCase("tr-TR")) return;
      const matches = profiles.filter(p => `${p.username || ""} ${p.display_name || ""}`.toLocaleLowerCase("tr-TR").includes(query));
      renderSearchResults(matches);
    } catch (error) {
      if (requestId !== playerSearchSeq) return;
      host.innerHTML = `<p class="dm-help-text is-error">${esc(friendlyError(error, "Oyuncular aranamadı."))}</p>`;
    }
  }
  function renderMessages(rows) {
    const host = $("dm-message-list");
    if (!host) return;
    const keepAtBottom = host.scrollHeight - host.scrollTop - host.clientHeight < 120;
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
    if (keepAtBottom) host.scrollTop = host.scrollHeight;
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
    const conversationId = activeConversationId;
    if (!conversationId || !currentUserId()) return;
    const requestSeq = ++messageRequestSeq;
    try {
      const rows = await window.MortaLeague.listDirectMessages(conversationId);
      // A fast switch between conversations must never paint stale messages into the new chat.
      if (requestSeq !== messageRequestSeq || conversationId !== activeConversationId) return;
      const hasUnreadIncoming = rows.some(message => message.sender_id !== currentUserId() && !message.read_at);
      renderMessages(rows);
      if (markRead && hasUnreadIncoming && conversationId === activeConversationId) {
        try {
          await window.MortaLeague.markDirectMessagesRead(conversationId);
          if (conversationId === activeConversationId && requestSeq === messageRequestSeq) await loadConversations();
        } catch (readError) {
          if (conversationId === activeConversationId && requestSeq === messageRequestSeq) {
            say("dm-chat-status", friendlyError(readError, "Mesaj açıldı ancak okundu bilgisi güncellenemedi."), "error");
          }
        }
      }
    } catch (error) {
      if (requestSeq === messageRequestSeq && conversationId === activeConversationId) {
        say("dm-chat-status", friendlyError(error,"Mesajlar yüklenemedi. Sohbet SQL kurulumunu ve bağlantını kontrol et."), "error");
      }
    }
  }
  async function updateCurrentBlockState(peer = activePeer) {
    const peerId = peer?.id;
    if (!peerId) return;
    let blockedIds = myBlockedIds;
    let canSend = false;
    try {
      blockedIds = new Set(await window.MortaLeague.listDirectBlocks());
      canSend = await window.MortaLeague.canDirectMessage(peerId);
    } catch (_) {
      canSend = false;
    }
    // Do not let a slow request for the previous peer overwrite the current chat state.
    if (activePeer?.id !== peerId) return;
    myBlockedIds = blockedIds;
    currentCanSend = canSend;
    const blockButton = $("dm-block-button");
    if (blockButton) {
      blockButton.textContent = myBlockedIds.has(peerId) ? "Engeli kaldır" : "Engelle";
      blockButton.setAttribute("aria-pressed", String(myBlockedIds.has(peerId)));
    }
    await setReadOnlyState();
  }
  async function openConversation(conversationId, peer) {
    if (!conversationId || !peer) return;
    const openSeq = ++conversationOpenSeq;
    const oldChannel = activeChannel;
    activeChannel = null;
    clearTimeout(typingStopTimer);
    clearTimeout(peerTypingTimer);
    localTypingActive = false;
    showPeerTyping(false);
    activeConversationId = conversationId;
    activePeer = peer;
    ++messageRequestSeq;
    if (oldChannel && currentClient()) {
      try { await currentClient().removeChannel(oldChannel); } catch (_) {}
    }
    if (openSeq !== conversationOpenSeq || activeConversationId !== conversationId) return;

    document.querySelector(".messages-shell")?.classList.add("dm-mobile-chat-open");
    renderConversations();
    $("dm-chat-empty").hidden = true;
    $("dm-chat-view").hidden = false;
    const name = peer.display_name || peer.username || "Oyuncu";
    const avatar = $("dm-chat-avatar");
    avatar.innerHTML = avatarHTML(peer, "dm-chat-avatar-inner");
    $("dm-chat-name").textContent = name;
    $("dm-chat-username").textContent = "@" + (peer.username || "oyuncu");
    setPeerStatus(false, "Bağlanıyor…");
    $("dm-message-list").innerHTML = '<div class="skeleton-card skeleton-message" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span><span class="skeleton-line skeleton-medium"></span></div><div class="skeleton-card skeleton-message skeleton-message-right" aria-hidden="true"><span class="skeleton-line skeleton-short"></span><span class="skeleton-line"></span></div>';
    say("dm-chat-status", "Sohbet yükleniyor…");
    await updateCurrentBlockState(peer);
    if (openSeq !== conversationOpenSeq || activeConversationId !== conversationId) return;
    await refreshActiveMessages(true);
    if (openSeq !== conversationOpenSeq || activeConversationId !== conversationId) return;
    await loadConversations();
    if (openSeq !== conversationOpenSeq || activeConversationId !== conversationId) return;

    const client = currentClient();
    if (client) {
      const channel = client.channel(`mortaleague-dm-${conversationId}`, {
        config: { private: true, presence: { key: currentUserId() }, broadcast: { ack: true } }
      });
      activeChannel = channel;
      channel
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${conversationId}` }, async () => {
          if (openSeq !== conversationOpenSeq || activeConversationId !== conversationId || activeChannel !== channel) return;
          await refreshActiveMessages(true);
          if (openSeq === conversationOpenSeq && activeConversationId === conversationId) await loadConversations();
        })
        .on("presence", { event: "sync" }, () => {
          if (openSeq !== conversationOpenSeq || activeChannel !== channel || !activePeer) return;
          const presence = channel.presenceState() || {};
          setPeerStatus(Boolean(presence[activePeer.id]?.length));
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (openSeq !== conversationOpenSeq || activeChannel !== channel || !payload || payload.user_id === currentUserId()) return;
          showPeerTyping(payload.typing === true);
          clearTimeout(peerTypingTimer);
          if (payload.typing === true) peerTypingTimer = setTimeout(() => {
            if (openSeq === conversationOpenSeq && activeChannel === channel) showPeerTyping(false);
          }, 2200);
        })
        .subscribe(async status => {
          if (openSeq !== conversationOpenSeq || activeChannel !== channel) return;
          if (status === "SUBSCRIBED") {
            try { await channel.track({ user_id: currentUserId(), online_at: new Date().toISOString() }); }
            catch (_) { setPeerStatus(false, "Durum alınamadı"); }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setPeerStatus(false, "Canlı durum kullanılamıyor");
          }
        });
    }
    const input = $("dm-message-input");
    if (input && currentCanSend && openSeq === conversationOpenSeq) input.focus({ preventScroll: true });
  }
  async function openChat(targetUserId) {
    if (!currentUserId()) { window.MortaLeague?.openAuth(); return; }
    if (!targetUserId || targetUserId === currentUserId()) return;
    const requestId = ++chatStartSeq;
    const openerUserId = currentUserId();
    try {
      let peer = (await fetchProfiles()).find(p => p.id === targetUserId);
      if (requestId !== chatStartSeq || openerUserId !== currentUserId()) return;
      if (!peer) {
        const rows = await fetchProfiles(true);
        if (requestId !== chatStartSeq || openerUserId !== currentUserId()) return;
        peer = rows.find(p => p.id === targetUserId);
      }
      if (!peer) throw new Error("Bu oyuncunun profili bulunamadı. Oyuncu listesini yenile.");
      const allowed = await window.MortaLeague.canDirectMessage(targetUserId);
      if (requestId !== chatStartSeq || openerUserId !== currentUserId()) return;
      if (!allowed) throw new Error("Bu oyuncuyla sohbet başlatılamıyor. Taraflardan biri diğerini engellemiş olabilir.");
      const conversationId = await window.MortaLeague.createDirectConversation(targetUserId);
      if (requestId !== chatStartSeq || openerUserId !== currentUserId()) return;
      activeConversationId = conversationId;
      activePeer = peer;
      window.MortaUI?.showPage("messages");
    } catch (error) {
      if (requestId !== chatStartSeq || openerUserId !== currentUserId()) return;
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
    // Realtime is primary. Foreground polling is a quiet fallback, never parallel with itself.
    pollTimer = setInterval(async () => {
      if (pollInFlight || document.hidden || !$("page-messages")?.classList.contains("active") || !currentUserId()) return;
      pollInFlight = true;
      try {
        if (Date.now() - lastConversationRefreshAt > 45000 && !loadingConversations) await loadConversations();
        if (!document.hidden && activeConversationId) await refreshActiveMessages(true);
      } finally { pollInFlight = false; }
    }, 15000);
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
    const sendConversationId = activeConversationId;
    const sendPeerId = activePeer?.id;
    const openerUserId = currentUserId();
    if (!body || !currentCanSend || button.disabled) return;
    button.disabled = true;
    button.textContent = "Gönderiliyor…";
    clearTimeout(typingStopTimer);broadcastTyping(false);
    try {
      await window.MortaLeague.sendDirectMessage(sendConversationId, body);
      if (currentUserId() === openerUserId && activeConversationId === sendConversationId && activePeer?.id === sendPeerId) {
        if (input.value.trim() === body) {
          input.value = "";
          input.style.height = "48px";
          $("dm-character-count").textContent = "0 / 2000";
        }
        say("dm-chat-status", "Mesaj gönderildi.", "success");
        await refreshActiveMessages(true);
        await loadConversations();
      } else {
        // The send completed in the conversation that was active when the user pressed Send.
        await loadConversations();
      }
    } catch (error) {
      if (activeConversationId === sendConversationId) say("dm-chat-status", friendlyError(error, "Mesaj gönderilemedi. Tekrar dene."), "error");
      else say("dm-list-status", friendlyError(error, "Mesaj gönderilemedi. Tekrar dene."), "error");
    } finally {
      button.textContent = "Gönder ↗";
      button.disabled = !currentCanSend;
      if (currentCanSend && activeConversationId === sendConversationId) input.focus({ preventScroll: true });
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
    const nextUserId = event.detail?.session?.user?.id || null;
    const identityChanged = nextUserId !== lastAuthUserId;
    lastAuthUserId = nextUserId;
    profileCache = [];
    profileCacheAt = 0;
    playerSearchSeq++;
    if (identityChanged) {
      chatStartSeq++;
      conversationOpenSeq++;
      messageRequestSeq++;
      conversationListSeq++;
      loadingConversations = false;
      pollInFlight = false;
      lastConversationRefreshAt = 0;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      const oldChannel = activeChannel;
      activeChannel = null;
      if (oldChannel && currentClient()) { try { await currentClient().removeChannel(oldChannel); } catch (_) {} }
      activeConversationId = null;
      activePeer = null;
      conversations = [];
      currentCanSend = false;
      myBlockedIds = new Set();
      clearTimeout(typingStopTimer);
      clearTimeout(peerTypingTimer);
      localTypingActive = false;
      showPeerTyping(false);
      setPeerStatus(false);
      document.querySelector(".messages-shell")?.classList.remove("dm-mobile-chat-open");
      setNavUnread(0);
      renderConversations();
      if (!nextUserId && $("page-messages")?.classList.contains("active")) window.MortaUI?.showPage("home");
    }
    if (!nextUserId) return;
    if ($("page-messages")?.classList.contains("active")) {
      await loadConversations();
      startPolling();
      if (activeConversationId && activePeer) await openConversation(activeConversationId, activePeer);
    }
  });
  window.addEventListener("ml:page-change", event => {
    if (event.detail?.page !== "messages") {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      clearTimeout(typingStopTimer);
      clearTimeout(peerTypingTimer);
      localTypingActive = false;
      showPeerTyping(false);
      setPeerStatus(false);
      if (activeChannel && currentClient()) {
        const oldChannel = activeChannel;
        activeChannel = null;
        currentClient().removeChannel(oldChannel).catch(() => {});
      }
    } else if (currentUserId()) {
      startPolling();
    }
  });
  $("dm-chat-empty").hidden = false;
  $("dm-chat-view").hidden = true;
  setNavUnread(0);
})();
