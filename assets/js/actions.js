'use strict';
/* ═══════════ Cross-tool actions (copy, reset, add…) and keyboard shortcuts ═══════════ */

/** Plain-text summary of a calculator, used by "Copiar" / Alt+C. */
function summaryText(key) {
  if (key === 'plan') {
    const f = calcPlan();
    if (f === null) return null;
    return `Inicio: ${fDate(parseD(S.plan.start))}\nFecha + año: ${$('#tk-year').textContent}\nFecha final: ${fDate(f)}`;
  }
  if (key === 'cat') { const t = $('#q-v').textContent; return t === '—' ? null : `${$('#q-note').textContent}: ${t}`; }
  const lines = S[key].map(r => {
    const c = rowCalc(key, r);
    if (!c) return null;
    if (key === 'range') return `${fDate(c.a)} – ${fDate(c.b)}: ${plural(c.days, 'día')}`;
    const tag = r.pv2 ? ` (${r.pv2})` : '';
    return `${fDate(c.a)} – ${fDate(c.b)} (${plural(c.days, 'día')}): ${pesos(r.v1 || 0)} → ${pesos(r.v2 || 0)}${tag} = ${pesos(c.t)}`;
  }).filter(Boolean);
  if (!lines.length) return null;
  return lines.join('\n') + (lines.length > 1 ? `\nTotal: ${$('#total-' + key).textContent}` : '');
}

function copyCurrent(btn) {
  const sec = curSec(), key = SEC2KEY[sec], el = document.activeElement;
  if (key) {
    const t = summaryText(key);
    if (!t) { toast('No hay resultados para copiar', 'info'); return; }
    copyText(t, btn || $(`#sec-${sec} [data-act="copy"]`), 'Resultado copiado');
    return;
  }
  if (sec === 'plantillas') { Tpl.copyFocused(); return; }
  const card = el && el.closest && el.closest('.section.active .card, .section.active .pt-item');
  const scope = card || $('#sec-' + sec);
  const b = $('.copy-btn, .pt-copy', scope);
  if (b && (card || sec !== 'pqr')) { b.click(); return; }
  const hero = $('.calc-result.visible .calc-stat.hero .calc-stat-value', scope);
  if (hero) { copyText(hero.textContent.trim(), $('[data-act="copyhero"]', scope), 'Valor copiado'); return; }
  toast(sec === 'pqr' ? 'Enfoca una respuesta o escribe en el buscador y pulsa Enter' : 'Primero llena los campos', 'info');
}

/** Resets every input in `scope` to its default value and re-runs its listeners. */
function clearScope(scope) {
  $$('input, select', scope).forEach(i => {
    if (i.type === 'search') return;
    if (i.tagName === 'SELECT') i.selectedIndex = 0; else i.value = i.defaultValue;
    delete i.dataset.plan;
    i.dispatchEvent(new Event('input', { bubbles: true }));
  });
  $$('.plan-tag', scope).forEach(t => { t.textContent = ''; });
}

async function resetCurrent() {
  const sec = curSec(), key = SEC2KEY[sec];
  if (key === 'cat') {
    const ok = await confirmDialog({
      title: '¿Restablecer la tabla de valores?',
      message: 'Se volverá a los precios de julio 2026 y se perderán los cambios que hiciste.',
      confirmLabel: 'Restablecer'
    });
    if (!ok) return;
    S.cat = clone(DEFAULTS.cat); save(); renderCat(); toast('Tabla restablecida');
    return;
  }
  if (key) {
    S[key] = clone(DEFAULTS[key]); save();
    if (key === 'plan') { fillPlan(); calcPlan(); } else renderRows(key);
    toast('Limpio');
    const f = $(`#sec-${sec} input`); if (f) f.focus();
    return;
  }
  if (sec === 'plantillas') { Tpl.resetView(); toast('Filtros limpios', 'info'); return; }
  if (sec === 'pqr') { $('#pqrSearch').value = ''; filtrarPqr(); toast('Búsqueda limpia', 'info'); return; }
  const el = document.activeElement, card = el && el.closest && el.closest('.section.active .card');
  const scope = card || $('#sec-' + sec);
  clearScope(scope);
  toast(card ? 'Tarjeta limpia' : 'Herramienta limpia');
  const f = $('input:not([type=search])', scope); if (f) f.focus();
}

function openHelp() { openDialog($('#help')); }

/* ── Click actions ([data-act]) ── */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act, key = SEC2KEY[curSec()];
  if (a === 'copy') copyCurrent(b);
  else if (a === 'copyout') copyOutput(b);
  else if (a === 'reset') { if (b.closest('.card')) b.closest('.card').querySelector('input,select')?.focus(); resetCurrent(); }
  else if (a === 'add' && key) addRow(key);
  else if (a === 'catadd') catAdd(b.dataset.g);
  else if (a === 'copytotal') { const t = $('#total-' + key).textContent; if (t === '—') toast('No hay total para copiar', 'info'); else copyText(t, b, 'Valor copiado'); }
  else if (a === 'copyhero') { const h = $('.calc-result.visible .calc-stat.hero .calc-stat-value', b.closest('.card')); if (h) copyText(h.textContent.trim(), b, 'Valor copiado'); else toast('Primero llena los campos', 'info'); }
  else if (a === 'clearcard') { clearScope(b.closest('.card')); toast('Tarjeta limpia'); }
  else if (a === 'theme') toggleTheme();
  else if (a === 'help') openHelp();
});

/* ── Keyboard ── */
const isTyping = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

function dateFieldKeys(e, el) {
  const k = e.key;
  if (k === 'h' || k === 'H') {
    e.preventDefault();
    el.value = isoD(todayD()); el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  const plus = k === '+' || e.code === 'NumpadAdd' || (e.shiftKey && e.code === 'Equal');
  const minus = k === '-' || k === '−' || k === '_' || e.code === 'NumpadSubtract' || (e.shiftKey && e.code === 'Minus');
  if (!plus && !minus) return false;
  e.preventDefault();
  let t = parseD(el.value); if (t === null) t = todayD();
  const d = plus ? 1 : -1;
  t = e.shiftKey ? edate(t, d) : t + d * MS;
  el.value = isoD(t); el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

/** Enter moves to the next field; at the end it adds a row or focuses the copy button. */
function enterAdvance(e, el) {
  e.preventDefault();
  const sec = curSec(), key = SEC2KEY[sec];
  const panel = el.closest('[data-gpanel]');
  const scope = panel || el.closest('.card') || $('#sec-' + sec);
  const list = $$('input:not([type=search])', scope).filter(i => i.offsetParent !== null), i = list.indexOf(el);
  if (e.shiftKey) { if (i > 0) list[i - 1].focus(); return; }
  if (i < list.length - 1) list[i + 1].focus();
  else if (panel) catAdd(panel.dataset.gpanel);
  else if (key && key !== 'plan' && key !== 'cat') addRow(key);
  else { const out = $('.copy-btn', scope); if (out) out.focus(); }
}

function altShortcuts(e, el) {
  const c = e.code, m = c.match(/^(?:Digit|Numpad)([1-9])$/);
  const sec = curSec(), key = SEC2KEY[sec];
  if (m) { e.preventDefault(); const id = navOrder()[m[1] - 1]; if (id) goTo(id, true); return; }
  if (c === 'ArrowDown' || c === 'ArrowUp') {
    e.preventDefault();
    const o = navOrder(), i = o.indexOf(sec);
    goTo(o[(i + (c === 'ArrowDown' ? 1 : -1) + o.length) % o.length], true);
    return;
  }
  if (c === 'KeyC') { e.preventDefault(); copyCurrent(); return; }
  if (c === 'KeyR') { e.preventDefault(); resetCurrent(); return; }
  if (c === 'KeyT') { e.preventDefault(); toggleTheme(); return; }
  if (c === 'KeyN') {
    e.preventDefault();
    if (sec === 'plantillas') Tpl.openEditor();
    else if (key === 'cat') { const pn = el && el.closest && el.closest('[data-gpanel]'); catAdd(pn ? pn.dataset.gpanel : $('#q-g').value); }
    else if (key && key !== 'plan') addRow(key);
    else toast('Esta herramienta no usa filas', 'info');
    return;
  }
  if (c === 'KeyP') {
    e.preventDefault();
    const row = el && el.closest && el.closest('.row');
    if (GROUPS[key]) {
      const rows = $$('#rows-' + key + ' .row'), target = row || rows[rows.length - 1];
      if (!target) { toast('Añade un periodo primero', 'info'); return; }
      const f = el && el.dataset && (el.dataset.f === 'v1' || el.dataset.f === 'v2') ? el.dataset.f : 'v2';
      rowPick(key, Number(target.dataset.i), f);
      return;
    }
    const fieldBtn = (el && el.closest && el.closest('.field') && el.closest('.field').querySelector('[data-pick-for]')) || $(`#sec-${sec} [data-pick-for]`);
    if (fieldBtn) fieldPick(fieldBtn); else toast('Elegir plan funciona en las calculadoras', 'info');
    return;
  }
  if (c === 'Delete' || c === 'Backspace') {
    const row = el && el.closest && el.closest('.row'), crow = el && el.closest && el.closest('.cat-row');
    if (row) { e.preventDefault(); delRow(key, Number(row.dataset.i)); }
    else if (crow) { e.preventDefault(); catDel(crow.dataset.g, Number(crow.dataset.i)); }
  }
}

document.addEventListener('keydown', e => {
  const el = document.activeElement;

  // Modal layers first.
  if (picker.open) { if (!isClosing(picker)) pickerKeys(e); return; }
  const help = $('#help');
  if (help.open) { if (e.key === '?') { e.preventDefault(); closeDialog(help); } return; }
  if ($('dialog[open]')) { Tpl.dialogKeys(e); return; }
  if (Menus.keys(e)) return;

  if (el && el.type === 'date' && !e.altKey && !e.ctrlKey && !e.metaKey && dateFieldKeys(e, el)) return;

  if (e.key === 'Enter' && el && el.tagName === 'INPUT' && el.type !== 'search' && !e.altKey && !e.ctrlKey && !e.metaKey && el.closest('.section.active')) {
    enterAdvance(e, el);
    return;
  }

  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); focusNavSearch(); return; }

  if (e.altKey && !e.ctrlKey && !e.metaKey) { altShortcuts(e, el); if (e.defaultPrevented) return; }
  if (e.key === 'Alt') document.body.classList.add('keys-hint');

  if (!isTyping(el) && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === '/') { e.preventDefault(); focusNavSearch(); return; }
    if (e.key === '?') { e.preventDefault(); openHelp(); return; }
  }
  if (e.key === 'Escape') closeNav();
});
document.addEventListener('keyup', e => { if (e.key === 'Alt') document.body.classList.remove('keys-hint'); });
window.addEventListener('blur', () => document.body.classList.remove('keys-hint'));
