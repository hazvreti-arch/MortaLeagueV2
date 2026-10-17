(() => {
  "use strict";
  let installPrompt = null;
  const installButton = () => document.getElementById("pwa-install-cta");
  const standalone = () => Boolean(window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true);
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = () => /android/i.test(navigator.userAgent);

  function showInstallButton(visible) {
    const button = installButton();
    if (!button) return;
    button.hidden = !visible;
    button.setAttribute("aria-hidden", String(!visible));
    if (visible) {
      const label = isIOS() ? "Ana ekrana ekle" : "Uygulamayı yükle";
      button.querySelector("span:nth-child(2)")?.replaceChildren(document.createTextNode(label));
      button.setAttribute("aria-label", isIOS() ? "MortaLeague'i ana ekrana ekle" : "MortaLeague uygulamasını yükle");
    }
  }

  async function install() {
    if (standalone()) { showInstallButton(false); return; }
    if (installPrompt) {
      const promptEvent = installPrompt;
      installPrompt = null;
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          showInstallButton(false);
          return;
        }
        showInstallButton(true);
        showFallbackInstructions("dismissed");
      } catch (error) {
        console.warn("MortaLeague yükleme penceresi açılamadı:", error);
        showFallbackInstructions();
      }
      return;
    }
    showFallbackInstructions();
  }

  function showFallbackInstructions(reason) {
    if (isIOS()) {
      window.alert("MortaLeague'i ana ekrana eklemek için Safari'de Paylaş düğmesine dokun, ardından ‘Ana Ekrana Ekle’ seçeneğini seç.");
      return;
    }
    const browser = isAndroid() ? "Chrome" : "tarayıcın";
    const suffix = reason === "dismissed" ? " İstersen bu menüden tekrar yüklemeyi seçebilirsin." : "";
    window.alert(`Yükleme penceresi bu oturumda açılamadı. ${browser} menüsünü açıp ‘Uygulamayı yükle’ veya ‘Ana ekrana ekle’ seçeneğini kullan.${suffix}`);
  }

  function setup() {
    const button = installButton();
    button?.addEventListener("click", install);
    showInstallButton(!standalone());

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      showInstallButton(!standalone());
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      showInstallButton(false);
    });

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/service-worker.js?v=ml-shell-20261018-04", { scope: "/" })
        .catch(error => console.warn("MortaLeague çevrimdışı desteği kurulamadı:", error));
    }

    const requestedPage = new URLSearchParams(location.search).get("page");
    const allowedPages = new Set(["home", "systems", "players", "community", "messages"]);
    if (requestedPage && allowedPages.has(requestedPage)) {
      const openRequestedPage = () => window.MortaUI?.showPage?.(requestedPage);
      if (window.MortaLeague?.ready && typeof window.MortaLeague.ready.then === "function") {
        window.MortaLeague.ready.then(() => window.setTimeout(openRequestedPage, 0));
      } else {
        window.addEventListener("ml:ready", () => window.setTimeout(openRequestedPage, 0), { once: true });
      }
    }
  }

  // The script sits at the end of the document; initialize immediately when possible.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
