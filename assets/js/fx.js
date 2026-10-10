'use strict';
/* ═══════════ Scene engine: 3D starfield + comets, scroll-driven 3D, pointer tilt, reveals, ripples ═══════════
   One requestAnimationFrame loop drives everything:
   · the <canvas id="space">: stars in 3D that fly toward you as you scroll (streaks when you scroll fast)
     and comets crossing the sky now and then;
   · CSS variables read by the stylesheets. They are written only on the elements that use them (never on
     :root, which would restyle the whole page every frame): --sp on the menu pill, --p on the hero,
     --cp/--cpa on each visible scene, --tx/--ty/--gx/--gy on visible tilting elements.
   Effects level (Ajustes → Efectos): 'full' · 'lite' (fewer stars, 30 fps, no comets or tilt) · 'off'. */
const FX = (() => {
  const root = document.documentElement;
  const canvas = $('#space');
  const ctx = canvas.getContext('2d', { alpha: true });
  const hud = $('#hud'), pill = $('#menuBtn');
  const hero = $('[data-hero]');
  const scenes = $$('[data-scene]');
  const FX_LEVELS = ['full', 'lite', 'off'];

  let level = 'full';
  const moving = () => level !== 'off';

  /* ── Palette colors for the canvas (read once per palette change, never per frame) ── */
  const col = { star: '235, 235, 245', starA: 1, c1: '230, 236, 255', c2: '170, 170, 190' };
  function readColors() {
    const cs = getComputedStyle(root);
    const v = n => cs.getPropertyValue(n).trim();
    col.star = v('--star') || col.star;
    col.starA = parseFloat(v('--star-alpha')) || 1;
    col.c1 = v('--comet-1') || col.c1;
    col.c2 = v('--comet-2') || col.c2;
    makeSprite();
  }

  /* Pre-rendered glow sprite for the closest stars (one drawImage instead of gradients per star). */
  const sprite = document.createElement('canvas');
  function makeSprite() {
    sprite.width = sprite.height = 32;
    const s = sprite.getContext('2d'), g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${col.star}, 1)`);
    g.addColorStop(.18, `rgba(${col.star}, .7)`);
    g.addColorStop(1, `rgba(${col.star}, 0)`);
    s.clearRect(0, 0, 32, 32); s.fillStyle = g; s.fillRect(0, 0, 32, 32);
  }

  /* ── Starfield (struct-of-arrays: no per-frame allocations) ── */
  const FOCAL = 420, DEPTH = 1800;
  let W = 0, H = 0, N = 0;
  let SX, SY, SZ, SR, STW, STS, SF;
  const cam = { x: 0, y: 0, tx: 0, ty: 0 };

  function spawn(i, z) {
    SZ[i] = z;
    SX[i] = (Math.random() * 2 - 1) * (W * .62) * z / FOCAL;
    SY[i] = (Math.random() * 2 - 1) * (H * .62) * z / FOCAL;
    SF[i] = 0;
  }
  function buildStars() {
    const per = level === 'lite' ? 7000 : 2600, max = level === 'lite' ? 160 : 420;
    N = Math.round(Math.min(max, W * H / per));
    SX = new Float32Array(N); SY = new Float32Array(N); SZ = new Float32Array(N);
    SR = new Float32Array(N); STW = new Float32Array(N); STS = new Float32Array(N); SF = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      spawn(i, Math.random() * DEPTH + 1);
      SF[i] = 1;
      SR[i] = Math.random() * 1.1 + .35;
      STW[i] = Math.random() * Math.PI * 2;
      STS[i] = .6 + Math.random() * 1.6;
    }
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    // 1× backing store: the sky is soft by nature and this halves the fill cost on high-DPI screens.
    canvas.width = W; canvas.height = H;
    buildStars();
    measure();
    applyScroll(true);
    if (!moving()) draw(0, 0);
  }

  /* ── Comets ── */
  const comets = [];
  let nextComet = performance.now() + 2500;
  function addComet() {
    const ang = (112 + Math.random() * 16) * Math.PI / 180; // heading down-left, like the reference art
    const speed = 7 + Math.random() * 5;
    comets.push({
      x: W * (.35 + Math.random() * .75), y: -40 - Math.random() * H * .2,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      len: 180 + Math.random() * 220, split: Math.random() < .55, life: 0
    });
  }
  function drawComet(c) {
    const n = Math.hypot(c.vx, c.vy), ux = c.vx / n, uy = c.vy / n;
    const tx = c.x - ux * c.len, ty = c.y - uy * c.len;
    const g = ctx.createLinearGradient(tx, ty, c.x, c.y);
    g.addColorStop(0, `rgba(${col.c1}, 0)`);
    g.addColorStop(.7, `rgba(${col.c1}, .55)`);
    g.addColorStop(1, `rgba(${col.c1}, .95)`);
    ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y); ctx.stroke();
    if (c.split && c.life > 18) {
      const k = Math.min(1, (c.life - 18) / 40), off = 10 + k * 26, L = c.len * .55;
      const px = c.x - ux * 40 + uy * off * .35, py = c.y - uy * 40 - ux * off * .35;
      const g2 = ctx.createLinearGradient(px - ux * L, py - uy * L, px, py);
      g2.addColorStop(0, `rgba(${col.c2}, 0)`);
      g2.addColorStop(1, `rgba(${col.c2}, ${.75 * k})`);
      ctx.strokeStyle = g2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(px - ux * L, py - uy * L); ctx.lineTo(px, py); ctx.stroke();
    }
    ctx.drawImage(sprite, c.x - 14, c.y - 14, 28, 28);
  }

  /* ── Drawing ── */
  function draw(t, dz) {
    ctx.clearRect(0, 0, W, H);
    const live = moving();
    const cx = W / 2, cy = H / 2, base = col.starA;
    const streak = level === 'full' ? Math.min(Math.abs(dz) * 2.2, 60) : 0;
    ctx.fillStyle = ctx.strokeStyle = `rgb(${col.star})`;
    if (streak > 1.5) { ctx.lineWidth = 1; ctx.lineCap = 'round'; }
    for (let i = 0; i < N; i++) {
      if (live) {
        let z = SZ[i] - dz;
        if (z < 1) { spawn(i, DEPTH - Math.random() * 200); z = SZ[i]; }
        else if (z > DEPTH) { spawn(i, 40 + Math.random() * 300); z = SZ[i]; }
        else SZ[i] = z;
        if (SF[i] < 1) SF[i] = Math.min(1, SF[i] + .03);
      }
      const z = SZ[i], k = FOCAL / z;
      const x = cx + (SX[i] - cam.x) * k, y = cy + (SY[i] - cam.y) * k;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      const depth = 1 - z / DEPTH;
      const tw = live ? .72 + .28 * Math.sin(t * .001 * STS[i] + STW[i]) : 1;
      const a = Math.min(1, depth * 1.5) * tw * SF[i] * base;
      if (a < .03) continue;
      const size = Math.min(3.4, SR[i] * k * 1.6);
      ctx.globalAlpha = a;
      if (streak > 1.5 && depth > .25) {
        const k0 = FOCAL / Math.min(DEPTH, z + streak * 3);
        ctx.beginPath(); ctx.moveTo(cx + (SX[i] - cam.x) * k0, cy + (SY[i] - cam.y) * k0); ctx.lineTo(x, y); ctx.stroke();
      } else if (size > 2.4) {
        ctx.drawImage(sprite, x - size * 1.6, y - size * 1.6, size * 3.2, size * 3.2);
      } else {
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    if (!live || level !== 'full') return;
    if (t > nextComet && !document.hidden) { addComet(); nextComet = t + 6000 + Math.random() * 9000; }
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx; c.y += c.vy; c.life++;
      if (c.x < -c.len || c.y > H + c.len) comets.splice(i, 1); else drawComet(c);
    }
  }

  /* ── Scroll-driven 3D (positions are cached: no layout reads while scrolling) ── */
  let docH = 1, heroTop = 0, heroSpan = 1;
  const sceneBox = new Map();
  function measure() {
    const y = window.scrollY;
    docH = Math.max(1, root.scrollHeight - H);
    if (hero) { heroTop = hero.offsetTop; heroSpan = Math.max(1, hero.offsetHeight - H); }
    for (const s of scenes) { const r = s.getBoundingClientRect(); sceneBox.set(s, { top: r.top + y, h: r.height, cp: NaN }); }
  }
  let lastY = NaN, lastSp = -1, lastP = -1;
  function applyScroll(force) {
    const y = window.scrollY;
    if (!force && y === lastY) return;
    lastY = y;
    const sp = Math.round(Math.min(1, Math.max(0, y / docH)) * 1000) / 1000;
    if (sp !== lastSp) { lastSp = sp; pill.style.setProperty('--sp', sp); }
    if (!moving()) return;
    if (hero) {
      const p = Math.round(Math.min(1, Math.max(0, (y - heroTop) / heroSpan)) * 1000) / 1000;
      if (p !== lastP) { lastP = p; hero.style.setProperty('--p', p); }
    }
    for (const [s, b] of sceneBox) {
      const top = b.top - y;
      if (top + b.h < -H * .5 || top > H * 1.5) continue;
      // -1 when the scene is entering from below, 0 centered, 1 leaving above.
      const cp = Math.round(Math.max(-1.2, Math.min(1.2, -(top + b.h / 2 - H / 2) / (H / 2 + b.h / 2))) * 1000) / 1000;
      if (cp === b.cp) continue;
      b.cp = cp;
      s.style.setProperty('--cp', cp);
      s.style.setProperty('--cpa', Math.abs(cp));
    }
  }
  function clearScrollVars() {
    if (hero) hero.style.removeProperty('--p');
    for (const [s, b] of sceneBox) { s.style.removeProperty('--cp'); s.style.removeProperty('--cpa'); b.cp = NaN; }
    lastP = -1;
  }

  /* HUD tucks away while scrolling down, comes back on the way up or near the top edge. */
  let hudY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY, d = y - hudY;
    if (Math.abs(d) < 6) return;
    hud.classList.toggle('tucked', d > 0 && y > H * .5);
    hudY = y;
  }, { passive: true });
  hud.addEventListener('focusin', () => hud.classList.remove('tucked'));

  /* ── Visibility: pause CSS loops and skip tilt work for anything off-screen ── */
  const visible = new Set();
  const vis = new IntersectionObserver(entries => entries.forEach(e => {
    e.target.classList.toggle('is-off', !e.isIntersecting);
    if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
  }), { rootMargin: '10% 0px' });
  [hero, ...scenes, ...$$('[data-tilt]')].forEach(el => el && vis.observe(el));

  /* ── Pointer tilt ([data-tilt] follows the pointer over it, [data-tilt="screen"] the whole screen) ── */
  const tilts = new Map();
  const mouse = { nx: 0, ny: 0 };
  let hoverEl = null;
  const tiltOf = el => { let t = tilts.get(el); if (!t) { t = { x: 0, y: 0, tx: 0, ty: 0, gx: 30, gy: 20, screen: el.dataset.tilt === 'screen' }; tilts.set(el, t); } return t; };
  $$('[data-tilt]').forEach(tiltOf);
  if (finePointer.matches) {
    window.addEventListener('pointermove', e => {
      if (e.clientY < 90) hud.classList.remove('tucked');
      if (level !== 'full') return;
      mouse.nx = e.clientX / W * 2 - 1; mouse.ny = e.clientY / H * 2 - 1;
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
    document.addEventListener('pointerleave', () => { if (hoverEl) { const t = tiltOf(hoverEl); t.tx = 0; t.ty = 0; hoverEl = null; } mouse.nx = mouse.ny = cam.tx = cam.ty = 0; });
  }
  function updateTilts() {
    for (const [el, t] of tilts) {
      if (!visible.has(el)) continue;
      if (t.screen) { t.tx = -mouse.ny * 9; t.ty = mouse.nx * 12; t.gx = 50 + mouse.nx * 40; t.gy = 40 + mouse.ny * 40; }
      const dx = t.tx - t.x, dy = t.ty - t.y;
      if (Math.abs(dx) < .02 && Math.abs(dy) < .02) continue;
      t.x += dx * .1; t.y += dy * .1;
      el.style.setProperty('--tx', t.x.toFixed(2) + 'deg');
      el.style.setProperty('--ty', t.y.toFixed(2) + 'deg');
      el.style.setProperty('--gx', t.gx.toFixed(1) + '%');
      el.style.setProperty('--gy', t.gy.toFixed(1) + '%');
    }
  }
  function resetTilts() {
    for (const [el, t] of tilts) { t.x = t.y = t.tx = t.ty = 0; ['--tx', '--ty', '--gx', '--gy'].forEach(p => el.style.removeProperty(p)); }
    cam.x = cam.y = cam.tx = cam.ty = 0;
  }

  /* ── Loop ── */
  let prevY = window.scrollY, vel = 0, raf = 0, odd = false, paused = false;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const y = window.scrollY;
    vel += ((y - prevY) - vel) * .2;
    prevY = y;
    applyScroll();
    if (level === 'lite' && (odd = !odd)) return; // 30 fps sky in "Ligeros"
    cam.x += (cam.tx - cam.x) * .05; cam.y += (cam.ty - cam.y) * .05;
    if (level === 'full') updateTilts();
    draw(t, Math.max(-60, Math.min(60, .35 + vel * (level === 'lite' ? .5 : .9))));
  }
  function start() { if (!raf && moving() && !paused && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  // The full-screen menu covers the sky: no need to keep painting it underneath.
  new MutationObserver(() => {
    paused = document.body.classList.contains('nav-open');
    if (paused) setTimeout(() => { if (paused) stop(); }, 850); else start();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 150); });
  window.addEventListener('load', () => { measure(); applyScroll(true); });
  if (window.ResizeObserver) { let mo; new ResizeObserver(() => { clearTimeout(mo); mo = setTimeout(() => { measure(); applyScroll(true); }, 100); }).observe($('.main')); }
  window.addEventListener('scroll', () => { if (!raf) applyScroll(); }, { passive: true });
  document.addEventListener('palettechange', () => { readColors(); if (!raf) draw(0, 0); });

  /* ── Scroll reveal: every tool block rises into place in 3D the first time it shows up ── */
  let io = null;
  function enableReveals() {
    if (io || !('IntersectionObserver' in window)) return;
    $$('.section > *').forEach(el => el.classList.add('rv'));
    root.classList.add('fx-on');
    io = new IntersectionObserver(entries => {
      const shown = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      shown.forEach((e, i) => {
        const el = e.target, d = Math.min(i, 5) * 80;
        io.unobserve(el);
        el.style.setProperty('--rd', d + 'ms');
        el.classList.add('in');
        // Hand the element back to its own transitions once it has landed.
        setTimeout(() => { el.classList.remove('rv', 'in'); el.style.removeProperty('--rd'); }, 1250 + d);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }
  function disableReveals() {
    if (io) { io.disconnect(); io = null; }
    root.classList.remove('fx-on');
    $$('.rv').forEach(el => el.classList.remove('rv', 'in'));
  }

  /* ── Effects level ── */
  function setLevel(l, save) {
    if (!FX_LEVELS.includes(l)) l = 'full';
    const was = level;
    level = l;
    if (save) store.setRaw('mybt-fx', l);
    root.classList.toggle('fx-still', l === 'off');
    root.classList.toggle('fx-lite', l === 'lite');
    if (l === 'off') { stop(); disableReveals(); clearScrollVars(); resetTilts(); comets.length = 0; }
    if (l === 'lite') { resetTilts(); comets.length = 0; }
    if ((l === 'lite') !== (was === 'lite') || l === 'off' || was === 'off') buildStars();
    requestAnimationFrame(() => { measure(); applyScroll(true); if (!moving()) draw(0, 0); });
    start();
    document.dispatchEvent(new CustomEvent('fxchange', { detail: l }));
  }

  /* ── Click ripple: a quick pulse from where you press ── */
  const RIPPLE = '.btn, .btn-cine, .ch-tool, .side-btn, .hud-menu, .hud-gear, .hud-brand, .seg, .chip, .add-row, .pal, .jcard, .icon-btn';
  document.addEventListener('pointerdown', e => {
    if (level === 'off' || e.button !== 0) return;
    const b = e.target.closest(RIPPLE);
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect();
    b.classList.add('has-ripple');
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.left = (e.clientX - r.left) + 'px';
    s.style.top = (e.clientY - r.top) + 'px';
    s.style.setProperty('--rs', Math.ceil(Math.hypot(r.width, r.height) / 4));
    b.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }, { passive: true });

  /* ── Boot ── */
  const saved = store.getRaw('mybt-fx');
  level = FX_LEVELS.includes(saved) ? saved : (reducedMotion() ? 'off' : 'full');
  root.classList.toggle('fx-still', level === 'off');
  root.classList.toggle('fx-lite', level === 'lite');
  readColors();
  resize();
  if (level !== 'off') enableReveals();
  start();

  return { setLevel, get level() { return level; } };
})();
