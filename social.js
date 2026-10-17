(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const initials = value => String(value || "ML").trim().split(/\s+/).slice(0,2).map(v => v[0] || "").join("").toUpperCase() || "ML";
  const safeImage = value => /^https:\/\//i.test(String(value || "").trim()) ? String(value).trim() : "";
  const state = { view:"feed", feedMode:"all", posts:[], comments:[], likes:new Set(), following:new Set(), followCounts:new Map(), profiles:new Map(), badges:new Map(), notifications:[], achievements:[], earned:new Set(), catalogue:[], reports:[], loaded:false, loading:false };
  const client = () => window.MortaLeague?.client || null;
  const userId = () => window.MortaLeague?.session?.user?.id || null;
  const profile = () => window.MortaLeague?.profile || null;
  const isAdmin = () => !!window.MortaLeague?.isAdmin?.();
  const suspended = () => profile()?.is_suspended === true;
  const when = value => { const d = new Date(value); if (Number.isNaN(d.getTime())) return "şimdi"; const now = Date.now(), ms = now-d.getTime(); if (ms < 60000) return "az önce"; if(ms < 3600000) return `${Math.floor(ms/60000)} dk önce`; if(ms < 86400000) return `${Math.floor(ms/3600000)} sa önce`; return new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"short",year:"numeric"}).format(d); };
  function status(id, text, type="") { const node=$(id); if(!node)return; node.textContent=text||""; node.className="inline-status social-status"+(type?` ${type}`:""); }
  function avatar(p, className="social-avatar") { const name=p?.display_name||p?.username||"Oyuncu", img=safeImage(p?.avatar_url); return img ? `<span class="${className}"><img src="${esc(img)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer"></span>` : `<span class="${className}">${esc(initials(name))}</span>`; }
  function needLogin() { if(!userId()){ window.MortaLeague?.openAuth?.(); return false; } return true; }
  function setView(view) {
    if(!["feed","discover","notifications","achievements"].includes(view)) return;
    state.view=view;
    document.querySelectorAll("[data-community-tab]").forEach(b=>b.classList.toggle("active",b.dataset.communityTab===view));
    document.querySelectorAll("[data-community-pane]").forEach(p=>p.hidden=p.dataset.communityPane!==view);
    if(view==="feed") loadFeed();
    if(view==="discover") loadDiscover();
    if(view==="notifications") loadNotifications();
    if(view==="achievements") loadAchievements();
  }
  function getFollowingProfileIds() { return state.following; }
  function syncUnreadBadge(count) {
    const n = Number(count)||0;
    ["social-nav-unread","social-tab-unread"].forEach(id=>{const node=$(id);if(node){node.hidden=n<1;node.textContent=n>99?"99+":String(n);}});
    const button=document.querySelector('[data-page="community"]'); if(button) button.setAttribute("aria-label",n?`Topluluk, ${n} okunmamış bildirim`:"Topluluk");
  }
  async function loadFollowState() {
    if(!client() || !userId()) return;
    const {data,error}=await client().from("user_follows").select("follower_id,following_id").limit(5000);
    if(error) throw error;
    state.following.clear(); state.followCounts.clear();
    (data||[]).forEach(row=>{if(row.follower_id===userId())state.following.add(row.following_id);state.followCounts.set(row.following_id,(state.followCounts.get(row.following_id)||0)+1);});
  }
  async function loadProfilesFor(ids) {
    const unique=[...new Set((ids||[]).filter(Boolean))];
    if(!unique.length)return;
    const missing=unique.filter(id=>!state.profiles.has(id)); if(!missing.length)return;
    const {data,error}=await client().from("profiles").select("id,username,display_name,bio,avatar_url,created_at,role,is_suspended").in("id",missing);
    if(error)throw error; (data||[]).forEach(p=>state.profiles.set(p.id,p));
  }
  function profileLine(p, compact=false) {
    const name=p?.display_name||p?.username||"Oyuncu";
    return `<div class="social-author">${avatar(p)}<div class="social-author-info"><strong>${esc(name)}</strong><small>@${esc(p?.username||"oyuncu")}</small>${compact?"":`<small>${Number(state.followCounts.get(p?.id)||0)} takipçi</small>`}</div></div>`;
  }
  function followButton(id, compact=false) {
    if(!id || id===userId())return "";
    const following=state.following.has(id);
    return `<button class="btn ${following?"btn-secondary":"btn-outline"} social-follow-button" type="button" data-social-follow="${esc(id)}">${following?"Takip ediliyor":"Takip et"}</button>`;
  }
  function renderFeed() {
    const host=$("social-feed-list"); if(!host)return;
    const rows=state.feedMode==="following"?state.posts.filter(p=>state.following.has(p.author_id)):state.posts;
    if(!rows.length){host.innerHTML=`<div class="empty-state">${state.feedMode==="following"?"Takip ettiğin oyuncular henüz gönderi paylaşmamış.":"Henüz gönderi yok. İlk paylaşımı sen yap!"}</div>`;return;}
    host.innerHTML=rows.map(p=>{
      const author=state.profiles.get(p.author_id)||{}; const postComments=state.comments.filter(c=>c.post_id===p.id).slice(-3);
      const postBadges=(state.badges.get(p.author_id)||[]).slice(0,3).map(b=>`<span class="mini-badge" title="${esc(b.name)}">${esc(b.icon)} ${esc(b.name)}</span>`).join("");
      const img=safeImage(p.image_url); const liked=state.likes.has(p.id);
      return `<article class="social-post-card" id="post-${esc(p.id)}"><header class="social-post-header">${profileLine(author,true)}<div class="social-post-meta"><time>${esc(when(p.created_at))}</time><button type="button" class="social-report-button" data-report-type="post" data-report-id="${esc(p.id)}" aria-label="Gönderiyi şikâyet et">⋯</button></div></header>${postBadges?`<div class="social-author-badges">${postBadges}</div>`:""}<div class="social-post-body">${esc(p.content)}</div>${img?`<a class="social-post-image-link" href="${esc(img)}" target="_blank" rel="noopener noreferrer"><img class="social-post-image" src="${esc(img)}" loading="lazy" alt="Gönderiye eklenen görsel" referrerpolicy="no-referrer"></a>`:""}<div class="social-post-actions"><button class="social-action ${liked?"liked":""}" type="button" data-social-like="${esc(p.id)}">${liked?"♥ Beğenildi":"♡ Beğen"} <span>${p.likeCount||0}</span></button><span class="social-action-static">◌ ${p.commentCount||0} yorum</span>${followButton(p.author_id,true)}</div><div class="social-comments">${postComments.map(c=>{const cp=state.profiles.get(c.author_id)||{};return `<div class="social-comment-row">${avatar(cp,"social-comment-avatar")}<div><strong>${esc(cp.display_name||cp.username||"Oyuncu")}</strong><p>${esc(c.content)}</p></div><button class="social-report-button" type="button" data-report-type="comment" data-report-id="${esc(c.id)}" title="Yorumu şikâyet et">⚑</button></div>`;}).join("")}${(p.commentCount||0)>3?`<p class="social-muted-note">ve ${p.commentCount-3} yorum daha…</p>`:""}<form class="social-comment-form" data-social-comment-form="${esc(p.id)}"><input type="text" maxlength="500" required placeholder="Yorum yaz…" aria-label="Yorum yaz"><button type="submit" class="btn btn-secondary">Yorum yap</button></form></div></article>`;
    }).join("");
  }
  async function loadFeed() {
    const host=$("social-feed-list"); if(!host || state.loading)return;
    if(!needLogin())return;
    state.loading=true; status("social-feed-status","Akış yükleniyor…");
    try {
      await loadFollowState();
      const {data:posts,error}=await client().from("posts").select("id,author_id,content,image_url,created_at").order("created_at",{ascending:false}).limit(50);
      if(error)throw error;
      state.posts=posts||[]; const ids=state.posts.map(p=>p.id), authorIds=state.posts.map(p=>p.author_id);
      state.comments=[]; state.likes.clear(); state.badges.clear();
      if(ids.length){
        const [likesRes,commentsRes]=await Promise.all([
          client().from("post_likes").select("post_id,user_id").in("post_id",ids).limit(5000),
          client().from("post_comments").select("id,post_id,author_id,content,created_at").in("post_id",ids).order("created_at",{ascending:true}).limit(1000)
        ]);
        if(likesRes.error)throw likesRes.error; if(commentsRes.error)throw commentsRes.error;
        const likes=likesRes.data||[]; state.comments=commentsRes.data||[];
        likes.forEach(l=>{if(l.user_id===userId())state.likes.add(l.post_id);});
        const likeCounts=new Map(),commentCounts=new Map(); likes.forEach(l=>likeCounts.set(l.post_id,(likeCounts.get(l.post_id)||0)+1));
        state.comments.forEach(c=>commentCounts.set(c.post_id,(commentCounts.get(c.post_id)||0)+1));
        state.posts.forEach(p=>{p.likeCount=likeCounts.get(p.id)||0;p.commentCount=commentCounts.get(p.id)||0;});
      }
      await loadProfilesFor([...authorIds,...state.comments.map(c=>c.author_id)]);
      const profileIds=[...new Set([...authorIds,...state.comments.map(c=>c.author_id)])];
      if(profileIds.length){const {data:badges,error:badgeError}=await client().from("user_achievements").select("user_id,achievement_code").in("user_id",profileIds);if(badgeError)throw badgeError;const codes=[...new Set((badges||[]).map(b=>b.achievement_code))];let catalog=[];if(codes.length){const {data,error:catErr}=await client().from("achievement_catalog").select("code,name,icon").in("code",codes);if(catErr)throw catErr;catalog=data||[];}const catMap=new Map(catalog.map(b=>[b.code,b]));(badges||[]).forEach(b=>{const item=catMap.get(b.achievement_code);if(item){if(!state.badges.has(b.user_id))state.badges.set(b.user_id,[]);state.badges.get(b.user_id).push(item);}});}
      const compose=$("social-post-form"); if(compose){compose.hidden=suspended();const notice=$("social-suspended-note");if(notice)notice.hidden=!suspended();}
      renderFeed(); status("social-feed-status",`${state.posts.length} gönderi`+(suspended()?" · Hesabın kısıtlandığı için etkileşim yapamazsın.":""),suspended()?"error":"");
    } catch(error) {status("social-feed-status",error?.message||"Akış yüklenemedi. 03_social_community.sql dosyasının Supabase'te çalıştırıldığını kontrol et.","error");host.innerHTML='<div class="empty-state">Topluluk verileri yüklenemedi. Veritabanı güncellemesi gerekebilir.</div>';}
    finally{state.loading=false;}
  }
  async function publishPost(event) {
    event.preventDefault();
    const form=event.currentTarget;
    if(!needLogin()||suspended())return;
    const content=$("social-post-content").value.trim();
    const file=$("social-post-image-file")?.files?.[0]||null;
    let imageUrl=$("social-post-image-url").value.trim();
    if(!content||content.length>1200){status("social-feed-status","Gönderi 1–1200 karakter olmalı.","error");return;}
    if(file&&imageUrl){status("social-feed-status","Fotoğraf seçtiysen bağlantı alanını boş bırak.","error");return;}
    if(imageUrl&&!safeImage(imageUrl)){status("social-feed-status","Görsel bağlantısı https:// ile başlamalı.","error");return;}
    const allowedTypes=new Set(["image/jpeg","image/png","image/webp","image/gif"]);
    if(file&&!allowedTypes.has(file.type)){status("social-feed-status","JPG, PNG, WEBP veya GIF biçiminde fotoğraf seç.","error");return;}
    if(file&&file.size>5*1024*1024){status("social-feed-status","Fotoğraf en fazla 5 MB olabilir.","error");return;}
    const button=$("social-post-submit");button.disabled=true;button.textContent=file?"Fotoğraf yükleniyor…":"Paylaşılıyor…";
    let uploadedPath=null;
    try{
      if(file){
        const bucket=client().storage.from("mortaleague-post-images");
        const safeName=(file.name||"image").replace(/[^a-z0-9._-]+/gi,"_").slice(-80)||"image";
        uploadedPath=`${userId()}/${Date.now()}-${Math.random().toString(36).slice(2,10)}-${safeName}`;
        const {error:uploadError}=await bucket.upload(uploadedPath,file,{cacheControl:"3600",upsert:false,contentType:file.type});
        if(uploadError){
          if(/bucket not found|not found/i.test(uploadError.message||""))throw new Error("Fotoğraf alanı kurulmamış. Önce 03_social_community.sql dosyasını Supabase'te çalıştır.");
          throw uploadError;
        }
        imageUrl=bucket.getPublicUrl(uploadedPath).data?.publicUrl||"";
        if(!safeImage(imageUrl))throw new Error("Fotoğraf bağlantısı oluşturulamadı.");
      }
      button.textContent="Paylaşılıyor…";
      const {error}=await client().from("posts").insert({author_id:userId(),content,image_url:imageUrl||null});
      if(error)throw error;
      uploadedPath=null;
      form.reset();await loadFeed();await updateNotificationCount();status("social-feed-status","Gönderin paylaşıldı.","success");
    }catch(error){
      if(uploadedPath){try{await client().storage.from("mortaleague-post-images").remove([uploadedPath]);}catch{}}
      status("social-feed-status",error?.message||"Gönderi paylaşılamadı.","error");
    }finally{button.disabled=false;button.textContent="Paylaş ↗";}
  }
  async function toggleLike(postId) {
    if(!needLogin()||suspended())return; const liked=state.likes.has(postId);
    try { const result=liked?await client().from("post_likes").delete().eq("post_id",postId).eq("user_id",userId()):await client().from("post_likes").insert({post_id:postId,user_id:userId()}); if(result.error)throw result.error; await loadFeed(); await updateNotificationCount(); }
    catch(error){status("social-feed-status",error?.message||"Beğeni güncellenemedi.","error");}
  }
  async function addComment(event, postId) {
    event.preventDefault(); if(!needLogin()||suspended())return;
    const input=event.currentTarget.querySelector("input"), content=input.value.trim(); if(!content)return;
    const button=event.currentTarget.querySelector("button[type=submit]");button.disabled=true;
    try{const {error}=await client().from("post_comments").insert({post_id:postId,author_id:userId(),content});if(error)throw error;input.value="";await loadFeed();await updateNotificationCount();}
    catch(error){status("social-feed-status",error?.message||"Yorum eklenemedi.","error");}
    finally{button.disabled=false;}
  }
  async function toggleFollow(targetId) {
    if(!needLogin()||suspended())return;
    if(targetId===userId())return;
    try {
      const result=state.following.has(targetId)
        ?await client().from("user_follows").delete().eq("follower_id",userId()).eq("following_id",targetId)
        :await client().from("user_follows").insert({follower_id:userId(),following_id:targetId});
      if(result.error)throw result.error;
      await loadFollowState(); if(state.view==="discover")renderDiscover(); if(state.view==="feed")renderFeed(); await updateNotificationCount();
    } catch(error){status("social-discover-status",error?.message||"Takip durumu değiştirilemedi.","error");}
  }
  async function loadDiscover() {
    const host=$("social-discover-list");if(!host||!needLogin())return;
    status("social-discover-status","Oyuncular yükleniyor…");
    try {
      await loadFollowState();
      const {data,error}=await client().from("profiles").select("id,username,display_name,bio,avatar_url,created_at,role,is_suspended").order("created_at",{ascending:false}).limit(300);
      if(error)throw error; state.discoverProfiles=(data||[]).filter(p=>!p.is_suspended);
      (state.discoverProfiles||[]).forEach(p=>state.profiles.set(p.id,p));renderDiscover();status("social-discover-status",`${state.discoverProfiles.length} oyuncu bulundu.`);
    } catch(error){status("social-discover-status",error?.message||"Oyuncular bulunamadı.","error");host.innerHTML='<div class="empty-state">Oyuncu keşfet yüklenemedi.</div>';}
  }
  function renderDiscover() {
    const host=$("social-discover-list");if(!host)return;
    const q=($("social-discover-search")?.value||"").trim().toLocaleLowerCase("tr-TR");
    const rows=(state.discoverProfiles||[]).filter(p=>p.id!==userId()&&`${p.username} ${p.display_name} ${p.bio}`.toLocaleLowerCase("tr-TR").includes(q));
    host.innerHTML=rows.map(p=>`<article class="social-discover-card">${avatar(p,"social-discover-avatar")}<div class="social-discover-main"><strong>${esc(p.display_name||p.username)}</strong><small>@${esc(p.username)}</small><p>${esc(p.bio||"Henüz biyografi eklenmemiş.")}</p><span class="social-follower-count">${Number(state.followCounts.get(p.id)||0)} takipçi</span></div><div class="social-discover-actions">${followButton(p.id)}<button class="btn btn-secondary" type="button" data-message-user="${esc(p.id)}">Mesaj</button><button class="social-report-button" type="button" data-report-type="profile" data-report-id="${esc(p.id)}" title="Profili şikâyet et">⚑</button></div></article>`).join("");
    if(!rows.length)host.innerHTML='<div class="empty-state">Aramana uygun oyuncu bulunamadı.</div>';
  }
  function renderNotifications() {
    const host=$("social-notifications-list");if(!host)return;
    if(!state.notifications.length){host.innerHTML='<div class="empty-state">Şimdilik yeni bildirimin yok.</div>';return;}
    host.innerHTML=state.notifications.map(n=>{const actor=state.profiles.get(n.actor_id)||null;const label=actor?(actor.display_name||actor.username):"MortaLeague";return `<button type="button" class="social-notification ${n.read_at?"":"unread"}" data-social-notification="${esc(n.id)}" data-social-notification-post="${esc(n.post_id||"")}" data-social-notification-kind="${esc(n.kind)}">${actor?avatar(actor,"social-notification-avatar"):"<span class=\"social-notification-avatar\">✦</span>"}<span class="social-notification-copy"><strong>${esc(label)}</strong><span>${esc(n.body)}</span><time>${esc(when(n.created_at))}</time></span>${n.read_at?"":"<span class=\"social-unread-dot\"></span>"}</button>`;}).join("");
  }
  async function updateNotificationCount() {
    if(!client()||!userId()){syncUnreadBadge(0);return;}
    try{const {count,error}=await client().from("notifications").select("id",{count:"exact",head:true}).eq("recipient_id",userId()).is("read_at",null);if(error)throw error;syncUnreadBadge(count||0);}catch{syncUnreadBadge(0);}
  }
  async function loadNotifications() {
    const host=$("social-notifications-list");if(!host||!needLogin())return;
    status("social-notifications-status","Bildirimler yükleniyor…");
    try {
      const {data,error}=await client().from("notifications").select("id,recipient_id,actor_id,kind,body,post_id,comment_id,created_at,read_at").eq("recipient_id",userId()).order("created_at",{ascending:false}).limit(100);
      if(error)throw error;state.notifications=data||[];await loadProfilesFor(state.notifications.map(n=>n.actor_id));renderNotifications();status("social-notifications-status",`${state.notifications.filter(n=>!n.read_at).length} okunmamış bildirim`);await updateNotificationCount();
    } catch(error){status("social-notifications-status",error?.message||"Bildirimler yüklenemedi.","error");host.innerHTML='<div class="empty-state">Bildirim sistemi için veritabanı güncellemesi gerekebilir.</div>';}
  }
  async function markAllNotificationsRead() {
    if(!needLogin())return;try{const {error}=await client().from("notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",userId()).is("read_at",null);if(error)throw error;await loadNotifications();}catch(error){status("social-notifications-status",error?.message||"Bildirimler güncellenemedi.","error");}
  }
  async function loadAchievements() {
    const host=$("social-achievements-list");if(!host||!needLogin())return;
    status("social-achievements-status","Rozetlerin yükleniyor…");
    try{const [catalogRes,earnedRes]=await Promise.all([client().from("achievement_catalog").select("code,name,description,icon,sort_order").order("sort_order"),client().from("user_achievements").select("achievement_code,awarded_at").eq("user_id",userId())]);if(catalogRes.error)throw catalogRes.error;if(earnedRes.error)throw earnedRes.error;state.catalogue=catalogRes.data||[];state.earned=new Set((earnedRes.data||[]).map(a=>a.achievement_code));const earnedMap=new Map((earnedRes.data||[]).map(a=>[a.achievement_code,a.awarded_at]));host.innerHTML=state.catalogue.map(a=>{const earned=state.earned.has(a.code);return `<article class="achievement-card ${earned?"earned":"locked"}"><span class="achievement-icon">${esc(a.icon)}</span><div><strong>${esc(a.name)}</strong><p>${esc(a.description)}</p><small>${earned?`Kazanıldı · ${esc(when(earnedMap.get(a.code)))}`:"Henüz kazanılmadı"}</small></div>${earned?"<span class=\"achievement-check\">✓</span>":"<span class=\"achievement-lock\">◇</span>"}</article>`;}).join("");status("social-achievements-status",`${state.earned.size} / ${state.catalogue.length} rozet kazanıldı.`);}
    catch(error){status("social-achievements-status",error?.message||"Rozetler yüklenemedi.","error");host.innerHTML='<div class="empty-state">Rozetler için veritabanı güncellemesi gerekebilir.</div>';}
  }
  async function submitReport(type,id) {
    if(!needLogin()||suspended())return;
    const reason=window.prompt("Şikâyet nedeni (Spam, hakaret, uygunsuz içerik veya diğer):","Uygunsuz içerik");if(!reason||!reason.trim())return;
    const details=window.prompt("Ek açıklama (isteğe bağlı, en fazla 500 karakter):","")||"";
    try{const {error}=await client().from("content_reports").insert({reporter_id:userId(),target_type:type,target_id:id,reason:reason.trim().slice(0,80),details:details.trim().slice(0,500)});if(error){if(error.code==="23505")throw new Error("Bu içerikle ilgili açık bir şikâyetin zaten var.");throw error;}window.alert("Şikâyetin yönetim ekibine iletildi. Teşekkürler.");}
    catch(error){window.alert(error?.message||"Şikâyet gönderilemedi.");}
  }
  async function loadReports() {
    const host=$("social-reports-list");if(!host||!isAdmin())return;
    status("social-reports-status","Şikâyetler yükleniyor…");
    try{
      const {data,error}=await client().from("content_reports").select("id,reporter_id,target_type,target_id,reason,details,status,created_at").in("status",["open","reviewing"]).order("created_at",{ascending:false}).limit(100);if(error)throw error;state.reports=data||[];
      const reporters=[...new Set(state.reports.map(r=>r.reporter_id))];await loadProfilesFor(reporters);
      const postIds=state.reports.filter(r=>r.target_type==="post").map(r=>r.target_id), commentIds=state.reports.filter(r=>r.target_type==="comment").map(r=>r.target_id), profileIds=state.reports.filter(r=>r.target_type==="profile").map(r=>r.target_id), messageIds=state.reports.filter(r=>r.target_type==="message").map(r=>r.target_id);
      const [posts,comments,profiles,messages]=await Promise.all([
        postIds.length?client().from("posts").select("id,content,author_id").in("id",postIds):Promise.resolve({data:[],error:null}),
        commentIds.length?client().from("post_comments").select("id,content,author_id").in("id",commentIds):Promise.resolve({data:[],error:null}),
        profileIds.length?client().from("profiles").select("id,username,display_name").in("id",profileIds):Promise.resolve({data:[],error:null}),
        Promise.all(messageIds.map(async id=>{const r=await client().rpc("admin_get_reported_message",{target_message_id:id});if(r.error)throw r.error;return r.data?.[0]||null;})).then(data=>({data,error:null}))
      ]);for(const r of [posts,comments,profiles,messages])if(r.error)throw r.error;
      const targets=new Map();(posts.data||[]).forEach(x=>targets.set(`post:${x.id}`,x));(comments.data||[]).forEach(x=>targets.set(`comment:${x.id}`,x));(profiles.data||[]).forEach(x=>targets.set(`profile:${x.id}`,x));(messages.data||[]).filter(Boolean).forEach(x=>targets.set(`message:${x.id}`,x));
      host.innerHTML=state.reports.map(r=>{const reporter=state.profiles.get(r.reporter_id)||{};const target=targets.get(`${r.target_type}:${r.target_id}`)||{};const targetText=r.target_type==="profile"?`@${target.username||"profil bulunamadı"}`:String(target.content||target.body||"İçerik kaldırılmış olabilir.");return `<article class="social-report-card"><header><strong>${esc(r.target_type==="post"?"Gönderi":r.target_type==="comment"?"Yorum":r.target_type==="message"?"Özel mesaj":"Profil")} şikâyeti</strong><time>${esc(when(r.created_at))}</time></header><p><b>Bildiren:</b> @${esc(reporter.username||"bilinmiyor")} · <b>Neden:</b> ${esc(r.reason)}</p><blockquote>${esc(r.details||"Ek açıklama yok.")}</blockquote><div class="social-report-target">${esc(targetText.slice(0,360))}</div><div class="social-report-actions"><button type="button" class="btn btn-secondary" data-report-dismiss="${r.id}">Reddet / kapat</button><button type="button" class="btn btn-outline" data-report-action="${r.id}" data-report-target-type="${r.target_type}" data-report-target-id="${esc(r.target_id)}">${r.target_type==="profile"?"Hesabı askıya al":"İçeriği kaldır"}</button></div></article>`;}).join("");
      if(!state.reports.length)host.innerHTML='<div class="empty-state">Bekleyen şikâyet yok. Güzel, moderasyon sakin. ✦</div>';status("social-reports-status",`${state.reports.length} açık şikâyet`);
    }catch(error){status("social-reports-status",error?.message||"Şikâyet kuyruğu yüklenemedi.","error");host.innerHTML='<div class="empty-state">Moderasyon kuyruğu yüklenemedi. SQL migration ve yönetici rolünü kontrol et.</div>';}
  }
  async function resolveReport(id, action, type, targetId) {
    if(!isAdmin())return;
    try{
      if(action==="remove"){
        if(type==="post"){const r=await client().from("posts").delete().eq("id",targetId);if(r.error)throw r.error;}
        else if(type==="comment"){const r=await client().from("post_comments").delete().eq("id",targetId);if(r.error)throw r.error;}
        else if(type==="message"){const r=await client().rpc("admin_remove_reported_message",{target_message_id:targetId});if(r.error)throw r.error;}
        else if(type==="profile"){const r=await client().rpc("admin_set_profile_suspension",{target_profile_id:targetId,should_suspend:true});if(r.error)throw r.error;}
      }
      const {error}=await client().from("content_reports").update({status:action==="remove"?"actioned":"dismissed",reviewed_at:new Date().toISOString(),reviewed_by:userId()}).eq("id",id);if(error)throw error;
      await loadReports();await loadAuditLog();await updateNotificationCount();
    }catch(error){status("social-reports-status",error?.message||"Şikâyet işlenemedi.","error");}
  }
  async function loadAuditLog() {
    const host=$("social-audit-list");if(!host||!isAdmin())return;
    status("social-audit-status","İşlem geçmişi yükleniyor…");
    try {
      const {data,error}=await client().from("admin_audit_log").select("id,admin_id,action_type,target_type,target_id,details,created_at").order("created_at",{ascending:false}).limit(100);
      if(error)throw error;const rows=data||[];await loadProfilesFor(rows.map(r=>r.admin_id));
      const labels={profile_suspended:"Hesap askıya alındı",profile_unsuspended:"Hesap kısıtlaması kaldırıldı",post_removed:"Gönderi kaldırıldı",comment_removed:"Yorum kaldırıldı",message_removed:"Özel mesaj kaldırıldı",report_actioned:"Şikâyet işlem gördü",report_dismissed:"Şikâyet kapatıldı",report_reviewing:"Şikâyet incelemeye alındı",report_open:"Şikâyet açıldı"};
      host.innerHTML=rows.map(r=>{const admin=state.profiles.get(r.admin_id)||{};return `<article class="social-audit-row"><div><strong>${esc(labels[r.action_type]||r.action_type)}</strong><small>${esc(admin.username?"@"+admin.username:"Yönetici")} · ${esc(r.target_type)} #${esc(r.target_id||"—")}</small><p>${esc(r.details||"")}</p></div><time>${esc(when(r.created_at))}</time></article>`;}).join("");
      if(!rows.length)host.innerHTML='<div class="empty-state">Henüz yönetici işlemi kaydedilmemiş.</div>';status("social-audit-status",`${rows.length} işlem listelendi.`);
    }catch(error){status("social-audit-status",error?.message||"İşlem geçmişi yüklenemedi.","error");host.innerHTML='<div class="empty-state">İşlem geçmişi için 03_social_community.sql migration dosyasını çalıştır.</div>';}
  }
  document.addEventListener("click",async event=>{
    const tab=event.target.closest("[data-community-tab]");if(tab){setView(tab.dataset.communityTab);return;}
    const filter=event.target.closest("[data-social-feed-filter]");if(filter){state.feedMode=filter.dataset.socialFeedFilter;document.querySelectorAll("[data-social-feed-filter]").forEach(b=>b.classList.toggle("active",b===filter));loadFeed();return;}
    const like=event.target.closest("[data-social-like]");if(like){toggleLike(like.dataset.socialLike);return;}
    const follow=event.target.closest("[data-social-follow]");if(follow){toggleFollow(follow.dataset.socialFollow);return;}
    const dmReport=event.target.closest("[data-report-dm-message]");if(dmReport){submitReport("message",dmReport.dataset.reportDmMessage);return;}
    const report=event.target.closest("[data-report-type]");if(report){submitReport(report.dataset.reportType,report.dataset.reportId);return;}
    const notification=event.target.closest("[data-social-notification]");if(notification){const id=notification.dataset.socialNotification,post=notification.dataset.socialNotificationPost,kind=notification.dataset.socialNotificationKind;try{const {error}=await client().from("notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("recipient_id",userId()).is("read_at",null);if(error)throw error;await updateNotificationCount();}catch{}if(kind==="message"){window.MortaUI?.showPage?.("messages");return;}if(kind==="announcement"){window.MortaUI?.showPage?.("home");return;}if(post){setView("feed");setTimeout(()=>$("post-"+post)?.scrollIntoView({behavior:"smooth",block:"center"}),250);}else loadNotifications();return;}
    const mark=event.target.closest("[data-social-mark-all]");if(mark){markAllNotificationsRead();return;}
    const dismiss=event.target.closest("[data-report-dismiss]");if(dismiss){resolveReport(dismiss.dataset.reportDismiss,"dismiss");return;}
    const action=event.target.closest("[data-report-action]");if(action){const type=action.dataset.reportTargetType;const confirmed=window.confirm(type==="profile"?"Bu hesabı askıya almak istediğine emin misin?":"Bu içeriği kaldırıp şikâyeti kapatmak istediğine emin misin?");if(confirmed)resolveReport(action.dataset.reportAction,"remove",type,action.dataset.reportTargetId);return;}
  });
  $("social-post-form")?.addEventListener("submit",publishPost);
  $("social-feed-refresh")?.addEventListener("click",loadFeed);
  $("social-discover-search")?.addEventListener("input",renderDiscover);
  $("social-discover-refresh")?.addEventListener("click",loadDiscover);
  $("social-notifications-refresh")?.addEventListener("click",loadNotifications);
  $("social-reports-refresh")?.addEventListener("click",loadReports);
  $("social-audit-refresh")?.addEventListener("click",loadAuditLog);
  document.addEventListener("submit",event=>{const form=event.target.closest("[data-social-comment-form]");if(form){addComment(event,form.dataset.socialCommentForm);}});
  window.addEventListener("ml:page-change",event=>{if(event.detail?.page==="community"&&userId()){state.loaded=true;setView(state.view);updateNotificationCount();}if(event.detail?.page==="admin"&&isAdmin()){loadReports();loadAuditLog();}});
  window.addEventListener("ml:ready",()=>{if(userId())updateNotificationCount();});
  window.setInterval(()=>{if(!userId())return;updateNotificationCount();if($("page-community")?.classList.contains("active")&&state.view==="notifications")loadNotifications();},30000);
  window.addEventListener("ml:auth-state",()=>{if(userId()){state.loaded=true;updateNotificationCount();if($("page-community")?.classList.contains("active"))setView(state.view);if($("page-admin")?.classList.contains("active")&&isAdmin()){loadReports();loadAuditLog();}}else{syncUnreadBadge(0);state.posts=[];state.notifications=[];state.following.clear();}});
  window.MortaSocial={loadFeed,loadDiscover,loadNotifications,loadAchievements,loadReports,loadAuditLog,setView,updateNotificationCount,refresh:()=>{loadFeed();loadNotifications();}};
})();
