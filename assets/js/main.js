'use strict';
/* ═══════════ Boot ═══════════ */
(function init() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  Object.keys(GENERATORS).forEach(generate);
  fillPlan(); calcPlan();
  ['range', 'mes', 'tri', 'anio'].forEach(renderRows);
  renderCat();
  renderPqr(); filtrarPqr();
  Tpl.init();
  numberNav();

  let start = store.getRaw('mybt-last') || DEFAULT_SEC;
  const hash = location.hash.slice(1);
  if (hash && document.getElementById('sec-' + hash)) start = hash;
  goTo(document.getElementById('sec-' + start) ? start : DEFAULT_SEC);

  // Enable transitions only after the first paint.
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('preload')));
})();

window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (document.getElementById('sec-' + h)) goTo(h); });
