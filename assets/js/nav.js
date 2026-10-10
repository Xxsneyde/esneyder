'use strict';
/* ═══════════ Navigation: one scrolling page, scroll-spy and the collapsible menu ═══════════
   Every tool lives on the same long page. The "current" tool (.section.active) is the one
   crossing the middle of the screen, or the one you are typing in. The menu is a full-screen
   overlay that opens from the floating pill and jumps straight to any tool. */

const DEFAULT_SEC = 'incap';
const TITLES = {};
$$('.nav-item').forEach(b => { TITLES[b.dataset.sec] = b.title = $('.nav-text', b).textContent.trim(); });

const curSec = () => { const a = $('.section.active'); return a ? a.id.slice(4) : null; };
const visibleNavItems = () => $$('.nav-item').filter(b => !b.hidden && !b.closest('.nav-group').hidden);
const navOrder = () => visibleNavItems().map(b => b.dataset.sec);
const scrollBehavior = () => (reducedMotion() ? 'auto' : 'smooth');
// Only move the cursor into a field on desktop: on phones it would pop the keyboard.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

/** Marks `id` as the current tool (menu highlight, HUD label, title). Does not scroll. */
function markSec(id, remember) {
  const sec = document.getElementById('sec-' + id);
  if (!sec) return;
  if (remember) store.setRaw('mybt-last', id);
  const prev = $('.section.active');
  if (prev === sec) return;
  if (prev) prev.classList.remove('active');
  sec.classList.add('active');
  $$('.nav-item').forEach(b => {
    const on = b.dataset.sec === id;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current');
  });
  $('#topbarTitle').textContent = TITLES[id] || '';
  document.title = `${TITLES[id] || 'Herramientas'} · MYBT`;
  document.dispatchEvent(new CustomEvent('sectionchange', { detail: id }));
}

/* While a jump is scrolling, the scroll-spy waits so the menu does not flicker through every tool. */
let jumping = 0;
function holdSpy() {
  clearTimeout(jumping);
  jumping = setTimeout(() => { jumping = 0; }, reducedMotion() ? 60 : 1500);
}
if ('onscrollend' in window) window.addEventListener('scrollend', () => { if (jumping) { clearTimeout(jumping); jumping = 0; } });

function setHash(id) {
  const url = id ? '#' + id : location.pathname + location.search;
  if ((id ? '#' + id : '') !== location.hash) history.replaceState(null, '', url);
}

/** Scrolls to a tool. `focus` puts the cursor in its first field; `instant` skips the smooth scroll. */
function goTo(id, focus, instant) {
  const sec = document.getElementById('sec-' + id);
  if (!sec) return;
  markSec(id, true);
  holdSpy();
  setHash(id);
  const fromMenu = document.body.classList.contains('nav-open');
  closeNav(false);
  sec.scrollIntoView({ behavior: instant ? 'auto' : scrollBehavior(), block: 'start' });
  const f = focus && sec.querySelector('[data-autofocus], input:not([type=search]), select');
  if (f) f.focus({ preventScroll: true });
  else if (fromMenu) { sec.tabIndex = -1; sec.focus({ preventScroll: true }); }
}

/** Scrolls to a non-tool landmark: 'top', a chapter id ('ch-…') or any element id. */
function goToScene(target) {
  closeNav(false);
  if (target === 'top') { setHash(''); window.scrollTo({ top: 0, behavior: scrollBehavior() }); return; }
  const el = document.getElementById(target);
  if (el) el.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
}

document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (!g) return;
  e.preventDefault();
  const to = g.dataset.go;
  if (document.getElementById('sec-' + to)) goTo(to, finePointer.matches);
  else goToScene(to);
});

/* ── Scroll-spy: the tool crossing the middle band of the screen becomes current ── */
const spy = new IntersectionObserver(entries => {
  if (jumping) return;
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const t = en.target;
    if (t.matches('[data-hero]')) { setHash(''); return; }
    const id = t.id.slice(4);
    markSec(id);
    setHash(id);
  });
}, { rootMargin: '-42% 0px -52% 0px' });
$$('.section, [data-hero]').forEach(s => spy.observe(s));

// Typing in a tool makes it the current one (Alt shortcuts act on it).
document.addEventListener('focusin', e => {
  const s = e.target.closest && e.target.closest('.section');
  if (s) markSec(s.id.slice(4), true);
});

/* ── Collapsible menu ── */
function setNav(open, restoreFocus) {
  const body = document.body, nav = $('#sidebar'), btn = $('#menuBtn');
  if (body.classList.contains('nav-open') === open) return;
  if (open) {
    // The overlay grows out of the pill.
    const r = btn.getBoundingClientRect();
    nav.style.setProperty('--ox', `${r.left + r.width - 22}px`);
    nav.style.setProperty('--oy', `${r.top + r.height / 2}px`);
    nav.scrollTop = 0;
  }
  body.classList.toggle('nav-open', open);
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  nav.inert = !open;
  $('.main').inert = open;
  if (open) {
    if (finePointer.matches) $('#navSearch').focus({ preventScroll: true });
    else ($('.nav-item.active') || $('.nav-item')).focus({ preventScroll: true });
  } else if (restoreFocus && (nav.contains(document.activeElement) || document.activeElement === document.body)) {
    btn.focus({ preventScroll: true });
  }
}
const openNav = () => setNav(true);
const closeNav = (restoreFocus = true) => setNav(false, restoreFocus);
$('#menuBtn').addEventListener('click', () => setNav(!document.body.classList.contains('nav-open'), true));
// Clicking the empty backdrop of the overlay closes it.
$('#sidebar').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.classList.contains('mo-inner')) closeNav(); });

/* ── Menu search & keyboard ── */
function filtrarNav() {
  const q = norm($('#navSearch').value);
  let total = 0;
  $$('.nav-group').forEach(g => {
    let n = 0;
    const groupHit = norm($('.nav-label', g).textContent).includes(q);
    $$('.nav-item', g).forEach(b => { const ok = !q || groupHit || norm($('.nav-text', b).textContent).includes(q); b.hidden = !ok; if (ok) n++; });
    g.hidden = n === 0;
    total += n;
  });
  $('#navEmpty').style.display = total ? 'none' : 'block';
}

/** Shows Alt+1…9 hints on the first nine visible tools. */
function numberNav() {
  $$('.nav-kbd').forEach(k => k.remove());
  navOrder().slice(0, 9).forEach((id, i) => {
    const k = document.createElement('kbd');
    k.className = 'nav-kbd'; k.textContent = i + 1; k.title = 'Alt + ' + (i + 1);
    $(`.nav-item[data-sec="${id}"]`).appendChild(k);
  });
}

$('#nav').addEventListener('click', e => { const b = e.target.closest('.nav-item'); if (b) goTo(b.dataset.sec, finePointer.matches); });
$('#navSearch').addEventListener('input', () => { filtrarNav(); numberNav(); });
$('#navSearch').addEventListener('keydown', e => {
  const input = e.target;
  if (e.key === 'Enter') {
    e.preventDefault();
    const first = navOrder()[0];
    if (first) { input.value = ''; filtrarNav(); numberNav(); goTo(first, true); }
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); const f = visibleNavItems()[0]; if (f) f.focus(); }
  if (e.key === 'Escape') {
    if (input.value) { e.preventDefault(); e.stopPropagation(); input.value = ''; filtrarNav(); numberNav(); }
  }
});
$('#nav').addEventListener('keydown', e => {
  if (!e.target.classList.contains('nav-item') || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  e.preventDefault();
  const items = visibleNavItems(), i = items.indexOf(e.target);
  const next = items[i + (e.key === 'ArrowDown' ? 1 : -1)];
  if (next) next.focus(); else if (e.key === 'ArrowUp') $('#navSearch').focus();
});

function focusNavSearch() {
  openNav();
  $('#navSearch').focus();
  $('#navSearch').select();
}
