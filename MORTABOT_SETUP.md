# MortaBot — kurulum ve yayına çıkış kontrolü

Bu ZIP bir **site güncelleme paketi**dir. Doğrudan canlı yayına alınmış değildir.

## 1) GitHub'daki MortaLeague deposuna ekle
- Var olan `index.html`, `style.css`, `app.js` ve `service-worker.js` dosyalarını pakettekilerle güncelle.
- `calculator.js` ve `mortabot.js` dosyalarını kök klasöre ekle/güncelle. Bu sürümde arayüzün eski `OPENAI_API_KEY` hatalı yönlendirmesi de `OPENROUTER_API_KEY` kurulumuna göre düzeltildi.
- `supabase/functions/mortabot/index.ts` dosyasını aynı yol ile ekle. **Edge Function kodu depodaki kök `index.ts` dosyasında bırakılırsa Supabase bunu `mortabot` fonksiyonu olarak dağıtmaz.**
- `config.js`, `auth.js`, `messages.js`, `social.js`, `visual-polish.js`, `pwa.js`, `manifest.webmanifest`, ikonlar veya mevcut başka dosyaları silme; bunlar ana projenin parçalarıdır.
- `supabase/config.toml` zaten varsa, onu **tamamen değiştirme**. İçine sadece `supabase/functions/mortabot/verify_jwt_config_snippet.toml` içindeki `[functions.mortabot]` bölümünü ekle. Aynı bölüm varsa `verify_jwt = true` olduğunu doğrula.

## 2) OpenRouter ücretsiz model anahtarını hazırla
- OpenRouter hesabında `https://openrouter.ai/settings/keys` sayfasını aç.
- Bu paket varsayılan olarak `nvidia/nemotron-3-super-120b-a12b:free` modelini kullanır. Modelin ücretsiz erişimi ve kullanım limitleri sağlayıcı tarafından değiştirilebilir; sıfır ücret ve kesintisiz erişim garantisi yoktur.
- OpenRouter ücretsiz sağlayıcı uyarısına göre gizli, hassas veya kişisel bilgileri bu modele göndermeyin. Bot kullanıcılarına da bunu bildirin.
- Anahtarı bana mesaj atma, GitHub'a koyma ve HTML/JS'ye yazma. Supabase Edge Function Secrets bölümünde `OPENROUTER_API_KEY` adıyla sakla.
- `OPENROUTER_MODEL` ayarlanacaksa yalnızca `openrouter/free` veya `:free` ile biten bir model slug'ı kabul edilir; ücretli modele yönlendirme yapılmaz.

## 3) Güvenli erişim ve hız sınırı
- Supabase Auth üzerinden giriş zorunludur. Function, bearer token'ı Supabase Auth ile doğrular.
- `supabase/sql/mortabot_rate_limit.sql` içeriğini Supabase SQL Editor'da bir kez çalıştır. Bu, kullanıcı başına dakikada 12 ve 24 saatte 100 isteğe sınır koyar.
- Function, Supabase'in `SUPABASE_URL`, `SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` sunucu ortam değişkenlerini kullanır. `service_role` anahtarını istemci tarafına koyma.
- Gerçek alan adın farklıysa function dosyasındaki `allowedOrigins` listesine yalnızca kendi HTTPS alan adını ekle.

## 4) Supabase function'ı dağıt
Supabase CLI oturum açılmış bir geliştirme ortamında:

```bash
supabase login
supabase link --project-ref dxznuiqachpggwxmczwn
supabase secrets set OPENROUTER_API_KEY=YOUR_KEY_HERE
supabase functions deploy mortabot --project-ref dxznuiqachpggwxmczwn
```

`YOUR_KEY_HERE` yerine anahtarı güvenli şekilde ekle; anahtarı repoya kaydetme. Dashboard üzerinden eklemek daha kolaydır. CLI ile function deploy ederken `supabase/config.toml` dosyasında `verify_jwt = true` kaldığını doğrula. SQL migration önce çalıştırılmış olmalı.

## 5) Yayın öncesi testler
1. Giriş yapmamış istek 401 döndürmeli.
2. Giriş yapmış kullanıcı normal Türkçe sohbete cevap almalı.
3. Kullanıcı “UCL, 3 gol, 5 asist, 7 gym, 0 kupa” dediğinde katkı hesabı 1.000.000 € olmalı.
4. Sistemde olmayan kural sorulunca bot uydurmamalı; belirsizliği söylemeli.
5. 13. istek/60 saniye içinde 429; günlük sınır dolunca da 429 dönmeli.
6. Yetkisiz web origin'inden istek reddedilmeli.
7. API key hiçbir tarayıcı isteğinde, HTML/JS dosyasında veya repoda görünmemeli.
8. Telefon ve masaüstünde widget, hata durumu, temizle butonu ve bağlantı davranışı kontrol edilmeli.

Sadece statik dosyaların GitHub'a aktarılması gerçek AI'ı çalıştırmaz. AI için Edge Function, sırlar ve SQL rate-limit kurulumu da tamamlanmalı; bunlar doğrulanmadan siteye “hazır” denmemeli.
