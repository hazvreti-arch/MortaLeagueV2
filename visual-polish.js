(() => {
  "use strict";
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const selector = ".dna-card, .system-card, .player-card, .social-post-card, .announcement-card, .admin-panel, .achievement-card, .social-notification";
  const observed = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("ml-in-view");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });

  function register(root) {
    if (!(root instanceof Element)) return;
    if (root.matches(selector) && !observed.has(root)) {
      observed.add(root);
      root.classList.add("ml-reveal");
      observer.observe(root);
    }
    root.querySelectorAll?.(selector).forEach(node => {
      if (observed.has(node)) return;
      observed.add(node);
      node.classList.add("ml-reveal");
      observer.observe(node);
    });
  }

  document.documentElement.classList.add("ml-motion-ready");
  register(document.body);
  const mutations = new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(register);
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("pagehide", () => { mutations.disconnect(); observer.disconnect(); }, { once: true });
})();
