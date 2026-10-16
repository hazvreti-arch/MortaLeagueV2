const systems=[
["Yayın Geliri Sistemi","Yayın gelirleri ve dağıtım kuralları.","◉"],
["Oyuncu Katkı Değerleri","Maç performansından doğan katkı puanları.","↗"],
["Telefon Satın Alma Sistemi","Telefon seçenekleri ve satın alma akışı.","▣"],
["Ev Satın Alma Sistemi","Ev sahipliği, fiyatlar ve satın alma işlemleri.","⌂"],
["Taşıt Alma Sistemi","Taşıt seçenekleri, sahiplik ve fiyatlar.","➤"],
["Ödül Sistemi","Başarılar ve sezon içi ödül mekanikleri.","✦"],
["UCL / UEL / UECL Katkıları","Avrupa kupalarında oyuncu katkı değerleri.","♜"],
["Sponsorluk Sistemi","Sponsor anlaşmaları, şartlar ve gelirler.","◇"],
["Teknik Direktör Olma Sistemi","Oyuncuların teknik direktörlüğe geçişi.","♟"],
["Teknik Direktör Değerleri","Teknik direktör performansı ve değeri.","◈"],
["Maaş Sistemi","Oyuncu sözleşmeleri, maaşlar ve ödeme döngüsü.","₺"],
["UCL / UEL / UECL Gelirleri","Avrupa kupalarının gelir hesaplaması.","⌁"],
["Stadyum Sistemi","Stadyum seviyeleri, kapasite ve geliştirmeler.","▤"],
["Katkı Sınırı Sistemi","Katkı değerlerinin limit ve dengeleme kuralları.","⊙"],
["Yaş Sistemi","Oyuncu yaşı ve yaşa bağlı mekanikler.","◷"],
["Antrenman Sahası Sistemi","Antrenman sahaları ve gelişim altyapısı.","⌁"]];
document.getElementById("systems-grid").innerHTML=systems.map((s,i)=>`<article class="system-card"><span class="system-number">${String(i+1).padStart(2,"0")}</span><span class="system-glyph">${s[2]}</span><h3>${s[0]}</h3><p>${s[1]}</p><div class="system-foot">DESIGN PHASE</div></article>`).join("");
const validPages=["home","league","systems","rules"];
function showPage(name){if(!validPages.includes(name))return;document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===name));window.scrollTo({top:0,behavior:"smooth"});}
document.addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b){e.preventDefault();showPage(b.dataset.page);}});

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
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const amount = Math.min(isSmall() ? 34 : 68, Math.max(22, Math.floor(width * height / (isSmall() ? 19000 : 15500))));
    particles = Array.from({ length: amount }, () => ({
      x: rand(0, width), y: rand(0, height),
      r: rand(.6, 1.65), vx: rand(-.11, .11), vy: rand(-.16, -.035),
      alpha: rand(.18, .64), phase: rand(0, Math.PI * 2),
      twinkle: rand(.004, .013), hue: rand(270, 300)
    }));
  }

  function draw() {
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
