'use strict';
/* ═══════════ Text generators (novedades) and simple calculators ═══════════
   Cards declare `data-gen="cN"` or `data-calc="name"`; any input inside them
   re-runs the matching function (see the listener at the bottom). */

const EMPTY_OUT = '<em>Completa los campos para generar el texto…</em>';
const val = id => document.getElementById(id).value.trim();
const fmt = d => { const t = parseD(d); return t === null ? '[fecha]' : fDate(t); };
/** Days between two ISO dates, counting both ends. */
const diffIncl = (a, b) => { const x = parseD(a), y = parseD(b); return (x === null || y === null) ? null : daysBetween(x, y) + 1; };
const addDays = (ds, n) => { const t = parseD(ds); return (t === null || n === null) ? '[fecha nueva]' : fDate(t + n * MS); };

/** Shared logic for the "novedad" cards: start, end, current cut-off date and PQR. */
function novedad(p, render) {
  const ini = val(p + '_ini'), fin = val(p + '_fin'), co = val(p + '_corte'), pqr = esc(val(p + '_pqr'));
  if (!ini && !fin && !co) return null;
  const d = diffIncl(ini, fin) ?? '[X]';
  const nf = addDays(co, typeof d === 'number' ? d : 0);
  return render({ ini: fmt(ini), fin: fmt(fin), co: fmt(co), pqr, d, nf });
}

const GENERATORS = {
  c5: () => novedad('c5', x => `Se aplica novedad de incapacidad médica desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; la fecha fin del servicio actualmente es <strong>${x.co}</strong>. La nueva fecha fin es <strong>${x.nf}</strong> por un total de <strong>${x.d} días</strong>${x.pqr ? ` //(BD) PQR ${x.pqr}` : ' //(BD)'}.`),
  c6: () => novedad('c6', x => `Se aplica novedad de incapacidad médica desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; fecha de corte actual <strong>${x.co}</strong>. Total de días: <strong>${x.d}</strong>. Nueva fecha de corte: <strong>${x.nf}</strong>${x.pqr ? ` //(BD) PQR ${x.pqr}` : ' //(BD)'}.`),
  c7: () => novedad('c7', x => `Se aplica novedad de congelación desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; fecha fin del servicio actualmente <strong>${x.co}</strong>. Total de días: <strong>${x.d}</strong>. Nueva fecha fin: <strong>${x.nf}</strong>${x.pqr ? `. Bajo la PQR ${x.pqr} //(BD)` : ' //(BD)'}.`),
  c8: () => novedad('c8', x => `Se aplica novedad de congelación desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; fecha de corte actual <strong>${x.co}</strong>. Total de días: <strong>${x.d}</strong>. Nueva fecha de corte: <strong>${x.nf}</strong>${x.pqr ? `. Bajo la PQR ${x.pqr} //(BD)` : ' //(BD)'}.`),
  c9: () => novedad('c9', x => `Se aplica novedad de congelación retroactiva desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; fecha fin del servicio actualmente <strong>${x.co}</strong>. Total de días: <strong>${x.d}</strong>. Nueva fecha fin: <strong>${x.nf}</strong> //(YB)${x.pqr ? ` PQR ${x.pqr}` : ''}.`),
  c10: () => novedad('c10', x => `Se aplica novedad de congelación retroactiva desde el <strong>${x.ini}</strong> hasta <strong>${x.fin}</strong>; fecha de corte actual <strong>${x.co}</strong>. Total de días: <strong>${x.d}</strong>. Nueva fecha de corte: <strong>${x.nf}</strong> SAB${x.pqr ? ` PQR ${x.pqr}` : ''}.`),
  c11: () => {
    const a = val('c11_actual'), n = val('c11_nueva'), pqr = esc(val('c11_pqr'));
    if (!a && !n) return null;
    return `Se realiza cambio de fecha de inicio del plan por motivo error de digitación en sede; fecha inicio actual <strong>${fmt(a)}</strong>, nueva fecha inicio para el <strong>${fmt(n)}</strong>${pqr ? ` bajo la PQR ${pqr}` : ''}.`;
  }
};

function generate(id) {
  const html = GENERATORS[id]();
  const out = document.getElementById(id + '_out');
  out.innerHTML = html ?? EMPTY_OUT;
  out.closest('.output-wrap').classList.toggle('is-empty', !html);
}

/** Copies the generated text of the card that holds `btn`. */
function copyOutput(btn) {
  const out = $('.output-text', btn.closest('.output-wrap'));
  if (!out || out.querySelector('em')) { toast('Primero llena los campos', 'info'); return; }
  copyText(out.innerText.trim(), btn, 'Texto copiado');
}

/* ── Simple calculators ── */
const numVal = id => parseFloat(document.getElementById(id).value);
function showResult(resId, values) {
  const r = document.getElementById(resId);
  if (!values) { r.classList.remove('visible'); return; }
  r.classList.add('visible');
  Object.entries(values).forEach(([id, text]) => { document.getElementById(id).textContent = text; });
}

const CALCS = {
  saldo() {
    const v1 = numVal('cs_valor'), dt = numVal('cs_dtotal'), dn = numVal('cs_dnov');
    if (!v1 || !dt || !dn) return showResult('cs_res', null);
    const dia = v1 / dt;
    showResult('cs_res', { cs_r1: pesos(dia) + '/día', cs_r2: pesos(dia * dn), cs_r3: pesos(v1 - dia * dn) });
  },
  congel() {
    const v1 = numVal('cc_valor'), m = numVal('cc_mes') || 30, d = numVal('cc_dias');
    if (!v1 || !d) return showResult('cc_res', null);
    const dia = v1 / m, nov = dia * d;
    showResult('cc_res', { cc_r1: pesos(dia) + '/día', cc_r2: pesos(nov), cc_r3: pesos(nov * 0.25) });
  }
};

document.addEventListener('input', e => {
  const t = e.target;
  if (!t.closest) return;
  const gen = t.closest('[data-gen]');
  if (gen) generate(gen.dataset.gen);
  const calc = t.closest('[data-calc]');
  if (calc) CALCS[calc.dataset.calc]();
});
