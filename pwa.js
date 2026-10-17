(() => {
  "use strict";
  let installPrompt = null;
  const buttons = () => [document.getElementById("pwa-install-button"), document.getElementById("footer-install-button")].filter(Boolean);
  const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  function showButtons(visible) {
    buttons().forEach(button => {
      button.hidden = !visible;
      button.textContent = isIOS() && !installPrompt ? "Ana ekrana ekle" : "Uygulamayı yükle ↗";
    });
  }
  async function install() {
    if (standalone()) { showButtons(false); return; }
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => ({ outcome: "dismissed" }));
      if (choice.outcome === "accepted") showButtons(false);
      installPrompt = null;
      return;
    }
    if (isIOS()) {
      window.alert("MortaLeague'i ana ekrana eklemek için Safari'de Paylaş düğmesine dokun, ardından ‘Ana Ekrana Ekle’ seçeneğini seç.");
      return;
    }
    window.alert("Tarayıcının menüsünü açıp ‘Uygulamayı yükle’ veya ‘Ana ekrana ekle’ seçeneğini kullan.");
  }
  function attach() { buttons().forEach(button => button.addEventListener("click", install)); }
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event; showButtons(true);
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; showButtons(false); });
  window.addEventListener("load", () => {
    attach();
    if (standalone()) showButtons(false);
    else if (isIOS()) showButtons(true);
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/service-worker.js?v=ml-shell-20261018-03", { scope: "/" })
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
  }, { once: true });
})();
