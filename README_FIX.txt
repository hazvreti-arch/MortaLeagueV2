MORTALEAGUE — MOBILE QUALITY AUDIT & REPAIR
Tarih: 8 Kasım 2026

PAKETTEKİ DOSYALAR
- index.html: Erişilebilir içerik bağlantısı, açık button type değerleri, profil dialog odak noktası ve yeni asset sürümü.
- app.js: Profil penceresinde X/backdrop/Escape kapatma, klavye odak döngüsü, scroll kilidini geri yükleme, gezinme ve profil açılışında profil/MortaBot kapatma ve eski profil isteklerinin yeni profili ezmesini engelleme.
- style.css: Önceki mobil CSS katmanlarının küçük ekranlarda oluşturduğu iki sütunlu minik metin sorununu giderir; oyuncu/sistem listelerini tek sütuna alır, menü ve dokunma hedeflerini büyütür, profil X butonunu görünür tutar.
- service-worker.js: Yeni cache adı ve HTML ile eşleşen asset sürümleri.
- README_FIX.txt: Bu kurulum notu.

KURULUM
1. ZIP'i aç.
2. index.html, app.js, style.css ve service-worker.js dosyalarını GitHub deposunun kök dizinindeki aynı isimli dosyalarla değiştir.
3. README_FIX.txt dosyasını depoya yüklemek zorunda değilsin.
4. Commit et ve Vercel dağıtımının tamamlanmasını bekle.
5. Telefonda PWA'yı tamamen kapatıp yeniden aç veya tarayıcıda sayfayı yenile.
6. Oyuncular > profil aç: X görünmeli; X, arka plan ve Escape kapatmalı. Ana Sayfa/Sistemler/Topluluk/Mesajlar gibi bir menüye geçişte profil ve MortaBot kapanmalı.

HESAPLAYICI
- Bu index.html, app.js ve style.css içinde ayrı hesaplayıcı ekranı/kodu/yüklemesi bulunmuyor.
- Depoda eski calculator.js varsa, bu dosya artık çağrılmıyor. Tamamen kaldırmak için GitHub'dan ayrıca silinebilir.

KAPSAM SINIRI
Bu ZIP, tam site yedeği değildir; önceki paketteki gibi dört ana dosyanın yamasıdır. config.js, auth.js, social.js, messages.js, mortabot.js, pwa.js, visual-polish.js, SQL migration'ları, Supabase Edge Function ve manifest/icon dosyaları pakette yoktur ve bilerek değiştirilmemiştir. Bunların canlı davranışı, bu ZIP'in içinden tek tek doğrulanamaz.

KURAL METNİYLE İLGİLİ AÇIK NOKTALAR
- Yaş Sistemi kaynak aralıklarında 20, 24, 28 ve 33 yaş sınırları çakışıyordu. Görünen kategori aralıkları 16–19, 20–23, 24–27, 28–32, 33–40 olarak düzenlendi; yaş 16 ve 28 için değer değişimi kaynakta ayrıca verilmediğinden bir katkı miktarı uydurulmamıştır.
- Sponsorluk metninde “çar sınırına” ifadesi bulunuyor. Hangi limitin kastedildiği belirgin olmadığından otomatik olarak yeniden yazılmadı.
- Maaş, katkı, gelir ve kupa rakamları kaynak oyun kurallarıdır; bu denetimde sayısal değerler değiştirilmedi.

YEREL KONTROLLER
- app.js Node.js sözdizimi kontrolü: başarılı.
- style.css ayrıştırma kontrolü: başarılı, CSS parse hatası yok.
- index.html: 426 element tarandı; 160 ID içinde tekrar yok; app.js'in statik ID başvurularında eksik ID yok.
- calculator.js/ayrı hesaplayıcı ekranı referansı: index/app/style içinde yok.
- ZIP bütünlük kontrolü yapılmalıdır (kurulumdan önce).

CANLI TEST SINIRI
Bu çalışma, verilen ZIP'in beş dosyası üzerinde statik inceleme ve düzeltme içerir. Supabase/Vercel hesabına giriş yapılmadığından canlı giriş, takip, mesajlaşma, MortaBot yanıtı veya gerçek cihaz testi yapılmış değildir.
