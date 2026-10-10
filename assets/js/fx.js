'use strict';
/* ═══════════ Scene engine: 3D starfield + comets, scroll-driven 3D, pointer tilt, reveals ═══════════
   One requestAnimationFrame loop drives everything:
   · the <canvas id="space">: stars in 3D that fly toward you as you scroll (streaks when you scroll fast)
     and comets with a cyan/pink tail crossing the sky now and then;
   · CSS variables consumed by scenes.css: --sp (page progress), --p (hero), --cp/--cpa (each scene),
     --tx/--ty/--gx/--gy (pointer tilt and glare).
   With "reduce motion" the sky is drawn once and nothing moves. */
(function FX() {
  const root = document.documentElement;
  const still = reducedMotion();
  const canvas = $('#space');
  const ctx = canvas.getContext('2d');
  const hud = $('#hud');
  const hero = $('[data-hero]');
  const scenes = $$('[data-scene]');

  /* ── Starfield ── */
  const FOCAL = 420, DEPTH = 1800;
  let W = 0, H = 0, DPR = 1, stars = [];
  const cam = { x: 0, y: 0, tx: 0, ty: 0 };

  function spawn(s, z) {
    s.z = z;
    // Uniform on screen at this depth (slightly wider than the viewport).
    s.x = (Math.random() * 2 - 1) * (W * .62) * z / FOCAL;
    s.y = (Math.random() * 2 - 1) * (H * .62) * z / FOCAL;
    s.fade = 0;
    return s;
  }
  function makeStar() {
    const r = Math.random();
    return spawn({
      r: Math.random() * 1.1 + .35,
      tw: Math.random() * Math.PI * 2,
      ts: .6 + Math.random() * 1.6,
      // Mostly white-blue, a few comet-cyan and pink ones.
      c: r < .08 ? '143, 227, 255' : r < .13 ? '255, 160, 205' : null
    }, Math.random() * DEPTH + 1);
  }
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round(Math.min(950, W * H / 1700));
    stars = Array.from({ length: n }, makeStar);
    stars.forEach(s => { s.fade = 1; });
    measure();
    if (still) { draw(0, 0); applyScroll(true); }
  }

  /* ── Comets ── */
  let comets = [], nextComet = performance.now() + 2500;
  function addComet() {
    const ang = (112 + Math.random() * 16) * Math.PI / 180; // heading down-left, like the reference art
    const speed = 7 + Math.random() * 5;
    comets.push({
      x: W * (.35 + Math.random() * .75), y: -40 - Math.random() * H * .2,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      len: 180 + Math.random() * 220,
      split: Math.random() < .55, // the pink fragment breaking off
      life: 0
    });
  }
  function drawComet(c) {
    const n = Math.hypot(c.vx, c.vy), ux = c.vx / n, uy = c.vy / n;
    const tx = c.x - ux * c.len, ty = c.y - uy * c.len;
    const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
    g.addColorStop(0, 'rgba(143, 227, 255, 0)');
    g.addColorStop(.7, 'rgba(143, 227, 255, .55)');
    g.addColorStop(1, 'rgba(255, 255, 255, .95)');
    ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y); ctx.stroke();
    if (c.split && c.life > 18) {
      const k = Math.min(1, (c.life - 18) / 40), off = 10 + k * 26;
      const px = c.x - ux * 40 + uy * off * .35, py = c.y - uy * 40 - ux * off * .35;
      const g2 = ctx.createLinearGradient(px - ux * c.len * .55, py - uy * c.len * .55, px, py);
      g2.addColorStop(0, 'rgba(255, 141, 192, 0)');
      g2.addColorStop(1, `rgba(255, 141, 192, ${.75 * k})`);
      ctx.strokeStyle = g2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(px - ux * c.len * .55, py - uy * c.len * .55); ctx.lineTo(px, py); ctx.stroke();
    }
    const h = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 16);
    h.addColorStop(0, 'rgba(255, 255, 255, .95)');
    h.addColorStop(.3, 'rgba(160, 230, 255, .45)');
    h.addColorStop(1, 'rgba(160, 230, 255, 0)');
    ctx.fillStyle = h;
    ctx.beginPath(); ctx.arc(c.x, c.y, 16, 0, Math.PI * 2); ctx.fill();
  }

  /* ── Drawing ── */
  function draw(t, dz) {
    ctx.clearRect(0, 0, W, H);
    const light = root.getAttribute('data-theme') !== 'dark';
    const base = light ? .7 : 1;
    const cx = W / 2, cy = H / 2;
    const streak = Math.min(Math.abs(dz) * 2.2, 60);
    for (const s of stars) {
      if (!still) {
        s.z -= dz;
        if (s.z < 1) spawn(s, DEPTH - Math.random() * 200);
        else if (s.z > DEPTH) spawn(s, 40 + Math.random() * 300);
        if (s.fade < 1) s.fade = Math.min(1, s.fade + .03);
      }
      const k = FOCAL / s.z;
      const x = cx + (s.x - cam.x) * k, y = cy + (s.y - cam.y) * k;
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const depth = 1 - s.z / DEPTH;
      const tw = still ? 1 : .72 + .28 * Math.sin(t * .001 * s.ts + s.tw);
      const a = Math.min(1, depth * 1.5) * tw * s.fade * base;
      if (a < .02) continue;
      const size = Math.min(3.4, s.r * k * 1.6);
      ctx.fillStyle = `rgba(${s.c || (light ? '255, 255, 255' : '225, 235, 255')}, ${a})`;
      if (streak > 1.5 && depth > .25) {
        // Hyperspace streak: from where the star was a moment ago toward its position now.
        const k0 = FOCAL / Math.min(DEPTH, s.z + streak * 3);
        const x0 = cx + (s.x - cam.x) * k0, y0 = cy + (s.y - cam.y) * k0;
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(.6, size * .8);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
      } else if (size < 1.6) {
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      } else {
        ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
        if (size > 2.4) { // soft glow on the closest stars
          ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(x, y, size * 1.8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
    }
    if (still) return;
    if (t > nextComet && !document.hidden) { addComet(); nextComet = t + 6000 + Math.random() * 9000; }
    comets = comets.filter(c => c.x > -c.len && c.y < H + c.len);
    for (const c of comets) { c.x += c.vx; c.y += c.vy; c.life++; drawComet(c); }
  }

  /* ── Scroll-driven 3D ── */
  let docH = 1, heroTop = 0, heroSpan = 1;
  function measure() {
    docH = Math.max(1, root.scrollHeight - H);
    if (hero) { heroTop = hero.offsetTop; heroSpan = Math.max(1, hero.offsetHeight - H); }
  }
  let lastApplied = -1;
  function applyScroll(force) {
    const y = window.scrollY;
    if (!force && y === lastApplied) return;
    lastApplied = y;
    root.style.setProperty('--sp', (Math.min(1, Math.max(0, y / docH))).toFixed(4));
    if (still) return;
    if (hero) hero.style.setProperty('--p', Math.min(1, Math.max(0, (y - heroTop) / heroSpan)).toFixed(4));
    for (const s of scenes) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -H * .5 || r.top > H * 1.5) continue;
      // -1 when the scene is entering from below, 0 centered, 1 leaving above.
      const cp = Math.max(-1.2, Math.min(1.2, -(r.top + r.height / 2 - H / 2) / (H / 2 + r.height / 2)));
      s.style.setProperty('--cp', cp.toFixed(4));
      s.style.setProperty('--cpa', Math.abs(cp).toFixed(4));
    }
  }

  /* HUD tucks away while scrolling down, comes back on the way up. */
  let hudY = window.scrollY;
  function hudScroll() {
    const y = window.scrollY, d = y - hudY;
    if (Math.abs(d) < 6) return;
    hud.classList.toggle('tucked', d > 0 && y > H * .5);
    hudY = y;
  }
  window.addEventListener('scroll', hudScroll, { passive: true });
  hud.addEventListener('focusin', () => hud.classList.remove('tucked'));

  /* ── Pointer tilt ([data-tilt] follows the pointer over it, [data-tilt="screen"] the whole screen) ── */
  const tilts = new Map();
  const mouse = { x: 0, y: 0, nx: 0, ny: 0 };
  let hoverEl = null;
  const tiltOf = el => { let t = tilts.get(el); if (!t) { t = { x: 0, y: 0, tx: 0, ty: 0, gx: 30, gy: 20 }; tilts.set(el, t); } return t; };
  if (still && finePointer.matches) window.addEventListener('pointermove', e => { if (e.clientY < 90) hud.classList.remove('tucked'); }, { passive: true });
  if (!still && finePointer.matches) {
    window.addEventListener('pointermove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.nx = e.clientX / W * 2 - 1; mouse.ny = e.clientY / H * 2 - 1;
      if (e.clientY < 90) hud.classList.remove('tucked'); // pointer near the top brings the menu back
      cam.tx = mouse.nx * 70; cam.ty = mouse.ny * 45;
      const el = e.target.closest && e.target.closest('[data-tilt]:not([data-tilt="screen"])');
      if (hoverEl && hoverEl !== el) { const t = tiltOf(hoverEl); t.tx = 0; t.ty = 0; }
      hoverEl = el;
      if (el) {
        const r = el.getBoundingClientRect(), t = tiltOf(el);
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        t.tx = (.5 - py) * 14; t.ty = (px - .5) * 18; t.gx = px * 100; t.gy = py * 100;
      }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { if (hoverEl) { const t = tiltOf(hoverEl); t.tx = 0; t.ty = 0; hoverEl = null; } cam.tx = cam.ty = 0; });
    $$('[data-tilt="screen"]').forEach(el => tiltOf(el).screen = true);
  }
  function updateTilts() {
    for (const [el, t] of tilts) {
      if (t.screen) { t.tx = -mouse.ny * 9; t.ty = mouse.nx * 12; t.gx = 50 + mouse.nx * 40; t.gy = 40 + mouse.ny * 40; }
      const dx = t.tx - t.x, dy = t.ty - t.y;
      if (Math.abs(dx) < .01 && Math.abs(dy) < .01 && !t.screen) continue;
      t.x += dx * .08; t.y += dy * .08;
      el.style.setProperty('--tx', t.x.toFixed(2) + 'deg');
      el.style.setProperty('--ty', t.y.toFixed(2) + 'deg');
      el.style.setProperty('--gx', t.gx.toFixed(1) + '%');
      el.style.setProperty('--gy', t.gy.toFixed(1) + '%');
    }
  }

  /* ── Loop ── */
  let lastY = window.scrollY, vel = 0, raf = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const y = window.scrollY;
    vel += ((y - lastY) - vel) * .2;
    lastY = y;
    cam.x += (cam.tx - cam.x) * .05; cam.y += (cam.ty - cam.y) * .05;
    applyScroll();
    updateTilts();
    draw(t, Math.max(-60, Math.min(60, .35 + vel * .9)));
  }
  function start() { if (!raf && !still) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });
  window.addEventListener('load', measure);
  if (window.ResizeObserver) new ResizeObserver(() => measure()).observe($('.main'));
  if (still) {
    window.addEventListener('scroll', () => applyScroll(), { passive: true });
    new MutationObserver(() => draw(0, 0)).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }
  resize();
  start();

  /* ── Scroll reveal: every tool block rises into place in 3D the first time it shows up ── */
  if (still || !('IntersectionObserver' in window)) return;
  $$('.section > *').forEach(el => el.classList.add('rv'));
  root.classList.add('fx-on');
  const io = new IntersectionObserver(entries => {
    const shown = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    shown.forEach((e, i) => {
      const el = e.target;
      io.unobserve(el);
      el.style.setProperty('--rd', `${Math.min(i, 5) * 90}ms`);
      el.classList.add('in');
      // Hand the element back to its own transitions once it has landed.
      setTimeout(() => { el.classList.remove('rv', 'in'); el.style.removeProperty('--rd'); }, 1300 + Math.min(i, 5) * 90);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));
})();
