'use strict';
/* ═══════════ Navigation: sections, sidebar search, mobile drawer ═══════════ */

const DEFAULT_SEC = 'incap';
const TITLES = {};
$$('.nav-item').forEach(b => { TITLES[b.dataset.sec] = b.title = $('.nav-text', b).textContent.trim(); });

const curSec = () => { const a = $('.section.active'); return a ? a.id.slice(4) : null; };
const visibleNavItems = () => $$('.nav-item').filter(b => !b.hidden && !b.closest('.nav-group').hidden);
const navOrder = () => visibleNavItems().map(b => b.dataset.sec);

function goTo(id, focus) {
  const sec = document.getElementById('sec-' + id);
  if (!sec) return;
  const prev = $('.section.active');
  if (prev !== sec) {
    if (prev) prev.classList.remove('active');
    sec.classList.add('active');
    document.dispatchEvent(new CustomEvent('sectionchange', { detail: id }));
  }
  $$('.nav-item').forEach(b => {
    const on = b.dataset.sec === id;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $('#topbarTitle').textContent = TITLES[id] || '';
  document.title = `${TITLES[id] || 'Herramientas'} · MYBT`;
  closeNav();
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  window.scrollTo({ top: 0 });
  store.setRaw('mybt-last', id);
  if (focus) {
    const f = sec.querySelector('[data-autofocus], input:not([type=search]), select');
    if (f) f.focus({ preventScroll: true });
  }
}

/* ── Mobile drawer ── */
function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  $('#menuBtn').setAttribute('aria-expanded', String(open));
}
const openNav = () => setNav(true);
const closeNav = () => { if (document.body.classList.contains('nav-open')) setNav(false); };
$('#menuBtn').addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
$('#scrim').addEventListener('click', closeNav);

/* ── Sidebar search & keyboard ── */
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

$('#nav').addEventListener('click', e => { const b = e.target.closest('.nav-item'); if (b) goTo(b.dataset.sec); });
$('#navSearch').addEventListener('input', () => { filtrarNav(); numberNav(); });
$('#navSearch').addEventListener('keydown', e => {
  const input = e.target;
  if (e.key === 'Enter') {
    e.preventDefault();
    const first = navOrder()[0];
    if (first) { input.value = ''; filtrarNav(); numberNav(); input.blur(); goTo(first, true); }
  }
  if (e.key === 'ArrowDown') { e.preventDefault(); const f = visibleNavItems()[0]; if (f) f.focus(); }
  if (e.key === 'Escape') { input.value = ''; filtrarNav(); numberNav(); input.blur(); }
});
$('#nav').addEventListener('keydown', e => {
  if (!e.target.classList.contains('nav-item') || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  e.preventDefault();
  const items = visibleNavItems(), i = items.indexOf(e.target);
  const next = items[i + (e.key === 'ArrowDown' ? 1 : -1)];
  if (next) next.focus(); else if (e.key === 'ArrowUp') $('#navSearch').focus();
});

function focusNavSearch() {
  if (window.innerWidth <= 900) openNav();
  $('#navSearch').focus();
  $('#navSearch').select();
}
