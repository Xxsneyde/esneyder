'use strict';
/* ═══════════ Boot ═══════════ */
(function init() {
  setPalette(curPalette());

  Object.keys(GENERATORS).forEach(generate);
  fillPlan(); calcPlan();
  ['range', 'mes', 'tri', 'anio'].forEach(renderRows);
  renderCat();
  renderPqr(); filtrarPqr();
  Tpl.init();
  numberNav();

  // The page always opens on the hero, unless the link points at a tool (#calc_mes…).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const valid = id => id && document.getElementById('sec-' + id);
  const hash = location.hash.slice(1), last = store.getRaw('mybt-last');
  markSec(valid(hash) ? hash : valid(last) ? last : DEFAULT_SEC);
  if (valid(hash)) {
    goTo(hash, false, true);
    // Fonts and images can shift the layout a bit: settle on the tool once everything loaded.
    const y0 = scrollY;
    window.addEventListener('load', () => { if (Math.abs(scrollY - y0) < 4) goTo(hash, false, true); }, { once: true });
  }

  // "Continuar en …" brings you back to the last tool you used.
  const resume = $('#heroResume');
  if (valid(last)) {
    $('b', resume).textContent = TITLES[last];
    resume.hidden = false;
    resume.addEventListener('click', () => goTo(store.getRaw('mybt-last') || last, finePointer.matches));
  }

  // Enable transitions only after the first paint.
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('preload')));
})();

window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (document.getElementById('sec-' + h)) goTo(h); });
