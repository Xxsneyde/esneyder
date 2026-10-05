'use strict';
/* ═══════════ Shared utilities: DOM, dates (UTC), formatting, storage ═══════════ */

const MS = 86400000;
const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => [...r.querySelectorAll(q)];

/* Dates are handled as UTC timestamps to avoid timezone drift. */
const parseD = x => { if (!x) return null; const [y, m, d] = String(x).split('-').map(Number); return (y && m && d) ? Date.UTC(y, m - 1, d) : null; };
const isoD = t => new Date(t).toISOString().slice(0, 10);
const todayD = () => { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); };
const edate = (t, n) => { const d = new Date(t); const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate(); const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); return Date.UTC(y, m, Math.min(day, last)); };
const daysBetween = (a, b) => Math.round((b - a) / MS);
const fDate = t => { const d = new Date(t); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear(); };
const fPart = (t, o) => new Intl.DateTimeFormat('es-CO', Object.assign({ timeZone: 'UTC' }, o)).format(t);

const num = n => Math.round(n).toLocaleString('es-CO');
const pesos = n => { n = Math.round(n); return (n < 0 ? '-' : '') + '$ ' + Math.abs(n).toLocaleString('es-CO'); };
const plural = (n, w) => `${num(n)} ${w}${Math.abs(n) === 1 ? '' : (w === 'mes' ? 'es' : 's')}`;
const parseMoney = x => { const n = Number(String(x).replace(/[^\d-]/g, '')); return isFinite(n) ? n : 0; };

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Lowercase and strip accents, for accent-insensitive search. */
const norm = t => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Escapes `text` and wraps every accent-insensitive match of `q` (already normalized) in <mark>. */
function highlight(text, q) {
  text = String(text ?? '');
  if (!q) return esc(text);
  let flat = '';
  const map = [];
  for (let i = 0; i < text.length; i++) for (const ch of norm(text[i])) { flat += ch; map.push(i); }
  let out = '', last = 0, from = 0, idx;
  while ((idx = flat.indexOf(q, from)) !== -1) {
    const start = map[idx], end = map[idx + q.length - 1] + 1;
    if (start >= last) { out += esc(text.slice(last, start)) + '<mark>' + esc(text.slice(start, end)) + '</mark>'; last = end; }
    from = idx + q.length;
  }
  return out + esc(text.slice(last));
}

const icon = name => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

const RTF = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
/** "hace 3 días", "ayer", "ahora mismo"… */
function relTime(ts) {
  const s = (ts - Date.now()) / 1000, abs = Math.abs(s);
  if (abs < 45) return 'ahora mismo';
  const units = [['minute', 60], ['hour', 3600], ['day', 86400], ['week', 604800], ['month', 2629800], ['year', 31557600]];
  let unit = 'minute', size = 60;
  for (const [u, sec] of units) if (abs >= sec) { unit = u; size = sec; }
  return RTF.format(Math.round(s / size), unit);
}

/** localStorage wrapper that never throws (private mode, blocked storage…). */
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  getRaw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  setRaw(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
};
