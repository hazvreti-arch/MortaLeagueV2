(()=>{
 "use strict";
 const root=document.getElementById("mortabot-root");if(!root)return;
 const $=id=>document.getElementById(id);
 const launcher=$("mortabot-launcher"),panel=$("mortabot-panel"),close=$("mortabot-close"),clear=$("mortabot-clear"),list=$("mortabot-messages"),form=$("mortabot-form"),input=$("mortabot-input"),send=$("mortabot-send"),suggestions=$("mortabot-suggestions");
 const STORE="mortaleague-mortabot-chat-v1";let busy=false;
 const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let history=[];
 try{const parsed=JSON.parse(localStorage.getItem(STORE)||"[]");if(Array.isArray(parsed))history=parsed.filter(m=>m&&["user","assistant"].includes(m.role)&&typeof m.content==="string").slice(-24)}catch(_){history=[]}
 function formatText(text){return escapeHtml(text).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\n/g,"<br>")}
 function save(){try{localStorage.setItem(STORE,JSON.stringify(history.slice(-24)))}catch(_){}}
 function addMessage(role,content,opts={}){const div=document.createElement("div");div.className="mbot-message "+(role==="user"?"mbot-user":"mbot-assistant");if(role!=="user"){const tag=document.createElement("span");tag.className="mbot-message-tag";tag.textContent="MORTABOT";div.appendChild(tag)}const body=document.createElement("div");body.innerHTML=formatText(content);div.appendChild(body);if(opts.id)div.id=opts.id;list.appendChild(div);list.scrollTop=list.scrollHeight;return div}
 function renderHistory(){list.replaceChildren();if(!history.length){addMessage("assistant","selam kral ✨ MortaLeague sistemleri bende. oyuncu değerini hesaplayabilir, maaş ve sponsor kurallarını konuşabilir ya da aklına takılanı sorabilirsin");return}history.forEach(m=>addMessage(m.role,m.content));}
 function open(){panel.hidden=false;launcher.setAttribute("aria-expanded","true");launcher.setAttribute("aria-label","MortaBot sohbetini kapat");renderHistory();if(!window.matchMedia("(max-width: 600px)").matches)setTimeout(()=>input.focus(),80)}
 function shut(){panel.hidden=true;launcher.setAttribute("aria-expanded","false");launcher.setAttribute("aria-label","MortaBot sohbetini aç")}
 launcher.addEventListener("click",()=>panel.hidden?open():shut());close.addEventListener("click",shut);
 // Any successful in-app navigation closes the floating chat so it cannot cover the next page.
 window.addEventListener("ml:page-intent",shut);
 clear.addEventListener("click",()=>{history=[];save();renderHistory();suggestions.hidden=false;input.focus()});
 function loggedIn(){return !!window.MortaLeague?.session?.user}
 function showSignIn(){addMessage("assistant","kanka MortaBot'un yapay zekâ bağlantısını kullanmak için önce hesabına giriş yapman gerekiyor 🔐");window.MortaLeague?.openAuth?.()}
 function typing(){const el=document.createElement("div");el.className="mbot-message mbot-assistant mbot-typing";el.id="mortabot-typing";el.setAttribute("aria-label","MortaBot yazıyor");el.innerHTML="<i></i><i></i><i></i>";list.appendChild(el);list.scrollTop=list.scrollHeight;return el}
 async function sendMessage(raw){const content=String(raw||"").trim();if(!content||busy)return;if(!loggedIn()){showSignIn();return}
  history.push({role:"user",content});history=history.slice(-24);save();addMessage("user",content);suggestions.hidden=true;input.value="";input.style.height="auto";busy=true;send.disabled=true;input.disabled=true;const pending=typing();
  try{
   const client=window.MortaLeague?.client;if(!client?.functions?.invoke)throw new Error("MortaLeague bağlantısı yüklenemedi. Sayfayı yenileyip tekrar dene.");
   const {data,error}=await client.functions.invoke("mortabot",{body:{messages:history.slice(-16)}});
   if(error)throw error;const reply=typeof data?.reply==="string"?data.reply:"bir şey oldu kral, cevabı alamadım. bi daha dener misin?";
   pending.remove();history.push({role:"assistant",content:reply});history=history.slice(-24);save();addMessage("assistant",reply);
  }catch(error){pending.remove();let msg="";try{const response=error?.context;if(response&&typeof response.clone==="function"){const payload=await response.clone().json();if(typeof payload?.error==="string")msg=payload.error}}catch(_){}if(!msg)msg=String(error?.message||"");if(/401|403|unauthorized|jwt|not authenticated/i.test(msg))msg="giriş oturumun yenilenmeli kral. hesabından çıkıp tekrar giriş yap, sonra yeniden deneriz.";else if(!msg||/non-2xx|edge function returned/i.test(msg))msg="MortaBot ücretsiz model sağlayıcılarından yanıt alamadı. Otomatik yedekler denendi; biraz sonra tekrar dener misin?";addMessage("assistant",msg)}
  finally{busy=false;send.disabled=false;input.disabled=false;input.focus()}
 }
 form.addEventListener("submit",e=>{e.preventDefault();sendMessage(input.value)});
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
 input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,112)+"px"});
 suggestions.addEventListener("click",e=>{const b=e.target.closest("[data-mbot-prompt]");if(b)sendMessage(b.dataset.mbotPrompt)});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)shut()});
 // Keep the widget history locally, but never send its data to analytics or other services.
})();
