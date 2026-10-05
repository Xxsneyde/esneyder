'use strict';
/* ═══════════ Shared UI: toast, clipboard, dialogs, confirmation, theme, menus ═══════════ */

/* ── Toast ── */
const TOAST_ICONS = { success: 'check', info: 'info', error: 'alert' };
function toast(msg, kind = 'success') {
  const t = $('#toast');
  t.dataset.kind = kind;
  t.innerHTML = icon(TOAST_ICONS[kind] || 'info') + `<span>${esc(msg)}</span>`;
  t.classList.remove('show');
  void t.offsetWidth; // restart the entrance transition on rapid toasts
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ── Clipboard ── */
function fallbackCopy(txt) {
  const ta = document.createElement('textarea');
  ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
  ta.remove();
  return ok;
}
function writeClip(txt) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).catch(() => { if (!fallbackCopy(txt)) throw new Error('copy'); });
  return fallbackCopy(txt) ? Promise.resolve() : Promise.reject(new Error('copy'));
}
/** Briefly turns a button into a "Copiado" confirmation. */
function flash(btn) {
  if (!btn) return;
  if (!btn.dataset.html) btn.dataset.html = btn.innerHTML;
  btn.classList.add('copied');
  btn.innerHTML = icon('check') + '<span>Copiado</span>';
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = btn.dataset.html; }, 1600);
}
function copyText(txt, btn, msg) {
  return writeClip(txt).then(() => { flash(btn); toast(msg || 'Copiado'); return true; }, () => { toast('No se pudo copiar', 'error'); return false; });
}

/* ── Dialogs (animated open/close on top of <dialog>) ── */
const CLOSE_MS = 190;
const isClosing = d => d.classList.contains('is-closing');

function openDialog(d) {
  if (d.open) return;
  d.returnValue = '';
  d.classList.remove('is-closing');
  d.showModal();
}
function closeDialog(d, value) {
  if (!d.open) return Promise.resolve();
  if (d._closing) return d._closing;
  const finish = () => {
    d.classList.remove('is-closing');
    d._closing = null;
    if (d.open) value === undefined ? d.close() : d.close(value);
  };
  if (reducedMotion()) { finish(); return Promise.resolve(); }
  d.classList.add('is-closing');
  d._closing = new Promise(res => setTimeout(() => { finish(); res(); }, CLOSE_MS));
  return d._closing;
}
/** Dialogs may register `_onRequestClose` to intercept closing (e.g. unsaved changes). */
function requestClose(d) { return d._onRequestClose ? d._onRequestClose() : closeDialog(d); }

// Esc → animated close (the native `cancel` event does not bubble, so listen in capture).
document.addEventListener('cancel', e => {
  if (e.target.tagName !== 'DIALOG') return;
  e.preventDefault();
  requestClose(e.target);
}, true);

// [data-close] buttons and clicks on the backdrop (the <dialog> element itself).
let pointerDownTarget = null;
document.addEventListener('pointerdown', e => { pointerDownTarget = e.target; }, true);
document.addEventListener('click', e => {
  const closer = e.target.closest('[data-close]');
  if (closer) { const d = closer.closest('dialog'); if (d) requestClose(d); return; }
  if (e.target.tagName === 'DIALOG' && e.target.open && pointerDownTarget === e.target) requestClose(e.target);
});

/* ── Confirmation dialog ── */
function confirmDialog({ title, message = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'danger' }) {
  const d = $('#confirmDlg'), ok = $('#confirmOk');
  $('#confirmTitle').textContent = title;
  $('#confirmMsg').textContent = message;
  $('#confirmMsg').hidden = !message;
  $('#confirmCancel').textContent = cancelLabel;
  ok.textContent = confirmLabel;
  ok.className = 'btn ' + (tone === 'danger' ? 'btn-danger' : 'btn-primary');
  d.dataset.tone = tone;
  openDialog(d);
  $('#confirmCancel').focus(); // safest default for destructive actions
  return new Promise(res => d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true }));
}
$('#confirmOk').addEventListener('click', () => closeDialog($('#confirmDlg'), 'ok'));

/* ── Theme ── */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  $$('[data-theme-label]').forEach(el => { el.textContent = t === 'light' ? 'Oscuro' : 'Claro'; });
  $$('[data-theme-icon]').forEach(u => u.setAttribute('href', t === 'light' ? '#i-moon' : '#i-sun'));
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = t === 'light' ? '#F6F6F4' : '#0E0E10';
  store.setRaw('mybt-theme', t);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  setTheme(next);
  toast(next === 'light' ? 'Tema claro' : 'Tema oscuro', 'info');
}

/* ── Dropdown menus ── */
const Menus = {
  toggleOf: m => $(`[aria-controls="${m.id}"]`),
  close(m) { m.classList.remove('open'); const b = Menus.toggleOf(m); if (b) b.setAttribute('aria-expanded', 'false'); },
  closeAll() { $$('.menu.open').forEach(Menus.close); },
  toggle(btn) {
    const m = document.getElementById(btn.getAttribute('aria-controls'));
    const opening = !m.classList.contains('open');
    Menus.closeAll();
    if (!opening) return;
    m.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    const first = $('.menu-item', m);
    if (first) first.focus({ preventScroll: true });
  },
  keys(e) {
    const m = $('.menu.open'); if (!m) return false;
    if (e.key === 'Escape') { e.preventDefault(); Menus.close(m); Menus.toggleOf(m)?.focus(); return true; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = $$('.menu-item', m), i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      return true;
    }
    if (e.key === 'Tab') Menus.close(m);
    return false;
  }
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-menu-toggle]');
  if (t) { Menus.toggle(t); return; }
  if (!e.target.closest('.menu') || e.target.closest('.menu-item')) Menus.closeAll();
});
