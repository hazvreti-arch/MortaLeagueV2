const systems=[
{title:"Yayın Geliri Sistemi",icon:"◉",short:"Lig sıralaması, maç sonuçları ve kupa başarılarından elde edilen gelirler.",intro:"Takımlar sezon performanslarına göre gelir elde eder. Gelirler sezon ortasında veya sezon sonunda eklenebilir.",purpose:"MortaLeague sıralama gelirlerini, maç sonuçlarını ve yerel kupa ödüllerini aynı sistemde açıkça gösterir.",items:[
"MortaLeague sıralama geliri — tüm lig kategorilerinde geçerli: 1. sıra 100.000.000€; 2. sıra 75.000.000€.",
"Sıralama geliri: 3–5. sıralar 50.000.000€; 6–10. sıralar 30.000.000€; 11–15. sıralar 25.000.000€; 16–20. sıralar 10.000.000€.",
"MortaLeague A maç geliri: galibiyet 4.000.000€, beraberlik 2.000.000€.",
"Tüm yerel kupa maçlarında: galibiyet 2.000.000€, beraberlik 1.000.000€.",
"ZMK: şampiyon 70.000.000€, finalist 35.000.000€.",
"FA Cup: şampiyon 50.000.000€, finalist 25.000.000€.",
"GOAT Cup: şampiyon 40.000.000€, finalist 20.000.000€.",
"Süper Kupa: şampiyon 20.000.000€, finalist 10.000.000€.",
"Gelirler sezon ortasında veya sezon sonunda eklenebilir."
],note:"Sıralama aralıkları çakışma olmaması için 3–5, 6–10, 11–15 ve 16–20 şeklinde gösterilmiştir."},
{title:"Oyuncu Katkı Değerleri",icon:"↗",short:"MIA, ZMK, FA Cup, GOAT Cup ve Süper Kupa katkı değerleri.",intro:"Oyuncuların yerel lig ve kupa performansları belirlenen gol, asist/GolxGym ve kupa katkı değerlerine göre hesaplanır.",purpose:"Yerel organizasyonlardaki oyuncu katkı tutarlarını ve kupa katılım koşullarını açıkça belirtir.",items:[
"MIA: GolxGym 40K€, asist 30K€, kupa 2.000.000€.",
"ZMK (ligdeki tüm takımlar katılır): GolxGym 30K€, asist 20K€, kupa 1.500.000€.",
"FA Cup (MIA ve ZMK kazananları katılamaz): GolxGym 20K€, asist 10K€, kupa 1.000.000€.",
"GOAT Cup (MIA, ZMK ve FA Cup kazananları katılamaz): GolxGym 10K€, asist 5K€, kupa 500.000€.",
"Süper Kupa (MIA, ZMK, FA Cup ve GOAT Cup kazananları kendi aralarında oynar): GolxGym 10K€, asist 5K€, kupa 250.000€."
],note:"GolxGym ifadesi, gönderilen kural metnindeki yazımıyla korunmuştur."},
{title:"Telefon Satın Alma Sistemi",icon:"▣",short:"Oyuncular maaşlarıyla telefon satın alabilir; telefonlar oyuncu değerine katkı sağlar.",intro:"Oyuncular aldıkları maaşı kullanarak telefon satın alabilir. Telefonun seviyesi yükseldikçe oyuncu değerine eklenen katkı artar.",purpose:"Telefon türü, satın alma maliyeti ve oyuncu değerine sağladığı katkıyı gösterir.",items:[
"Oppo Telefon: fiyat 3.000.000€; oyuncu değerine +250.000€.",
"Mi Telefon: fiyat 5.000.000€; oyuncu değerine +500.000€.",
"Samsung Telefon: fiyat 15.000.000€; oyuncu değerine +750.000€.",
"iPhone Telefon: fiyat 20.000.000€; oyuncu değerine +1.000.000€."
],note:"Maliyet ve katkılar gönderilen telefon satın alma sistemi metnine göre gösterilmiştir."},
{title:"Ev Satın Alma Sistemi",icon:"⌂",short:"Oyuncular maaşlarıyla ev satın alabilir; evler oyuncu değerine katkı sağlar.",intro:"Oyuncular maaşlarıyla farklı seviyelerde ev satın alabilir. Ev seçenekleri oyuncu değerine farklı miktarlarda katkı sağlar.",purpose:"Ev seçeneklerini, fiyatlarını ve oyuncu değerine eklenen katkıyı listeler.",items:[
"Apartman Dairesi: fiyat 10.000.000€; oyuncu değerine +500.000€.",
"Dubleks Ev: fiyat 25.000.000€; oyuncu değerine +1.500.000€.",
"Villa: fiyat 50.000.000€; oyuncu değerine +2.000.000€.",
"Malikane: fiyat 100.000.000€; oyuncu değerine +3.000.000€.",
"Lüks Malikane: fiyat 150.000.000€; oyuncu değerine +3.500.000€."
],note:"Ev seçenekleri ve tutarları gönderilen ev satın alma sistemi metnine göre gösterilmiştir."},
{title:"Taşıt Alma Sistemi",icon:"➤",short:"Oyuncular maaşlarıyla taşıt satın alabilir; taşıtlar oyuncu değerine katkı sağlar.",intro:"Oyuncular aldıkları maaşla taşıt satın alabilir. Daha lüks taşıtlar oyuncu değerine daha yüksek katkı sağlar.",purpose:"Taşıtların satın alma maliyetini ve oyuncu değerine katkısını gösterir.",items:[
"Motosiklet: fiyat 5.000.000€; oyuncu değerine +250.000€.",
"SUV: fiyat 10.000.000€; oyuncu değerine +500.000€.",
"Spor Araba: fiyat 20.000.000€; oyuncu değerine +1.000.000€.",
"Yat: fiyat 40.000.000€; oyuncu değerine +2.000.000€.",
"Özel Jet: fiyat 100.000.000€; oyuncu değerine +3.000.000€."
],note:"Taşıt seçenekleri ve tutarları gönderilen taşıt alma sistemi metnine göre gösterilmiştir."},
{title:"Ödül Sistemi",icon:"✦",short:"Ödüller ve karşılık gelen para ödülleri.",intro:"Belirlenen bireysel ve sezonluk başarılar, aşağıdaki ödül tutarlarıyla karşılık bulur.",purpose:"Ödül adlarını ve her ödül için belirtilen para miktarını tek yerde toplar.",items:[
"Ballon D’or: 2.500.000€.",
"Golden Boy: 1.500.000€.",
"Golden Boot: 1.000.000€.",
"Best Teknik Direktör: 1.000.000€.",
"Best Mevki: 1.000.000€.",
"Best 11: 500.000€."
],note:"Ödül adları, gönderilen metindeki yazımlarıyla korunmuştur."},
{title:"UCL / UEL / UECL Oyuncu Katkıları",icon:"♜",short:"Güncel Avrupa kupası ve uluslararası turnuva katkı değerleri.",intro:"Şampiyonlar Ligi, Avrupa Ligi ve Konferans Ligi katkı değerleri önceki değerlerin yerine güncellenmiştir. Diğer gönderilmiş turnuva değerleri de aşağıda listelenmiştir.",purpose:"Avrupa kupaları ve diğer uluslararası turnuvalardaki gol, asist, Gym ve kupa katkılarını birbirinden ayırır.",items:[
"Şampiyonlar Ligi (güncel): gol 70K€, asist 60K€, Gym 70K€, kupa 5.000.000€.",
"UEFA Avrupa Ligi (güncel): gol 60K€, asist 50K€, Gym 60K€, kupa 4.000.000€.",
"UEFA Konferans Ligi (güncel): gol 50K€, asist 40K€, Gym 50K€, kupa 3.000.000€.",
"UEFA Süper Kupa: GolxGym 50K€, asist 40K€, kupa 3.000.000€.",
"Dünya Kupası: GolxGym 70K€, asist 60K€, kupa 5.000.000€.",
"Avrupa Şampiyonası (Euro): GolxGym 60K€, asist 50K€, kupa 4.000.000€.",
"Uluslar Ligi: GolxGym 40K€, asist 30K€, kupa 2.500.000€."
],note:"Şampiyonlar Ligi, UEFA Avrupa Ligi ve UEFA Konferans Ligi için gönderdiğin yeni değerler eskilerinin yerine geçer. Diğer turnuvalar daha önce gönderilen değerlerle bırakılmıştır."},
{title:"Sponsorluk Sistemi",icon:"◇",short:"Sponsor hesabı, takım sınırları, sözleşme süresi ve başarı bonusları.",intro:"Herkes sponsor hesabı açabilir. Hesap açarken Sırt Sponsoru, Göğüs Sponsoru veya Stadyum Sponsoru kategorilerinden biri seçilir.",purpose:"Sponsor bütçelerini, imzalanabilecek takım sayılarını, bonusları ve sözleşme şartlarını listeler.",items:[
"Sponsor hesabı açmak çar sınırına dahil değildir. Her kategori bütçesi 500.000.000€ ile başlar ve her sezon sonunda 100.000.000€ artar.",
"Sırt Sponsoru en fazla 8 takımla; Göğüs Sponsoru en fazla 6 takımla; Stadyum Sponsoru en fazla 4 takımla anlaşabilir. Bir takımın en fazla 3 sponsoru olabilir: göğüs, sırt ve stadyum.",
"Takımlar sponsorlardan yalnızca imza bonusu ve kupa bonusu alır.",
"Göğüs Sponsoru — azami imza bonusu 20.000.000€; MLA şampiyonu 25.000.000€; ZMK şampiyonu 20.000.000€; FA Cup şampiyonu 15.000.000€; GOAT Cup şampiyonu 10.000.000€; Süper Kupa şampiyonu 5.000.000€.",
"Sırt Sponsoru — azami imza bonusu 15.000.000€; MLA şampiyonu 15.000.000€; ZMK şampiyonu 10.000.000€; FA Cup şampiyonu 7.000.000€; GOAT Cup şampiyonu 5.000.000€; Süper Kupa şampiyonu 3.000.000€.",
"Stadyum Sponsoru — azami imza bonusu 30.000.000€; MLA şampiyonu 30.000.000€; ZMK şampiyonu 25.000.000€; FA Cup şampiyonu 20.000.000€; GOAT Cup şampiyonu 15.000.000€; Süper Kupa şampiyonu 10.000.000€.",
"Sözleşmeler en az 2 yıllık olmalıdır ve sözleşme süresinde feshedilemez.",
"Sponsorluk kapanırsa yeni bir sponsorluk başlatmadan önce en az 1 sezon beklenmelidir."
]},
{title:"Teknik Direktör Olma Sistemi",icon:"♟",short:"Gerçek hayattaki teknik direktör adına hesap açma ve kayıt başvurusu.",intro:"MortaLeague'de teknik direktör olmak için önce gerçek hayattaki bir teknik direktör adına hesap açılmalıdır.",purpose:"Teknik direktörlük başvurusunun hangi adımlarla yapılacağını açıklar.",items:[
"Gerçek hayattaki teknik direktör adına bir hesap açın.",
"Kayıt hesabına “Kayıt Olmak İstiyorum” mesajını gönderin.",
"Teknik direktörlerin başlangıç değeri 1.000.000€ olur.",
"Teknik direktör değeri alınan sonuçlara ve kazanılan kupalara göre artar.",
"Galibiyet, beraberlik, mağlubiyet ve kupa sayıları biyografiye eklenmeli ve düzenli olarak güncellenmelidir."
],note:"Teknik direktör olma ve kayıt talebi adımları gönderdiğin kurala göre listelenmiştir."},
{title:"Teknik Direktör Değerleri",icon:"◈",short:"Teknik direktörlerin maç ve kupa başarılarına göre değer katkıları.",intro:"Teknik direktörler maç sonuçlarına, kupalara ve finallerdeki başarılarına göre değer kazanır. Başlangıç değeri 1.000.000€'dur.",purpose:"Yerel lig ve kupalar ile Avrupa ve millî turnuvalar için belirtilmiş teknik direktör değerlerini gösterir.",items:[
"ML A: galibiyet 40K€; beraberlik 20K€; kupa 2.000.000€; finalist 1.000.000€.",
"ZMK: galibiyet 30K€; beraberlik 20K€; kupa 1.500.000€; finalist 750.000€.",
"FA Cup: galibiyet 20K€; beraberlik 10K€; kupa 1.000.000€; finalist 500.000€.",
"GOAT Cup: galibiyet 10K€; beraberlik 5K€; kupa 500.000€; finalist 250.000€.",
"ML Süper Kupa: galibiyet 10K€; beraberlik 5K€; kupa 250.000€; finalist 100.000€.",
"UCL: galibiyet 70K€; beraberlik 35K€; kupa 5.000.000€; final 2.500.000€.",
"UEL: galibiyet 60K€; beraberlik 30K€; kupa 4.000.000€; final 2.000.000€.",
"UECL: galibiyet 50K€; beraberlik 25K€; kupa 3.000.000€; final 1.500.000€.",
"UEFA Süper Kupa: G 40K€; B 20K€; kupa 3.000.000€; finalist 1.500.000€.",
"Dünya Kupası: G 50K€; B 30K€; kupa 5.000.000€; finalist 2.500.000€.",
"Euro: G 40K€; B 20K€; kupa 4.000.000€; finalist 2.000.000€.",
"Uluslar Ligi: G 30K€; B 10K€; kupa 2.500.000€; finalist 1.000.000€."
],note:"G ve B kısaltmaları, gönderilen tabloda galibiyet ve beraberlik değerleri için kullanılmıştır."},
{title:"Maaş Sistemi",icon:"₺",short:"Maaş alt sınırı, bonuslar, sezon sonu ödemeleri ve otomatik maaş güncellemesi.",intro:"Bir futbolcunun maaşı minimum kendi değeri kadar olabilir; maksimum maaş sınırı yoktur.",purpose:"Takımların tüm oyuncularına maaş vermesini, sözleşme bonuslarını ve sezon sonu ödeme kurallarını açıklar.",items:[
"Bir oyuncunun değeri 2M€ ise en az 2M€ maaş verilmelidir. Maksimum maaş sınırı yoktur.",
"Bir takım bütün oyuncularına maaş vermek zorundadır.",
"Sözleşme yapılırken bonus maaş belirlenebilir. Örnek: Ballon d’Or kazanırsa tek seferlik 5M€ bonus.",
"Maaşlar sezon sonunda ödenir ve takım bütçesinden düşülür.",
"Oyuncular aldıkları maaşı ve toplam paralarını biyografilerine yazmak zorundadır.",
"Oyuncunun maaşını nasıl kullanabileceği diğer sistem sayfalarında açıklanır.",
"Örnek: 1M€ sezonluk maaş üzerinden 3 yıllık sözleşmede oyuncunun değeri ikinci sezonda 2M€ olursa maaşı otomatik olarak 2M€ olur."
],note:"Maaş alt sınırı oyuncunun güncel değerine bağlıdır; örnek sözleşmede maaşın ikinci sezonda otomatik güncellendiği belirtilmiştir."},
{title:"UCL / UEL / UECL Gelir Sistemi",icon:"⌁",short:"Avrupa kupalarında maç, lig aşaması, tur ve şampiyonluk primleri.",intro:"Avrupa kupalarında elde edilen sonuçlar ve turnuva aşamaları aşağıdaki primlerle ödüllendirilir.",purpose:"Şampiyonlar Ligi, UEFA Avrupa Ligi ve UEFA Konferans Ligi gelir primlerini ayrı ayrı listeler.",items:[
"Şampiyonlar Ligi: galibiyet 10M€; beraberlik 5M€; lig etabına giriş 50M€; ilk 24'e kalma 30M€; son 16 40M€; çeyrek final 50M€; yarı final 60M€; final 70M€; şampiyonluk 200M€.",
"UEFA Avrupa Ligi: galibiyet 8M€; beraberlik 4M€; lig etabına giriş 40M€; ilk 24'e kalma 20M€; son 16 30M€; çeyrek final 40M€; yarı final 50M€; final 60M€; şampiyonluk 150M€.",
"UEFA Konferans Ligi: galibiyet 6M€; beraberlik 3M€; lig etabına giriş 30M€; ilk 24'e kalma 10M€; son 16 20M€; çeyrek final 30M€; yarı final 40M€; final 50M€; şampiyonluk 120M€."
],note:"Primler gönderilen Avrupa Kupaları Primleri metnine göre gösterilmiştir."},
{title:"Stadyum Sistemi",icon:"▤",short:"Zorunlu stadyum sahipliği ve seviyeye göre takım gücü katkısı.",intro:"Stadyum sahibi olmak takım değerine güç katkısı sağlar. Her takımın stadyumunun olması zorunludur.",purpose:"Beş stadyum seviyesinin satın alma maliyetini ve takım gücüne eklediği miktarı listeler.",items:[
"1. Seviye: 100.000.000€; +2 güç.",
"2. Seviye: 250.000.000€; +4 güç.",
"3. Seviye: 500.000.000€; +6 güç.",
"4. Seviye: 750.000.000€; +8 güç.",
"5. Seviye: 1.000.000.000€; +10 güç.",
"Her takımın stadyum sahibi olması zorunludur."
],note:"Fiyatlar ve güç katkıları gönderilen stadyum sistemi metnine göre gösterilmiştir."},
{title:"Katkı Sınırı Sistemi",icon:"⊙",short:"Mevkilere göre maç başına gol/asist sınırları.",intro:"MortaLeague katkı sistemi, mevkiye ve maç sayısına göre gol/asist (G/A) sınırları uygular.",purpose:"Forvet, orta saha, defans ve kaleci katkı limitlerini aynı yerde gösterir.",items:[
"Forvet: maç başına en fazla 3 G/A; 15 maçta bir en fazla 4 G/A.",
"Orta saha: maç başına en fazla 2 G/A; 15 maçta bir en fazla 3 G/A.",
"Defans: maç başına en fazla 1 G/A; 15 maçta bir en fazla 2 G/A.",
"Kaleci: 10 maçta en fazla 1 asist alabilir; 50 maçta bir 1 gol alabilir."
],note:"G/A, gol ve asist anlamında kullanılmıştır. Kaleci için verilen sınırlar gönderilen metindeki gibi ayrı tutulmuştur."},
{title:"Yaş Sistemi",icon:"◷",short:"Oyuncu yaş kategorileri ve sezon sonundaki değer artış/azalışları.",intro:"Oyuncular yaşlarına ve yaşlarına göre gösterdikleri gol, asist ve Gym performansına göre değer kazanır veya kaybeder. Yaş kaynaklı değer değişiklikleri sezon sonunda uygulanır.",purpose:"Yaş kategorilerini ve her yaş için belirtilen değer değişimini listeler.",items:[
"Yaş kategorileri: 16–20 Genç Yetenek; 20–24 Gelişen Yetenek; 24–28 Zirve Dönemi; 28–33 Deneyimli Oyuncu; 33–40 Veteran Oyuncu.",
"Genç Yetenek: 17 yaş +500K€; 18 yaş +450K€; 19 yaş +400K€.",
"Gelişen Yetenek: 20 yaş +350K€; 21 yaş +300K€; 22 yaş +250K€; 23 yaş +200K€.",
"Zirve Dönemi: 24 yaş +150K€; 25 yaş +100K€; 26 yaş +50K€; 27 yaş nötr.",
"Deneyimli Oyuncu: 29 yaş nötr; 30 yaş nötr; 31 yaş −250K€; 32 yaş −500K€.",
"Veteran Oyuncu: 33 yaş −2.5M€; 34 yaş −3M€; 35 yaş −3.5M€; 36 yaş −4M€; 37 yaş −5M€; 38 yaş −6M€; 39 yaş −8M€; 40 yaş −10M€.",
"Yaş değişimleri sezon sonunda oyuncu değerine eklenir veya düşülür."
],note:"Yaş kategorileri ve değerler gönderilen metne göre korunmuştur. 16 ve 28 yaş için ayrıca bir değer değişimi belirtilmemiştir."},
{title:"Antrenman Sahası Sistemi",icon:"⌁",short:"Antrenman sahası satın alma maliyetleri ve günlük oyuncu değer katkıları.",intro:"Takımlar belirli maliyetlerle antrenman sahası satın alabilir. Saha seviyesi yükseldikçe oyuncu değerine sağlanan antrenman katkısı artar.",purpose:"Saha seviyelerinin maliyetlerini, oyuncu değer katkılarını ve günlük antrenman kurallarını gösterir.",items:[
"1. Seviye Antrenman Sahası: 100.000.000€; oyuncu değerine +75K€.",
"2. Seviye Antrenman Sahası: 250.000.000€; oyuncu değerine +100K€.",
"3. Seviye Antrenman Sahası: 500.000.000€; oyuncu değerine +125K€.",
"4. Seviye Antrenman Sahası: 750.000.000€; oyuncu değerine +150K€.",
"5. Seviye Antrenman Sahası: 1.000.000.000€; oyuncu değerine +200K€.",
"Antrenmanlar günlük olarak yapılır ve en fazla 5 oyuncuya antrenman uygulanabilir.",
"Antrenman sahası olmadan yapılan antrenman oyuncu değerine +50K€ etki eder.",
"Antrenmanları gönderi (post) olarak paylaşmak zorunludur."
],note:"Antrenman maliyetleri, katkıları ve paylaşım zorunluluğu gönderilen metne göre gösterilmiştir."}
];
const systemGrid=document.getElementById("systems-grid");
function renderSystems(query=""){
  const q=String(query||"").trim().toLocaleLowerCase("tr-TR");
  const visible=systems.map((s,i)=>({...s,index:i})).filter(s=>!q||`${s.title} ${s.short} ${s.items.join(" ")}`.toLocaleLowerCase("tr-TR").includes(q));
  systemGrid.innerHTML=visible.map(s=>`<article class="system-card"><span class="system-number">${String(s.index+1).padStart(2,"0")}</span><span class="system-glyph">${s.icon}</span><h3>${s.title}</h3><p>${s.short}</p><button class="system-detail-button" type="button" data-system-detail="${s.index}">Detayları Gör <span>↗</span></button></article>`).join("");
  const counter=document.getElementById("systems-results");
  if(counter)counter.textContent=`${visible.length} / ${systems.length} sistem`;
  if(!visible.length)systemGrid.innerHTML='<div class="empty-state">Bu aramayla eşleşen bir sistem bulunamadı.</div>';
}
renderSystems();
document.getElementById("system-search")?.addEventListener("input",e=>renderSystems(e.target.value));
const systemBackdrop=document.getElementById("system-detail-backdrop");
const systemClose=document.getElementById("system-detail-close");
let systemPreviousFocus=null;
function openSystemDetail(index){
  const s=systems[index];
  if(!s)return;
  systemPreviousFocus=document.activeElement;
  document.getElementById("system-detail-number").textContent=String(index+1).padStart(2,"0");
  document.getElementById("system-detail-title").textContent=s.title;
  document.getElementById("system-detail-intro").textContent=s.intro;
  document.getElementById("system-detail-purpose").textContent=s.purpose;
  document.getElementById("system-detail-list").innerHTML=s.items.map(item=>`<li>${item}</li>`).join("");
  document.getElementById("system-detail-note").textContent=s.note;
  systemBackdrop.hidden=false;
  document.body.style.overflow="hidden";
  systemClose.focus();
}
function closeSystemDetail(){
  systemBackdrop.hidden=true;
  document.body.style.overflow="";
  if(systemPreviousFocus && typeof systemPreviousFocus.focus==="function")systemPreviousFocus.focus();
}
systemGrid.addEventListener("click",e=>{const btn=e.target.closest("[data-system-detail]");if(btn)openSystemDetail(Number(btn.dataset.systemDetail));});
systemClose.addEventListener("click",closeSystemDetail);
systemBackdrop.addEventListener("click",e=>{if(e.target===systemBackdrop)closeSystemDetail();});
document.addEventListener("keydown",e=>{if(e.key==="Escape" && !systemBackdrop.hidden)closeSystemDetail();});
const validPages=["home","systems","players","community","messages","admin"];
let cachedPlayers=[];
let cachedAdminPlayers=[];
let cachedAnnouncements=[];
const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const initials=value=>String(value||"ML").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"ML";
// Broken third-party avatar URLs should fall back to initials instead of showing
// the browser's broken-image icon and wrapped alt text.
document.addEventListener("error",event=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement)||! /profil fotoğrafı$/i.test(img.alt||""))return;
  const wrapper=img.parentElement;
  if(!wrapper||wrapper.dataset.avatarFallbackDone==="true")return;
  wrapper.dataset.avatarFallbackDone="true";
  wrapper.textContent=initials((img.alt||"").replace(/\s+profil fotoğrafı$/i,""));
  wrapper.classList.add("avatar-fallback");
},true);
const avatarMarkup=(url,name,extra="")=>{
  const safe=String(url||"").trim();
  return safe && /^https:\/\//i.test(safe)
    ? `<span class="${extra||"player-card-avatar"}"><img src="${esc(safe)}" alt="${esc(name||"Oyuncu")} profil fotoğrafı" loading="lazy" referrerpolicy="no-referrer" ></span>`
    : `<span class="${extra||"player-card-avatar"}">${esc(initials(name))}</span>`;
};
function formatDate(value){if(!value)return "Tarih belirtilmemiş";const d=new Date(value);return Number.isNaN(d.getTime())?"Tarih belirtilmemiş":new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"long",year:"numeric"}).format(d);}
function setInlineStatus(id,message,type=""){const node=document.getElementById(id);if(!node)return;node.textContent=message||"";node.className="inline-status"+(type?` ${type}`:"");}
function setMessage(id,message,type=""){const node=document.getElementById(id);if(!node)return;node.textContent=message||"";node.className="auth-feedback"+(type?` ${type}`:"");}
function showPage(name){
  if(!validPages.includes(name))return;
  if((name==="messages"||name==="community")&&!window.MortaLeague?.session?.user){
    window.MortaLeague?.openAuth();
    return;
  }
  if(name==="admin"&&!(window.MortaLeague?.isAdmin())){
    const note=document.getElementById("admin-access-note");
    if(note){note.textContent="Bu alan yalnızca yönetici yetkisi verilmiş hesaplara açıktır. Önce giriş yap; ilk yöneticiyi SQL dosyasındaki adımla tanımlayabilirsin.";note.className="admin-access-note error";}
    window.MortaLeague?.openAuth();
    return;
  }
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));
  document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  if(name==="players")loadPlayers();
  if(name==="messages")window.dispatchEvent(new CustomEvent("ml:messages-open"));
  if(name==="admin")loadAdminDashboard();
  if(name==="home")loadAnnouncements();
  if(document.getElementById("auth-backdrop")&&!document.getElementById("auth-backdrop").hidden)window.MortaLeague?.closeAuth();
  window.dispatchEvent(new CustomEvent("ml:page-change",{detail:{page:name}}));
  window.scrollTo({top:0,behavior:"smooth"});
}
let currentPublicProfile=null;
window.MortaUI={showPage,loadPlayers,loadAdminDashboard,loadAnnouncements,get currentPublicProfile(){return currentPublicProfile;}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b){e.preventDefault();showPage(b.dataset.page);}});

async function loadPlayers(){
  const grid=document.getElementById("players-grid");if(!grid)return;
  if(!window.MortaLeague?.client){setInlineStatus("players-status","Oyuncu profilleri için Supabase bağlantısı kurulamadı.","error");return;}
  setInlineStatus("players-status","Oyuncu profilleri yükleniyor…");
  try{
    const rows=await window.MortaLeague.listProfiles();
    cachedPlayers=Array.isArray(rows)?rows:[];
    renderPlayers();
  }catch(error){grid.innerHTML="";setInlineStatus("players-status",error?.message||"Oyuncu profilleri yüklenemedi. SQL kurulumunu kontrol et.","error");}
}
function renderPlayers(){
  const grid=document.getElementById("players-grid");if(!grid)return;
  const q=(document.getElementById("players-search")?.value||"").trim().toLocaleLowerCase("tr-TR");
  const rows=cachedPlayers.filter(p=>`${p.username||""} ${p.display_name||""} ${p.bio||""}`.toLocaleLowerCase("tr-TR").includes(q));
  const viewerId=window.MortaLeague?.session?.user?.id;
  grid.innerHTML=rows.map(p=>`<article class="player-card"><span class="player-card-avatar">${p.avatar_url&&/^https:\/\//i.test(p.avatar_url)?`<img src="${esc(p.avatar_url)}" alt="${esc(p.display_name||p.username)} profil fotoğrafı" loading="lazy" referrerpolicy="no-referrer">`:esc(initials(p.display_name||p.username))}</span><div class="player-card-main"><h3>${esc(p.display_name||p.username)}</h3><p class="player-handle">@${esc(p.username)}</p><p class="player-bio">${esc(p.bio||"Bu oyuncu henüz biyografi eklememiş.")}</p><div class="player-card-actions"><button class="player-open" type="button" data-player-profile="${esc(p.username)}">Profili görüntüle ↗</button>${viewerId&&p.id&&p.id!==viewerId?`<button class="player-message-button" type="button" data-message-user="${esc(p.id)}">Mesaj gönder</button>`:""}</div></div></article>`).join("");
  setInlineStatus("players-status",rows.length?`${rows.length} oyuncu profili gösteriliyor.`:(q?"Aramana uygun oyuncu bulunamadı.":"Henüz herkese açık oyuncu profili yok. İlk profil seninki olabilir."));
}
document.getElementById("players-search")?.addEventListener("input",renderPlayers);
document.getElementById("players-refresh")?.addEventListener("click",loadPlayers);
document.getElementById("players-grid")?.addEventListener("click",e=>{const b=e.target.closest("[data-player-profile]");if(!b)return;const player=cachedPlayers.find(p=>p.username===b.dataset.playerProfile);if(player)openPublicProfile(player);});
function openPublicProfile(player){
  const modal=document.getElementById("public-profile-backdrop");if(!modal)return;
  const name=player.display_name||player.username||"Oyuncu";
  const avatar=document.getElementById("public-profile-avatar");
  avatar.innerHTML=player.avatar_url&&/^https:\/\//i.test(player.avatar_url)?`<img src="${esc(player.avatar_url)}" alt="${esc(name)} profil fotoğrafı" referrerpolicy="no-referrer">`:esc(initials(name));
  document.getElementById("public-profile-name").textContent=name;
  document.getElementById("public-profile-username").textContent="@"+(player.username||"oyuncu");
  document.getElementById("public-profile-bio").textContent=player.bio||"Bu oyuncu henüz biyografi eklememiş.";
  document.getElementById("public-profile-created").textContent=formatDate(player.created_at);
  currentPublicProfile=player;
  const messageButton=document.getElementById("public-profile-message");
  if(messageButton){const viewerId=window.MortaLeague?.session?.user?.id;messageButton.hidden=!(viewerId&&player.id&&player.id!==viewerId);}
  modal.hidden=false;document.body.style.overflow="hidden";document.getElementById("public-profile-close")?.focus();
}
function closePublicProfile(){const modal=document.getElementById("public-profile-backdrop");if(modal)modal.hidden=true;document.body.style.overflow="";currentPublicProfile=null;}
document.getElementById("public-profile-close")?.addEventListener("click",closePublicProfile);
document.getElementById("public-profile-backdrop")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closePublicProfile();});

async function loadAnnouncements(){
  const host=document.getElementById("home-announcements-list");if(!host)return;
  if(!window.MortaLeague?.client){host.innerHTML='<div class="empty-state">Duyurular bağlantı kurulduktan sonra burada görünecek.</div>';return;}
  try{cachedAnnouncements=await window.MortaLeague.listAnnouncements();renderAnnouncements(host,cachedAnnouncements.slice(0,3),false);}
  catch(error){host.innerHTML=`<div class="empty-state">${esc(error?.message||"Duyurular yüklenemedi.")}</div>`;}
}
function renderAnnouncements(host,rows,admin=false){
  if(!host)return;
  if(!rows?.length){host.innerHTML='<div class="empty-state">Henüz yayınlanmış bir duyuru yok.</div>';return;}
  host.innerHTML=rows.map(a=>`<article class="announcement-card"><h3>${esc(a.title)}</h3><p>${esc(a.content)}</p><div class="announcement-meta"><span>${esc(formatDate(a.created_at))}</span>${admin?`<button class="btn btn-secondary" type="button" data-delete-announcement="${esc(a.id)}">Duyuruyu kaldır</button>`:"<span>MORTALEAGUE</span>"}</div></article>`).join("");
}

async function loadAdminDashboard(){
  const content=document.getElementById("admin-content"),note=document.getElementById("admin-access-note");
  if(!window.MortaLeague?.isAdmin()){
    if(content)content.hidden=true;
    if(note){note.textContent="Yönetici erişimi yok. Yönetici hesabı veritabanında yetkilendirilmelidir.";note.className="admin-access-note error";}
    return;
  }
  if(note){note.textContent="Yönetici yetkisi doğrulandı. Değişiklikler veritabanındaki erişim kurallarıyla korunur.";note.className="admin-access-note success";}
  if(content)content.hidden=false;
  setInlineStatus("admin-users-status","Üyeler yükleniyor…");
  try{
    const [users,announcements]=await Promise.all([window.MortaLeague.listAdminProfiles(),window.MortaLeague.listAnnouncements()]);
    cachedAdminPlayers=users||[];cachedAnnouncements=announcements||[];
    document.getElementById("admin-player-count").textContent=String(cachedAdminPlayers.length);
    document.getElementById("admin-announcement-count").textContent=String(cachedAnnouncements.length);
    renderAdminPlayers();
    renderAnnouncements(document.getElementById("admin-announcements"),cachedAnnouncements,true);
    setInlineStatus("admin-users-status",`${cachedAdminPlayers.length} üye listelendi.`);
  }catch(error){setInlineStatus("admin-users-status",error?.message||"Yönetim verileri alınamadı. SQL ve yönetici rolünü kontrol et.","error");}
}
function renderAdminPlayers(){
  const host=document.getElementById("admin-users-list");if(!host)return;
  const q=(document.getElementById("admin-users-search")?.value||"").trim().toLocaleLowerCase("tr-TR");
  const rows=cachedAdminPlayers.filter(p=>`${p.username||""} ${p.display_name||""} ${p.bio||""}`.toLocaleLowerCase("tr-TR").includes(q));
  host.innerHTML=rows.map(p=>`<article class="admin-user-card"><div class="admin-user-main">${avatarMarkup(p.avatar_url,p.display_name||p.username)}<div><strong>${esc(p.display_name||p.username)}</strong><small>@${esc(p.username)} · Katılım: ${esc(formatDate(p.created_at))}</small>${p.role==="admin"?'<span class="admin-badge">YÖNETİCİ</span>':p.is_suspended?'<span class="social-suspended-badge">ASKIYA ALINDI</span>':""}</div></div><div class="admin-user-actions"><button class="btn btn-secondary" type="button" data-admin-edit-profile="${esc(p.id)}">Profili düzenle</button>${p.role!=="admin"?`<button class="btn ${p.is_suspended?"btn-outline":"btn-secondary"}" type="button" data-admin-toggle-suspension="${esc(p.id)}" data-next-suspended="${p.is_suspended?"false":"true"}">${p.is_suspended?"Askıyı kaldır":"Hesabı askıya al"}</button>`:""}</div></article>`).join("");
  if(!rows.length)host.innerHTML='<div class="empty-state">Eşleşen üye bulunamadı.</div>';
}
document.getElementById("admin-users-search")?.addEventListener("input",renderAdminPlayers);
document.getElementById("admin-refresh")?.addEventListener("click",loadAdminDashboard);
document.getElementById("admin-users-list")?.addEventListener("click",async e=>{
  const suspendButton=e.target.closest("[data-admin-toggle-suspension]");
  if(suspendButton){
    if(!window.MortaLeague?.isAdmin())return;
    const targetId=suspendButton.dataset.adminToggleSuspension;
    const shouldSuspend=suspendButton.dataset.nextSuspended==="true";
    const confirmed=window.confirm(shouldSuspend?"Bu hesabı askıya almak istiyor musun? Kullanıcı gönderi, yorum, beğeni, takip ve mesaj işlemi yapamaz.":"Bu hesabın kısıtlamasını kaldırmak istiyor musun?");
    if(!confirmed)return;
    suspendButton.disabled=true;
    try{const {error}=await window.MortaLeague.client.rpc("admin_set_profile_suspension",{target_profile_id:targetId,should_suspend:shouldSuspend});if(error)throw error;await loadAdminDashboard();}
    catch(error){setInlineStatus("admin-users-status",error?.message||"Hesap durumu değiştirilemedi.","error");suspendButton.disabled=false;}
    return;
  }
  const b=e.target.closest("[data-admin-edit-profile]");if(!b)return;
  if(!window.MortaLeague?.isAdmin())return;
  const p=cachedAdminPlayers.find(x=>x.id===b.dataset.adminEditProfile);if(!p)return;
  document.getElementById("admin-edit-id").value=p.id;
  document.getElementById("admin-edit-title").textContent="Oyuncu profilini düzenle";
  document.getElementById("admin-edit-username").textContent="@"+p.username;
  document.getElementById("admin-edit-display-name").value=p.display_name||p.username;
  document.getElementById("admin-edit-avatar-url").value=p.avatar_url||"";
  document.getElementById("admin-edit-bio").value=p.bio||"";
  setMessage("admin-edit-feedback","");
  document.getElementById("admin-edit-backdrop").hidden=false;document.body.style.overflow="hidden";
});
function closeAdminEdit(){const m=document.getElementById("admin-edit-backdrop");if(m)m.hidden=true;document.body.style.overflow="";}
document.getElementById("admin-edit-close")?.addEventListener("click",closeAdminEdit);
document.getElementById("admin-edit-backdrop")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeAdminEdit();});
document.getElementById("admin-edit-form")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!window.MortaLeague?.isAdmin()){setMessage("admin-edit-feedback","Yönetici yetkisi gerekli.","error");return;}
  const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent="Kaydediliyor…";
  try{
    await window.MortaLeague.saveManagedProfile(document.getElementById("admin-edit-id").value,{display_name:document.getElementById("admin-edit-display-name").value.trim(),avatar_url:document.getElementById("admin-edit-avatar-url").value.trim()||null,bio:document.getElementById("admin-edit-bio").value.trim()});
    setMessage("admin-edit-feedback","Profil güncellendi.","success");
    await loadAdminDashboard();setTimeout(closeAdminEdit,500);
  }catch(error){setMessage("admin-edit-feedback",error?.message||"Profil kaydedilemedi.","error");}
  finally{btn.disabled=false;btn.textContent="Değişiklikleri Kaydet ↗";}
});
document.getElementById("announcement-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  // Resolve the form and fields synchronously. Never read event.currentTarget after await.
  const form = document.getElementById("announcement-form");
  const titleInput = document.getElementById("announcement-title");
  const contentInput = document.getElementById("announcement-content");
  const button = document.getElementById("announcement-submit");
  if (!form || !titleInput || !contentInput || !button) {
    setMessage("announcement-feedback", "Duyuru formu yüklenemedi. Sayfayı yenileyip tekrar dene.", "error");
    return;
  }
  if (!window.MortaLeague?.isAdmin()) {
    setMessage("announcement-feedback", "Yönetici yetkisi gerekli.", "error");
    return;
  }
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  if (!title || title.length > 100 || !content || content.length > 3000) {
    setMessage("announcement-feedback", "Başlık 1–100, içerik 1–3000 karakter olmalı.", "error");
    return;
  }
  button.disabled = true;
  button.textContent = "Yayınlanıyor…";
  setMessage("announcement-feedback", "", "");
  try {
    await window.MortaLeague.createAnnouncement({ title, content });
    // Avoid form.reset() entirely here: cached/older handlers produced a null reset error.
    titleInput.value = "";
    contentInput.value = "";
    setMessage("announcement-feedback", "Duyuru başarıyla yayınlandı.", "success");
    await loadAdminDashboard();
    await loadAnnouncements();
  } catch (error) {
    const raw = String(error?.message || "");
    const message = /row-level security|42501|permission denied|yetki/i.test(raw)
      ? "Duyuru yayımlanamadı. Yönetici rolünü ve Supabase izinlerini kontrol et."
      : (raw || "Duyuru yayınlanamadı. Tekrar deneyin.");
    setMessage("announcement-feedback", message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Duyuruyu Yayınla ↗";
  }
});
document.getElementById("admin-announcements")?.addEventListener("click",async e=>{
  const b=e.target.closest("[data-delete-announcement]");if(!b)return;
  if(!window.MortaLeague?.isAdmin())return;
  b.disabled=true;b.textContent="Kaldırılıyor…";
  try{await window.MortaLeague.deleteAnnouncement(b.dataset.deleteAnnouncement);await loadAdminDashboard();await loadAnnouncements();}
  catch(error){setInlineStatus("admin-users-status",error?.message||"Duyuru kaldırılamadı.","error");b.disabled=false;b.textContent="Duyuruyu kaldır";}
});
window.addEventListener("ml:ready",()=>{loadAnnouncements();});
window.addEventListener("ml:auth-state",()=>{
  const isAdmin=!!window.MortaLeague?.isAdmin();
  const adminOpen=document.getElementById("profile-admin-open");if(adminOpen)adminOpen.hidden=!isAdmin;
  if(document.getElementById("page-admin")?.classList.contains("active"))loadAdminDashboard();
  if(document.getElementById("page-players")?.classList.contains("active"))loadPlayers();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closePublicProfile();closeAdminEdit();}});

/* Ambient particle field: capped DPR and particle count for smooth everyday devices. */
(() => {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { canvas.remove(); return; }

  let width = 0, height = 0, dpr = 1, particles = [], raf = 0;
  const pointer = { x: -1000, y: -1000, active: false };
  const isSmall = () => window.innerWidth < 700;
  const rand = (min, max) => min + Math.random() * (max - min);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, isSmall() ? 1.15 : 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const amount = Math.min(isSmall() ? 18 : 68, Math.max(isSmall() ? 10 : 22, Math.floor(width * height / (isSmall() ? 30000 : 15500))));
    particles = Array.from({ length: amount }, () => ({
      x: rand(0, width), y: rand(0, height),
      r: rand(.6, 1.65), vx: rand(-.11, .11), vy: rand(-.16, -.035),
      alpha: rand(.18, .64), phase: rand(0, Math.PI * 2),
      twinkle: rand(.004, .013), hue: rand(270, 300)
    }));
  }

  let lastFrameAt = 0;
  function draw(now = 0) {
    // Mobile devices render this decorative canvas at ~30fps to reduce battery and heat.
    if (isSmall() && now - lastFrameAt < 32) { raf = window.requestAnimationFrame(draw); return; }
    lastFrameAt = now;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.phase += p.twinkle;
      if (p.y < -8) { p.y = height + 8; p.x = rand(0, width); }
      if (p.x < -8) p.x = width + 8;
      if (p.x > width + 8) p.x = -8;
      const alpha = Math.max(.05, p.alpha * (.72 + Math.sin(p.phase) * .28));
      const dx = pointer.x - p.x, dy = pointer.y - p.y;
      const near = pointer.active && dx * dx + dy * dy < 125 * 125;
      if (near) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(pointer.x, pointer.y);
        ctx.strokeStyle = `hsla(${p.hue}, 88%, 72%, ${.13 * (1 - Math.sqrt(dx*dx+dy*dy)/125)})`;
        ctx.lineWidth = .65; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 85%, 77%, ${alpha})`; ctx.fill();
      if (p.r > 1.2) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${alpha * .055})`; ctx.fill();
      }
    }
    raf = window.requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
    document.body.classList.add('has-pointer');
    const aura = document.querySelector('.pointer-aura');
    if (aura) aura.style.transform = `translate(${pointer.x}px,${pointer.y}px) translate(-50%,-50%)`;
    const art = document.querySelector('.hero-art');
    if (art && window.innerWidth > 900) {
      const rect = art.getBoundingClientRect();
      const px = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const py = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      art.style.transform = `perspective(850px) rotateY(${px * 3.2}deg) rotateX(${py * -2.5}deg)`;
    }
  }, { passive: true });
  window.addEventListener('pointerleave', () => {
    pointer.active = false; document.body.classList.remove('has-pointer');
    const art = document.querySelector('.hero-art');
    if (art) art.style.transform = '';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { window.cancelAnimationFrame(raf); }
    else { window.cancelAnimationFrame(raf); raf = window.requestAnimationFrame(draw); }
  });
  resize();
  raf = window.requestAnimationFrame(draw);
})();
