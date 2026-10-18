(() => {
  "use strict";
  let installPrompt = null;
  let helpDialog = null;
  const installButton = () => document.getElementById("pwa-install-cta");
  const isStandalone = () => Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith("android-app://")
  );
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

  function ensureHelpDialog() {
    if (helpDialog) return helpDialog;
    helpDialog = document.createElement("dialog");
    helpDialog.className = "install-help-dialog";
    helpDialog.setAttribute("aria-labelledby", "install-help-title");
    helpDialog.innerHTML = `
      <div class="install-help-card">
        <div class="install-help-mark" aria-hidden="true">M</div>
        <p class="install-help-eyebrow">MORTALEAGUE APP</p>
        <h2 id="install-help-title">Uygulamayı yükle</h2>
        <p id="install-help-message" class="install-help-message"></p>
        <button class="btn btn-primary install-help-close" type="button">Tamam</button>
      </div>`;
    document.body.appendChild(helpDialog);
    helpDialog.querySelector(".install-help-close")?.addEventListener("click", () => helpDialog.close());
    helpDialog.addEventListener("click", event => {
      if (event.target === helpDialog) helpDialog.close();
    });
    return helpDialog;
  }

  function showInstallHelp() {
    const dialog = ensureHelpDialog();
    const message = dialog.querySelector("#install-help-message");
    let copy;
    if (isIOS()) {
      copy = "Safari'de Paylaş düğmesine dokun, ardından ‘Ana Ekrana Ekle’ seçeneğini seç.";
    } else if (isAndroid()) {
      copy = "Bu tarayıcı şu anda kurulum penceresi sunmadı. Chrome menüsünü (⋮) açıp ‘Uygulamayı yükle’ veya ‘Ana ekrana ekle’ seçeneğini kullan. Bu seçenek görünmüyorsa uygulama zaten kurulu olabilir ya da tarayıcı kurulum için uygun değildir.";
    } else {
      copy = "Tarayıcı menüsünde ‘Uygulamayı yükle’ veya ‘Sayfayı uygulama olarak yükle’ seçeneğini ara. Seçenek yoksa bu tarayıcı şu anda yüklemeyi desteklemiyor olabilir.";
    }
    if (message) message.textContent = copy;
    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
    else if (message) message.textContent = copy;
  }

  async function install() {
    if (isStandalone()) {
      showInstallButton(false);
      return;
    }
    if (!installPrompt) {
      showInstallHelp();
      return;
    }
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
      showInstallHelp();
    } catch (error) {
      console.warn("MortaLeague yükleme penceresi açılamadı:", error);
      showInstallHelp();
    }
  }

  function setup() {
    const button = installButton();
    button?.addEventListener("click", install);
    showInstallButton(!isStandalone());
    // Android Chrome can sometimes report an already-installed related WebAPK.
    // If so, do not show a button that cannot open another install prompt.
    if (!isStandalone() && typeof navigator.getInstalledRelatedApps === "function") {
      navigator.getInstalledRelatedApps().then(apps => {
        const alreadyInstalled = Array.isArray(apps) && apps.some(app => app.platform === "webapp");
        if (alreadyInstalled) showInstallButton(false);
      }).catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      showInstallButton(!isStandalone());
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      showInstallButton(false);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && isStandalone()) showInstallButton(false);
    });

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("/service-worker.js?v=ml-quality-20261018-10", { scope: "/" })
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
