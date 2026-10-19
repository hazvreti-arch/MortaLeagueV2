// MortaBot — Supabase Edge Function
// Required: OPENROUTER_API_KEY. Optional OPENROUTER_MODEL must be a free model slug (ends with :free) or openrouter/free.
// Enforce Supabase JWT verification in supabase/config.toml AND validate the user here.
// A database-backed limiter prevents a single account from consuming unlimited API budget.
const allowedOrigins = new Set([
  "https://mortaleaguev2.vercel.app",
  "https://mortaleague.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
]);
function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsFor(req) });
}
function env(name: string): string { return (Deno.env.get(name) || "").trim(); }
async function getAuthenticatedUserId(req: Request, supabaseUrl: string, anonKey: string): Promise<string | null> {
  const authorization = req.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+/i.test(authorization)) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return typeof user?.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)
    ? user.id : null;
}
async function allowRequest(supabaseUrl: string, serviceRoleKey: string, userId: string): Promise<boolean | null> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/mortabot_allow_request`, {
    method: "POST",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_user_id: userId, p_minute_limit: 12, p_daily_limit: 100 }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    console.error("MortaBot rate-limit RPC failed", response.status);
    return null;
  }
  return await response.json().catch(() => null) === true;
}

const rules = `MORTALEAGUE — OTORİTE KURAL KİTABI
Dil ve üslup: Kullanıcı Türkçe konuşuyorsa samimi, doğal, sıcak Türkçe kullan; kanka/kral gibi hitapları ölçülü kullan. Bot olduğunu saklama ama robotik konuşma. İstenen hesapları adım adım açıkla.
Kesinlik: Yalnızca aşağıdaki kuralları kullan. Bir tutar, oran veya kural listede yoksa uydurma; açıkça belirtilmediğini söyle, gerekirse tek bir net soru sor. Aynı isimli değerleri karıştırma. Oyuncu katkı toplamı, mevcut piyasa değeriyle aynı şey değildir; kullanıcı yalnızca katkı istiyorsa bunu netleştir.

OYUNCU KATKI DEĞERLERİ (her bir gol, asist, gym ve kazanılan kupa için):
MortaLeague A / MIA: gol 40.000€, asist 30.000€, gym 40.000€, kupa 2.000.000€.
ZMK: gol 30.000€, asist 20.000€, gym 30.000€, kupa 1.500.000€.
FA Cup: gol 20.000€, asist 10.000€, gym 20.000€, kupa 1.000.000€.
GOAT Cup: gol 10.000€, asist 5.000€, gym 10.000€, kupa 500.000€.
ML Süper Kupa: gol 10.000€, asist 5.000€, gym 10.000€, kupa 250.000€.
UEFA Şampiyonlar Ligi (UCL): gol 70.000€, asist 60.000€, gym 70.000€, kupa 5.000.000€.
UEFA Avrupa Ligi (UEL): gol 60.000€, asist 50.000€, gym 60.000€, kupa 4.000.000€.
UEFA Konferans Ligi (UECL): gol 50.000€, asist 40.000€, gym 50.000€, kupa 3.000.000€.
UEFA Süper Kupa: gol 50.000€, asist 40.000€, gym 50.000€, kupa 3.000.000€.
Dünya Kupası: gol 70.000€, asist 60.000€, gym 70.000€, kupa 5.000.000€.
Avrupa Şampiyonası / EURO: gol 60.000€, asist 50.000€, gym 60.000€, kupa 4.000.000€.
Uluslar Ligi: gol 40.000€, asist 30.000€, gym 40.000€, kupa 2.500.000€.
Oyuncu katkı formülü: gol×gol değeri + asist×asist değeri + gym×gym değeri + kupa×kupa değeri.
Yerel kupa katılım şartları: ZMK'ya tüm lig takımları katılır. MIA kazananı ve ZMK kazananı FA Cup'a katılamaz. MIA, ZMK ve FA Cup kazananları GOAT Cup'a katılamaz. MIA, ZMK, FA Cup ve GOAT Cup kazananları kendi aralarında Süper Kupa oynar.

MAÇ BAŞINA KATKI SINIRLARI:
Forvet: maç başına en fazla 3 gol/asist; 15 maçta bir kez en fazla 4 gol/asist.
Orta saha: maç başına en fazla 2 gol/asist; 15 maçta bir kez en fazla 3 gol/asist.
Defans: maç başına en fazla 1 gol/asist; 15 maçta bir kez en fazla 2 gol/asist.
Kaleci: 10 maçta en fazla 1 asist; 50 maçta bir 1 gol.

LİG GELİRLERİ VE YEREL KUPA ÖDÜLLERİ:
Lig sıralama geliri: 1. 100M€, 2. 75M€, 3–5. 50M€, 6–10. 30M€, 11–15. 25M€, 16–20. 10M€.
MortaLeague A maç geliri: galibiyet 4M€, beraberlik 2M€. Yerel kupa maç geliri: galibiyet 2M€, beraberlik 1M€.
ZMK şampiyon 70M€, finalist 35M€; FA Cup şampiyon 50M€, finalist 25M€; GOAT Cup şampiyon 40M€, finalist 20M€; Süper Kupa şampiyon 20M€, finalist 10M€.

AVRUPA KUPALARI ÖDÜLLERİ (galibiyet / beraberlik / lig aşamasına giriş / ilk 24 / son 16 / çeyrek final / yarı final / final / şampiyon):
UCL: 10M€ / 5M€ / 50M€ / 30M€ / 40M€ / 50M€ / 60M€ / 70M€ / 200M€.
UEL: 8M€ / 4M€ / 40M€ / 20M€ / 30M€ / 40M€ / 50M€ / 60M€ / 150M€.
UECL: 6M€ / 3M€ / 30M€ / 10M€ / 20M€ / 30M€ / 40M€ / 50M€ / 120M€.

TEKNİK DİREKTÖR SİSTEMİ:
Kullanıcı gerçek hayattaki teknik direktör adına hesap açar ve kayıt hesabına “Kayıt Olmak İstiyorum” mesajını gönderir. Başlangıç değeri 1M€; sonuç ve kupalara göre artar. Galibiyet/beraberlik/kupa/finalist veya final tutarları:
MortaLeague A: 40K€/20K€/2M€/1M€; ZMK: 30K€/20K€/1.5M€/750K€; FA Cup: 20K€/10K€/1M€/500K€; GOAT Cup: 10K€/5K€/500K€/250K€; ML Süper Kupa: 10K€/5K€/250K€/100K€.
UCL: 70K€/35K€/5M€/2.5M€; UEL: 60K€/30K€/4M€/2M€; UECL: 50K€/25K€/3M€/1.5M€; UEFA Süper Kupa: 40K€/20K€/3M€/1.5M€; Dünya Kupası: 50K€/30K€/5M€/2.5M€; EURO: 40K€/20K€/4M€/2M€; Uluslar Ligi: 30K€/10K€/2.5M€/1M€. Teknik direktörler galibiyet, beraberlik, mağlubiyet ve kupalarını biyografilerinde güncel tutar.

MAAŞ SİSTEMİ:
Yıllık en düşük maaş oyuncunun güncel değerine eşit olmalı; üst sınır yok. Takım tüm oyuncularına maaş öder. Sözleşmeye Ballon d'Or bonusu gibi tek seferlik ek bonus eklenebilir. Maaşlar sezon sonunda ödenir ve takım bütçesinden düşer. Oyuncular maaşını ve toplam parasını biyografide belirtir. Örnek: üç yıllık sözleşme 1M€/yıl iken oyuncu değeri ikinci sezonda 2M€ olursa yıllık maaş otomatik 2M€ olur.

SPONSORLUK SİSTEMİ:
Herkes sponsor hesabı açabilir; sponsor hesabı çar sınırına dahil değildir. Kategoriler: sırt, göğüs, stadyum. Her kategori başlangıç bütçesi 500M€; her sezon sonunda +100M€. Sırt en fazla 8 takımla, göğüs en fazla 6, stadyum en fazla 4 takımla anlaşabilir. Takımın en fazla 3 sponsoru olur (göğüs/sırt/stadyum); takımlar yalnızca imza bonusu ve kupa bonusu alır. Sözleşmeler en az 2 yıllık, erken fesih yoktur. Sponsorluğu kapattıktan sonra yeni sözleşme için en az bir sezon beklenir.
Göğüs sponsoru maksimum imza bonusu 20M€; MLA şampiyonu 25M€, ZMK 20M€, FA Cup 15M€, GOAT Cup 10M€, Süper Kupa 5M€.
Sırt sponsoru maksimum imza bonusu 15M€; MLA şampiyonu 15M€, ZMK 10M€, FA Cup 7M€, GOAT Cup 5M€, Süper Kupa 3M€.
Stadyum sponsoru maksimum imza bonusu 30M€; MLA şampiyonu 30M€, ZMK 25M€, FA Cup 20M€, GOAT Cup 15M€, Süper Kupa 10M€.

OYUNCU ALIMLARI VE EKONOMİ:
Telefon: Oppo fiyat 3M€, değere +250K€; Mi fiyat 5M€, +500K€; Samsung 15M€, +750K€; iPhone 20M€, +1M€.
Ev: daire 10M€, +500K€; dubleks 25M€, +1.5M€; villa 50M€, +2M€; malikâne 100M€, +3M€; lüks malikâne 150M€, +3.5M€.
Araç: motosiklet 5M€, +250K€; SUV 10M€, +500K€; spor araba 20M€, +1M€; yat 40M€, +2M€; özel jet 100M€, +3M€.
Ödüller: Ballon D’or 2.5M€; Golden Boy 1.5M€; Golden Boot 1M€; Best Teknik Direktör 1M€; Best Mevki 1M€; Best 11 500K€.
Stadyum zorunludur: seviye 1 100M€ / +2 güç; seviye 2 250M€ / +4; seviye 3 500M€ / +6; seviye 4 750M€ / +8; seviye 5 1B€ / +10.
Antrenman sahası: seviye 1 100M€ / oyuncu değer etkisi 75K€; seviye 2 250M€ / 100K€; seviye 3 500M€ / 125K€; seviye 4 750M€ / 150K€; seviye 5 1B€ / 200K€. Antrenman günlük, en fazla 5 oyuncu. Antrenman sahası olmadan antrenman 50K€ değer katkısı verir. Antrenman gönderileri paylaşılmalıdır.
YAŞ DEĞERİ (sezon sonunda uygulanır): 17 +500K€, 18 +450K€, 19 +400K€, 20 +350K€, 21 +300K€, 22 +250K€, 23 +200K€, 24 +150K€, 25 +100K€, 26 +50K€, 27 nötr, 29 nötr, 30 nötr, 31 −250K€, 32 −500K€, 33 −2.5M€, 34 −3M€, 35 −3.5M€, 36 −4M€, 37 −5M€, 38 −6M€, 39 −8M€, 40 −10M€. 16 ve 28 için değer değişimi belirtilmemiştir; kategori yaş aralıkları kaynakta çakışır, bu yüzden belirsizliği saklama.

KULLANICI İLE SOHBET:
- Kullanıcı “değerimi hesapla” derse turnuvayı, golü, asisti, gym'i ve kupa sayısını konuşma içinde toplamaya yardım et. Her şeyi bir kerede form gibi isteme; eksikleri birer birer ya da kısa doğal bir soruyla sor.
- Tam sayılar ve turnuva biliniyorsa toplamı kesin hesapla. Hesaplama aşağıdaki araçtan / doğrulanmış hesaplama bağlamından verilmişse sonucu aynen kullan; kendin tutarsız bir toplam üretme.
- Kullanıcı bilgisi yoksa kendi hesabındaki istatistikleri gördüğünü iddia etme. Kullanıcının verdiği verilerle hesapla; oyuncu profili verilerine erişimin yoksa açıkça söyle.
- “gerçek insan gibi” doğal sohbet et fakat insan olduğunu iddia etme. Gereksiz uzun açıklama yapma; hesaplamada kırılımı da ver.
- Lig dışı genel sohbete de cevap verebilirsin ama MortaLeague kurallarını güncel ve kesin bilgi kaynağı olarak önceliklendir.
`;

const rates = {
 MIA:{name:"MortaLeague A",goal:40000,assist:30000,gym:40000,cup:2000000,aliases:["mia","mortaleague a","mla"]},
 ZMK:{name:"ZMK",goal:30000,assist:20000,gym:30000,cup:1500000,aliases:["zmk"]},
 FA:{name:"FA Cup",goal:20000,assist:10000,gym:20000,cup:1000000,aliases:["fa cup","facup"]},
 GOAT:{name:"GOAT Cup",goal:10000,assist:5000,gym:10000,cup:500000,aliases:["goat cup"]},
 SUPER:{name:"ML Süper Kupa",goal:10000,assist:5000,gym:10000,cup:250000,aliases:["ml süper kupa","morta süper kupa","süper kupa"]},
 UCL:{name:"UEFA Şampiyonlar Ligi",goal:70000,assist:60000,gym:70000,cup:5000000,aliases:["ucl","şampiyonlar ligi","champions league"]},
 UEL:{name:"UEFA Avrupa Ligi",goal:60000,assist:50000,gym:60000,cup:4000000,aliases:["uel","avrupa ligi"]},
 UECL:{name:"UEFA Konferans Ligi",goal:50000,assist:40000,gym:50000,cup:3000000,aliases:["uecl","konferans ligi"]},
 USC:{name:"UEFA Süper Kupa",goal:50000,assist:40000,gym:50000,cup:3000000,aliases:["uefa süper kupa","uefa super cup","usc"]},
 WC:{name:"Dünya Kupası",goal:70000,assist:60000,gym:70000,cup:5000000,aliases:["dünya kupası","world cup"]},
 EURO:{name:"Avrupa Şampiyonası",goal:60000,assist:50000,gym:60000,cup:4000000,aliases:["euro","avrupa şampiyonası"]},
 NL:{name:"Uluslar Ligi",goal:40000,assist:30000,gym:40000,cup:2500000,aliases:["uluslar ligi","nations league"]},
};
const money = n => new Intl.NumberFormat("tr-TR",{maximumFractionDigits:0}).format(n)+" €";
function pickTournament(userText){
 const text=userText.toLocaleLowerCase("tr-TR");
 const ordered=Object.entries(rates).sort((a,b)=>Math.max(...b[1].aliases.map(x=>x.length))-Math.max(...a[1].aliases.map(x=>x.length)));
 for(const [key,r] of ordered){for(const alias of r.aliases){const a=alias.toLocaleLowerCase("tr-TR");if(text.includes(a))return {key,rate:r};}}
 return null;
}
function findCount(text, kind){
 const labelMap={goals:"(?:gol(?:ler|üm|ümün| sayısı)?|goller)",assists:"(?:asist(?:ler|im| sayısı)?)",gym:"gym(?: sayısı)?",cups:"(?:kupa(?:lar| sayısı)?|kupam)"};
 const label=labelMap[kind];
 const patterns=[new RegExp(label+"\\s*(?:[:=]|\\bis\\b)?\\s*(\\d{1,6})","i"),new RegExp("(\\d{1,6})\\s*"+label,"i")];
 for(const pattern of patterns){const m=text.match(pattern);if(m)return Math.min(100000,Number(m[1]));}
 if(kind==="cups"&&/(?:kupa(?:m|lar)?\s*(?:yok|yoktu|kazanmadım)|hiç\s*kupa|kupa\s*(?:0|sıfır))/.test(text.toLocaleLowerCase("tr-TR")))return 0;
 return null;
}
function calculationContext(messages){
 const users=messages.filter(m=>m.role==="user").map(m=>m.content);
 const joined=users.join("\n");
 if(!/(hesapla|hesaplayalım|değerimi|degerimi|oyuncu değeri|oyuncu degeri|katkı toplam|kaç para|kac para)/i.test(joined))return "";
 let selected=null;for(let i=users.length-1;i>=0&&!selected;i--)selected=pickTournament(users[i]);
 const counts={goals:findCount(joined,"goals"),assists:findCount(joined,"assists"),gym:findCount(joined,"gym"),cups:findCount(joined,"cups")};
 const labels={goals:"gol",assists:"asist",gym:"gym",cups:"kupa"};
 const missing=Object.keys(counts).filter(k=>counts[k]===null).map(k=>labels[k]);
 if(!selected){return "HESAPLAMA DURUMU: Kullanıcı katkı değerini hesaplamak istiyor ama turnuva net seçilmedi. Turnuvayı sormadan oran seçme.";}
 if(missing.length){return `HESAPLAMA DURUMU: Kullanıcı ${selected.rate.name} için katkı hesabı istiyor; henüz verilmemiş alanlar: ${missing.join(", ")}. Bu alanları doğal, kısa bir soruyla iste. Bilinmeyenleri sıfır varsayma.`;}
 const r=selected.rate,c=counts;
 const parts={goal:c.goals*r.goal,assist:c.assists*r.assist,gym:c.gym*r.gym,cup:c.cups*r.cup};
 const total=parts.goal+parts.assist+parts.gym+parts.cup;
 return `DOĞRULANMIŞ HESAPLAMA SONUCU (aynen kullan; yeniden hesaplayıp farklı rakam söyleme): Turnuva ${r.name}. Gol ${c.goals} × ${money(r.goal)} = ${money(parts.goal)}; asist ${c.assists} × ${money(r.assist)} = ${money(parts.assist)}; gym ${c.gym} × ${money(r.gym)} = ${money(parts.gym)}; kupa ${c.cups} × ${money(r.cup)} = ${money(parts.cup)}. Kesin toplam: ${money(total)}. Bu tutar katkı toplamıdır; tam oyuncu piyasa değeri değildir. Sonucu doğal bir dille ve kısa kırılımla açıkla.`;
}
Deno.serve(async (req: Request) => {
 const origin = req.headers.get("origin") || "";
 if (origin && !allowedOrigins.has(origin)) {
  return new Response(JSON.stringify({ error: "Bu site MortaBot API'sini kullanmak için yetkili değil." }), {
   status: 403, headers: { "Content-Type": "application/json; charset=utf-8", "Vary": "Origin" }
  });
 }
 if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });
 if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
 const contentLength = Number(req.headers.get("content-length") || 0);
 if (contentLength > 30000) return json(req, { error: "Mesaj çok uzun. Daha kısa bir mesajla deneyelim." }, 413);
 try {
  const openRouterKey = env("OPENROUTER_API_KEY");
  const supabaseUrl = env("SUPABASE_URL").replace(/\/$/, "");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!openRouterKey) return json(req, { error: "MortaBot ücretsiz AI anahtarı henüz kurulmamış." }, 503);
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
   console.error("MortaBot missing Supabase runtime settings");
   return json(req, { error: "MortaBot güvenlik ayarları tamamlanmamış." }, 503);
  }
  const userId = await getAuthenticatedUserId(req, supabaseUrl, anonKey);
  if (!userId) return json(req, { error: "Sohbete devam etmek için MortaLeague hesabına yeniden giriş yap." }, 401);
  let body: any;
  try { body = await req.json(); } catch { return json(req, { error: "Mesaj biçimi okunamadı." }, 400); }
  if (!Array.isArray(body?.messages)) return json(req, { error: "Mesaj geçmişi eksik." }, 400);
  const raw = body.messages.slice(-16);
  if (raw.some((m: any) => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) {
   return json(req, { error: "Mesaj geçmişinde geçersiz içerik var." }, 400);
  }
  const messages = raw.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content.trim().slice(0, 1600) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return json(req, { error: "Geçerli kullanıcı mesajı bulunamadı." }, 400);
  if (messages[messages.length - 1].content.length === 0) return json(req, { error: "Boş mesaj gönderilemez." }, 400);
  if (messages.reduce((sum: number, m: {content:string}) => sum + m.content.length, 0) > 14000) {
   return json(req, { error: "Sohbet çok uzadı. Yeni bir sohbet başlatıp devam edebilirsin." }, 413);
  }
  const rateAllowed = await allowRequest(supabaseUrl, serviceRoleKey, userId);
  if (rateAllowed === null) return json(req, { error: "MortaBot güvenlik sınırı henüz hazır değil. Biraz sonra tekrar dene." }, 503);
  if (!rateAllowed) return json(req, { error: "kanka biraz hızlı gittik 😅 dakikada 12, günde 100 mesaj sınırı var. Birazdan tekrar deneyebilirsin." }, 429);
  // Never route this zero-budget deployment to a paid model by configuration accident.
  const configuredModel = env("OPENROUTER_MODEL");
  const primaryModel = configuredModel === "openrouter/free" || configuredModel.endsWith(":free")
    ? configuredModel
    : "nvidia/nemotron-3-super-120b-a12b:free";
  // OpenRouter tries models in order when one is unavailable; every entry here is free.
  const models = [...new Set([
    primaryModel,
    "google/gemma-4-31b-it:free",
    "openrouter/free",
    "qwen/qwen3.8-27b:free",
  ])];
  const calc = calculationContext(messages);
  const instructions = rules + (calc ? "\n\n" + calc : "");
  const requestHeaders = {
    Authorization: `Bearer ${openRouterKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://mortaleaguev2.vercel.app",
    "X-OpenRouter-Title": "MortaLeague MortaBot",
  };
  // OpenRouter requires `model`; `models` is the ordered fallback list.
  // Omitting `model` makes the request invalid and causes repeated 502s in the UI.
  const requestBody = {
    model: models[0],
    models: models.slice(1),
    messages: [{ role: "system", content: instructions }, ...messages],
    max_tokens: 1000,
    temperature: 0.55,
    provider: { allow_fallbacks: true },
  };
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(45000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorCode = payload?.error?.code || response.status;
    const errorType = payload?.error?.metadata?.error_type || "unknown";
    const providerCode = payload?.error?.metadata?.provider_code || "unknown";
    console.error("MortaBot free model chain failed", response.status, errorCode, errorType, providerCode);
    if (response.status === 401) {
      return json(req, { error: "OpenRouter anahtarı kabul edilmedi. Supabase Secrets içindeki OPENROUTER_API_KEY değerini kontrol et." }, 502);
    }
    if (response.status === 429) {
      return json(req, { error: "Ücretsiz AI modellerinin istek limiti dolmuş veya sağlayıcılar meşgul. Bu bir bekleme kuyruğu değil; biraz sonra tekrar dene." }, 429);
    }
    return json(req, { error: "Ücretsiz AI modelleri şu an yanıt veremedi. Otomatik yedekler de denendi; biraz sonra tekrar dene." }, 502);
  }
  const replyValue = payload?.choices?.[0]?.message?.content;
  let reply = typeof replyValue === "string" ? replyValue.trim() : Array.isArray(replyValue)
    ? replyValue.map((item: any) => typeof item?.text === "string" ? item.text : "").join("\n").trim()
    : "";
  // Some reasoning models can return HTTP 200 without user-facing text. Retry once via the free router.
  if (!reply) {
    console.error("MortaBot model returned empty content; retrying openrouter/free", payload?.model || "unknown");
    const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "system", content: instructions }, ...messages],
        max_tokens: 1000,
        temperature: 0.55,
        provider: { allow_fallbacks: true },
      }),
      signal: AbortSignal.timeout(20000),
    });
    const retryPayload = await retryResponse.json().catch(() => ({}));
    const retryValue = retryPayload?.choices?.[0]?.message?.content;
    reply = typeof retryValue === "string" ? retryValue.trim() : Array.isArray(retryValue)
      ? retryValue.map((item: any) => typeof item?.text === "string" ? item.text : "").join("\n").trim()
      : "";
    if (!retryResponse.ok || !reply) {
      console.error("MortaBot free-router retry failed", retryResponse.status, retryPayload?.error?.code || "empty_response");
      return json(req, { error: "Ücretsiz modeller yanıt üretmedi. Bu genellikle geçici sağlayıcı yoğunluğu veya ücretsiz kota sınırıdır; biraz sonra tekrar dene." }, 502);
    }
  }
  return json(req, { reply });
 } catch (error) {
  console.error("MortaBot handler error", String((error as Error)?.message || error));
  return json(req, { error: "İstek işlenemedi. Biraz sonra tekrar dene." }, 500);
 }
});