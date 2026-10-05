'use strict';
/* ═══════════ Calculators with persisted state:
   plan end date, days between dates, plan-change prorations, price table and plan picker ═══════════ */

const GROUPS = { mes: 'Mensual', tri: 'Trimestral', anio: 'Anual' };
const BASE = { mes: 30, tri: 30, anio: 365 };
const DIV = { mes: 1, tri: 3, anio: 1 };
const CATEGORIAS = ['PLATINO', 'ONE PLUS', 'ONE', 'PREMIUM', 'CLASSIC', 'SUPER'];
const seed = map => Object.entries(map).flatMap(([y, vals]) => CATEGORIAS.map((c, i) => ({ y, c, v: vals[i] || 0 })));
const CAT_VERSION = 3;
const DEFAULTS = {
  plan: { start: '', years: 1, months: 0, days: 0 },
  range: [{ a: '', b: '' }],
  mes: [{ a: '', b: '', v1: 0, v2: 0 }],
  tri: [{ a: '', b: '', v1: 0, v2: 0 }],
  anio: [{ a: '', b: '', v1: 0, v2: 0 }],
  cat: {
    // Ayudaventas julio 2026 · orden: PLATINO, ONE PLUS, ONE, PREMIUM, CLASSIC, SUPER
    mes: seed({
      'Débito Estudiante':      [276250, 199750, 165750, 148750, 131750, 114750],
      'Débito Naranja':         [227500, 164500, 136500, 122500, 108500, 94500],
      'Débito con Permanencia': [325000, 235000, 195000, 175000, 155000, 135000],
      'Débito sin Permanencia': [405000, 295000, 245000, 220000, 195000, 170000]
    }),
    tri: seed({
      'Trimestre con Permanencia': [877500, 634500, 526500, 472500, 418500, 364500],
      'Trimestre sin Permanencia': [1093500, 796500, 661500, 594000, 526500, 459000]
    }),
    anio: seed({
      'Año Renovado':     [2925000, 2115000, 1755000, 1575000, 1395000, 1215000],
      'Año Estudiante':   [2765000, 2000000, 1660000, 1490000, 1320000, 1150000],
      'Año Hora Naranja': [2275000, 1645000, 1365000, 1225000, 1085000, 945000]
    })
  }
};
const clone = o => JSON.parse(JSON.stringify(o));

let S = clone(DEFAULTS);
{
  const saved = store.get('mybt-calc', null);
  if (saved && saved.plan) {
    S = Object.assign(clone(DEFAULTS), saved);
    if (saved.catV !== CAT_VERSION) S.cat = clone(DEFAULTS.cat);
  }
  S.catV = CAT_VERSION;
}
const save = () => store.set('mybt-calc', S);
const SEC2KEY = { fecha_final: 'plan', dias: 'range', calc_mes: 'mes', calc_tri: 'tri', calc_anio: 'anio', valores: 'cat' };

/* ── Fecha final del plan ── */
function fillPlan() { $('#p-start').value = S.plan.start; $('#p-years').value = S.plan.years; $('#p-months').value = S.plan.months; $('#p-days').value = S.plan.days; }
let lastFinal = null;
function calcPlan() {
  const p = S.plan, start = parseD(p.start), tk = $('#ticket');
  if (start === null) {
    tk.classList.add('empty'); lastFinal = null;
    $('#tk-week').textContent = ''; $('#tk-day').textContent = '—'; $('#tk-month').textContent = 'Escribe la fecha de inicio';
    $('#tk-year').textContent = '—'; $('#tk-total').textContent = '—';
    $('#trail').innerHTML = '<li><span class="what">Falta la fecha de inicio<em>Pulsa H en el campo para poner hoy</em></span><span></span></li>';
    return null;
  }
  tk.classList.remove('empty');
  const y = Number(p.years) || 0, m = Number(p.months) || 0, d = Number(p.days) || 0;
  const plusYear = start + 365 * y * MS, plusMonths = edate(plusYear, m), final = plusMonths + d * MS;
  $('#tk-week').textContent = fPart(final, { weekday: 'long' });
  const dayEl = $('#tk-day');
  dayEl.textContent = fPart(final, { day: 'numeric' });
  if (lastFinal !== null && lastFinal !== final) { dayEl.classList.remove('pop'); void dayEl.offsetWidth; dayEl.classList.add('pop'); }
  lastFinal = final;
  const mt = fPart(final, { month: 'long', year: 'numeric' });
  $('#tk-month').textContent = mt.charAt(0).toUpperCase() + mt.slice(1);
  $('#tk-year').textContent = fDate(plusYear);
  $('#tk-total').textContent = plural(daysBetween(start, final), 'día');
  const step = (what, sub, when) => `<li><span class="what">${what}<em>${sub}</em></span><span class="when">${fDate(when)}</span></li>`;
  $('#trail').innerHTML =
    step('Inicio del plan', fPart(start, { weekday: 'long' }), start) +
    step(`+ ${plural(365 * y, 'día')}`, y === 1 ? 'Un año de plan' : plural(y, 'año') + ' de plan', plusYear) +
    step(`+ ${plural(m, 'mes')}`, 'Meses extra', plusMonths) +
    step(`+ ${plural(d, 'día')}`, 'Días extra · fecha final', final);
  return final;
}
$$('[data-plan]').forEach(inp => inp.addEventListener('input', () => {
  const k = inp.dataset.plan;
  S.plan[k] = k === 'start' ? inp.value : (inp.value === '' ? 0 : Number(inp.value));
  save(); calcPlan();
}));
$$('[data-step]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.step, inp = $('#p-' + k);
  let n = (Number(inp.value) || 0) + Number(b.dataset.d);
  if (k === 'years' && n < 0) n = 0;
  inp.value = n;
  inp.dispatchEvent(new Event('input', { bubbles: true }));
}));

/* ── Filas (días entre fechas y prorrateos) ── */
let rowUid = 0;
function rowHTML(key, r, i) {
  const id = 'r' + (rowUid++);
  const dateF = (f, label, cls) => `<div class="field ${cls}"><label for="${id}${f}">${label}</label><input type="date" id="${id}${f}" data-f="${f}" value="${r[f] || ''}"></div>`;
  const moneyF = (f, label) => `<div class="field"><label for="${id}${f}">${label}</label><input type="text" inputmode="numeric" id="${id}${f}" data-f="${f}" data-money value="${r[f] ? pesos(r[f]) : ''}" placeholder="$ 0"><div class="field-below"><span class="plan-tag" data-tag="${f}">${esc(r['p' + f] || '')}</span><button type="button" class="pick" data-act="pick" data-f="${f}" title="Elegir de la tabla de valores (Alt + P)">Elegir plan</button></div></div>`;
  const del = `<button class="del" data-act="del" aria-label="Eliminar fila ${i + 1}" title="Eliminar (Alt + Supr)">${icon('trash')}</button>`;
  if (key === 'range') return `<div class="row row-range" data-i="${i}">${dateF('a', 'Desde', 'f-a')}${dateF('b', 'Hasta', 'f-b')}<div class="out"><b data-o="days">—</b><small>días</small></div>${del}<p class="warn" data-o="warn"></p></div>`;
  return `<div class="row row-pro" data-i="${i}">${dateF('a', 'Inicio novedad', 'f-a')}${dateF('b', 'Fin vigencia', 'f-b')}${moneyF('v1', 'Valor plan actual')}${moneyF('v2', 'Valor plan nuevo')}<div class="out"><b data-o="total">—</b><small>a cobrar</small></div>${del}<p class="warn" data-o="warn"></p><div class="breakdown" data-o="bd"></div></div>`;
}
function renderRows(key) {
  const box = $('#rows-' + key);
  box.innerHTML = S[key].length ? S[key].map((r, i) => rowHTML(key, r, i)).join('') : '<div class="rows-empty">No hay periodos. Añade uno con el botón de abajo o con Alt + N.</div>';
  calcRows(key);
}
function rowCalc(key, r) {
  const a = parseD(r.a), b = parseD(r.b);
  if (a === null || b === null) return null;
  if (key === 'range') return { a, b, days: daysBetween(a, b) + 1 };
  const dv = DIV[key], base = BASE[key], m1 = (r.v1 || 0) / dv, m2 = (r.v2 || 0) / dv, days = daysBetween(a, b);
  const d1 = m1 / base, d2 = m2 / base, dd = d2 - d1;
  return { a, b, days, m1, m2, d1, d2, dd, t: dd * days };
}
function calcRows(key) {
  let total = 0;
  $$('#rows-' + key + ' .row').forEach(el => {
    const r = S[key][el.dataset.i], c = rowCalc(key, r);
    $('[data-o="warn"]', el).textContent = (c && c.b < c.a) ? 'La fecha final es anterior a la inicial.' : '';
    if (key === 'range') {
      const o = $('[data-o="days"]', el);
      if (!c) { o.textContent = '—'; return; }
      total += c.days; o.textContent = num(c.days); el.classList.toggle('neg', c.days < 0);
      return;
    }
    const o = $('[data-o="total"]', el), bd = $('[data-o="bd"]', el);
    if (!c) { o.textContent = '—'; bd.innerHTML = 'Completa las dos fechas para calcular.'; el.classList.remove('neg'); return; }
    total += c.t; o.textContent = pesos(c.t); el.classList.toggle('neg', c.t < 0);
    bd.innerHTML = `<span>Días: <b>${num(c.days)}</b></span>` +
      (DIV[key] > 1 ? `<span>Mensual actual: <b>${pesos(c.m1)}</b></span><span>Mensual nuevo: <b>${pesos(c.m2)}</b></span>` : '') +
      `<span>Día actual: <b>${pesos(c.d1)}</b></span><span>Día nuevo: <b>${pesos(c.d2)}</b></span><span>Diferencia por día: <b>${pesos(c.dd)}</b></span>`;
  });
  $('#total-' + key).textContent = key === 'range' ? plural(total, 'día') : pesos(total);
  return total;
}
['range', 'mes', 'tri', 'anio'].forEach(key => {
  const box = $('#rows-' + key);
  box.addEventListener('input', e => {
    const inp = e.target, row = inp.closest('.row');
    if (!row) return;
    const r = S[key][row.dataset.i], f = inp.dataset.f, money = inp.hasAttribute('data-money');
    r[f] = money ? parseMoney(inp.value) : inp.value;
    if (money && r['p' + f]) { delete r['p' + f]; delete r['k' + f]; const tg = $(`[data-tag="${f}"]`, row); if (tg) tg.textContent = ''; }
    save(); calcRows(key);
  });
  box.addEventListener('click', e => {
    const d = e.target.closest('[data-act="del"]');
    if (d) { delRow(key, Number(d.closest('.row').dataset.i)); return; }
    const p = e.target.closest('[data-act="pick"]');
    if (p) rowPick(key, Number(p.closest('.row').dataset.i), p.dataset.f);
  });
});

/* Money inputs show raw digits while editing and "$ 1.234" otherwise. */
document.addEventListener('focusin', e => {
  const i = e.target;
  if (!i.hasAttribute || !i.hasAttribute('data-money')) return;
  const n = parseMoney(i.value), raw = n ? String(n) : '';
  i.value = raw;
  setTimeout(() => { if (document.activeElement === i && i.value === raw) i.select(); }, 0);
});
document.addEventListener('focusout', e => {
  const i = e.target;
  if (!i.hasAttribute || !i.hasAttribute('data-money')) return;
  const n = parseMoney(i.value);
  i.value = n ? pesos(n) : '';
});

function addRow(key) {
  const prev = S[key][S[key].length - 1];
  S[key].push(key === 'range' ? { a: '', b: '' } : { a: '', b: '', v1: prev ? prev.v1 : 0, v2: prev ? prev.v2 : 0, pv1: prev && prev.pv1, kv1: prev && prev.kv1, pv2: prev && prev.pv2, kv2: prev && prev.kv2 });
  save(); renderRows(key);
  const rows = $$('#rows-' + key + ' .row'), last = rows[rows.length - 1];
  last.classList.add('is-new');
  $('input', last).focus();
  toast('Periodo añadido');
}
function delRow(key, i) {
  S[key].splice(i, 1); save(); renderRows(key);
  const rows = $$('#rows-' + key + ' .row');
  if (rows.length) $('input', rows[Math.min(i, rows.length - 1)]).focus();
  toast('Periodo eliminado');
}

/* ── Tabla de valores ── */
const nm = x => String(x.y ?? '').trim();
const planNames = g => [...new Set(S.cat[g].map(nm).filter(Boolean))];
function renderCat() {
  Object.keys(GROUPS).forEach(g => {
    $('#cat-' + g).innerHTML = S.cat[g].length ? S.cat[g].map((x, i) => `<div class="cat-row" data-g="${g}" data-i="${i}">
      <input type="text" data-cf="y" value="${esc(x.y ?? '')}" aria-label="Nombre del plan" placeholder="Nombre del plan">
      <input type="text" data-cf="c" value="${esc(x.c || '')}" aria-label="Categoría" placeholder="Categoría">
      <input type="text" inputmode="numeric" data-cf="v" data-money value="${x.v ? pesos(x.v) : ''}" aria-label="Valor" placeholder="$ 0">
      <button class="del" data-act="catdel" aria-label="Eliminar plan">${icon('trash')}</button></div>`).join('')
      : '<p class="cat-empty">Sin planes. Añade el primero.</p>';
  });
  refreshConsult();
}
function setOptions(sel, opts, keep) {
  sel.innerHTML = opts.map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('');
  if (opts.some(o => String(o.v) === String(keep))) sel.value = keep;
  sel.disabled = !opts.length;
}
function refreshConsult() {
  const g = $('#q-g').value, ySel = $('#q-y'), cSel = $('#q-c');
  setOptions(ySel, planNames(g).map(y => ({ v: y, t: y })), ySel.value);
  const y = ySel.value;
  const items = S.cat[g].map((x, i) => ({ x, i })).filter(o => nm(o.x) === y && o.x.c);
  setOptions(cSel, items.map(o => ({ v: o.i, t: o.x.c })), cSel.value);
  const hit = items.find(o => String(o.i) === cSel.value);
  $$('.cat-row.hit').forEach(r => r.classList.remove('hit'));
  if (hit) {
    $('#q-v').textContent = hit.x.v ? pesos(hit.x.v) : 'Sin valor';
    $('#q-note').textContent = `${GROUPS[g]} · ${y} · ${hit.x.c}`;
    const r = $(`.cat-row[data-g="${g}"][data-i="${hit.i}"]`);
    if (r) r.classList.add('hit');
  } else { $('#q-v').textContent = '—'; $('#q-note').textContent = 'No hay planes registrados'; }
}
['q-g', 'q-y', 'q-c'].forEach(id => $('#' + id).addEventListener('change', refreshConsult));
$('.cat-grid').addEventListener('input', e => {
  const inp = e.target, row = inp.closest('.cat-row');
  if (!row) return;
  const x = S.cat[row.dataset.g][row.dataset.i], f = inp.dataset.cf;
  x[f] = f === 'v' ? parseMoney(inp.value) : inp.value;
  save(); refreshConsult();
});
$('.cat-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-act="catdel"]');
  if (b) { const r = b.closest('.cat-row'); catDel(r.dataset.g, Number(r.dataset.i)); }
});
function catAdd(g) {
  S.cat[g].push({ y: '', c: '', v: 0 }); save(); renderCat();
  const rows = $$('#cat-' + g + ' .cat-row');
  $('[data-cf="y"]', rows[rows.length - 1]).focus();
}
function catDel(g, i) {
  S.cat[g].splice(i, 1); save(); renderCat();
  const rows = $$('#cat-' + g + ' .cat-row');
  if (rows.length) $('input', rows[Math.min(i, rows.length - 1)]).focus();
  toast('Plan eliminado');
}

/* ── Selector de plan ── */
const picker = $('#picker');
let pk = null;
function openPicker(o) {
  pk = Object.assign({ q: '', sel: 0 }, o);
  const ns = planNames(pk.group);
  pk.name = ns.includes(o.current) ? o.current : (ns[0] ?? null);
  $('#pk-title').textContent = o.label;
  $('#pk-q').value = '';
  $('#pk-groups').hidden = !!o.lock;
  $('#pk-hint').textContent = '↑ ↓ moverse · ← → cambiar plan' + (o.lock ? '' : ' · Shift ← → cambiar tipo') + ' · Enter elegir';
  renderPicker();
  openDialog(picker);
  $('#pk-q').focus();
}
const pkItems = () => { const q = norm(pk.q.trim()); return S.cat[pk.group].filter(x => x.c && nm(x) === pk.name && (!q || norm(x.c).includes(q))); };
function renderPicker() {
  $$('#pk-groups .seg').forEach(b => b.classList.toggle('active', b.dataset.g === pk.group));
  const ns = planNames(pk.group);
  $('#pk-names').innerHTML = ns.map(n => `<button type="button" class="chip" data-n="${esc(n)}" aria-pressed="${n === pk.name}">${esc(n)}</button>`).join('');
  const items = pkItems();
  pk.sel = Math.max(0, Math.min(pk.sel, items.length - 1));
  $('#pk-list').innerHTML = items.length
    ? items.map((x, j) => `<button type="button" class="pk-item${j === pk.sel ? ' sel' : ''}" role="option" aria-selected="${j === pk.sel}" data-j="${j}"><span>${esc(x.c)}</span><b>${x.v ? pesos(x.v) : 'Sin valor'}</b></button>`).join('')
    : `<p class="pk-empty">${ns.length ? 'Ninguna categoría coincide con la búsqueda.' : 'No hay planes de este tipo. Agrégalos en Tabla de valores.'}</p>`;
  const sl = $('#pk-list .sel');
  if (sl) sl.scrollIntoView({ block: 'nearest' });
}
function choose(j) {
  const x = pkItems()[j];
  if (!x || isClosing(picker)) return;
  const g = pk.group, cb = pk.onPick;
  closeDialog(picker).then(() => cb(x, g));
}
function setPkGroup(g) { pk.group = g; pk.name = planNames(g)[0] ?? null; pk.sel = 0; renderPicker(); $('#pk-q').focus(); }
$('#pk-q').addEventListener('input', e => { pk.q = e.target.value; pk.sel = 0; renderPicker(); });
$('#pk-names').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { pk.name = b.dataset.n; pk.sel = 0; renderPicker(); $('#pk-q').focus(); } });
$('#pk-groups').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) setPkGroup(b.dataset.g); });
$('#pk-list').addEventListener('click', e => { const b = e.target.closest('[data-j]'); if (b) choose(Number(b.dataset.j)); });
function pickerKeys(e) {
  const items = pkItems(), ns = planNames(pk.group);
  if (e.key === 'ArrowDown') { e.preventDefault(); pk.sel = Math.min(pk.sel + 1, items.length - 1); renderPicker(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); pk.sel = Math.max(pk.sel - 1, 0); renderPicker(); }
  else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.shiftKey && !pk.lock) {
    e.preventDefault();
    const gs = Object.keys(GROUPS), i = gs.indexOf(pk.group);
    setPkGroup(gs[(i + (e.key === 'ArrowRight' ? 1 : -1) + gs.length) % gs.length]);
  }
  else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (!pk.q || e.altKey)) {
    e.preventDefault();
    const i = ns.indexOf(pk.name), d = e.key === 'ArrowRight' ? 1 : -1;
    if (ns.length) { pk.name = ns[Math.max(0, Math.min(ns.length - 1, i + d))]; pk.sel = 0; renderPicker(); }
  }
  else if (e.key === 'Enter') { e.preventDefault(); choose(pk.sel); }
}
function rowPick(key, i, f) {
  openPicker({
    group: key, lock: true, current: S[key][i]['k' + f],
    label: `${f === 'v2' ? 'Valor plan nuevo' : 'Valor plan actual'} · ${GROUPS[key]}`,
    onPick: x => {
      const r = S[key][i];
      r[f] = x.v || 0; r['p' + f] = `${nm(x)} · ${x.c}`; r['k' + f] = nm(x);
      save(); renderRows(key);
      const row = $$('#rows-' + key + ' .row')[i], inp = row && $(`[data-f="${f}"][data-money]`, row);
      if (inp) inp.focus();
      toast(x.v ? `Valor puesto: ${pesos(x.v)}` : 'Ese plan aún no tiene valor en la tabla', x.v ? 'success' : 'info');
    }
  });
}
function fieldPick(btn) {
  const inp = document.getElementById(btn.dataset.pickFor), tag = btn.parentElement.querySelector('.plan-tag');
  openPicker({
    group: btn.dataset.group || 'mes', lock: false, current: inp.dataset.plan,
    label: (inp.closest('.field').querySelector('label') || {}).textContent || 'Elegir plan',
    onPick: (x, g) => {
      inp.value = x.v || ''; inp.dataset.plan = nm(x);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      if (tag) tag.textContent = `${GROUPS[g]} · ${nm(x)} · ${x.c}`;
      inp.focus();
      toast(x.v ? `Valor puesto: ${pesos(x.v)}` : 'Ese plan aún no tiene valor en la tabla', x.v ? 'success' : 'info');
    }
  });
}
$$('[data-pick-for]').forEach(b => {
  b.addEventListener('click', () => fieldPick(b));
  const inp = document.getElementById(b.dataset.pickFor);
  inp.addEventListener('input', e => {
    if (!e.isTrusted) return;
    const t = b.parentElement.querySelector('.plan-tag');
    if (t) t.textContent = '';
    delete inp.dataset.plan;
  });
});
