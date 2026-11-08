MORTALEAGUE — SYSTEM DETAIL MOBILE FIX
Tarih: 8 Kasım 2026

DÜZELTİLEN SORUN
- Sistem detay penceresi tekrar açıldığında önceki kaydırma konumunu koruyabiliyordu. Her açılışta pencere ve arka plan kaydırması en üste sıfırlanır.
- Mobil ekranda detay penceresi güvenli ekran alanına göre boyutlanır ve kendi içinde kaydırılır.
- Kapatma düğmesi mobilde görünür kalır.
- Sayfa kaydırma kilidi kapatılırken önceki body overflow değeri geri yüklenir.
- CSS/JS asset sürümleri ve service worker cache adı güncellendi.

KURULUM
ZIP'i açıp index.html, app.js, style.css ve service-worker.js dosyalarını GitHub deposunun kökündeki aynı isimli dosyalarla değiştir. Commit et ve Vercel dağıtımının tamamlanmasını bekle. Sonra Instagram içi tarayıcıyı tamamen kapatıp yeniden aç veya sayfayı yenile.

NOT
Bu paket yalnızca bu dört dosyanın yamasıdır; tam site yedeği değildir. Canlı Vercel/Supabase ortamında test yapılmamıştır.
