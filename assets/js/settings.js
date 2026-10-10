'use strict';
/* ═══════════ Ajustes: color palette and visual effects level ═══════════ */
const FX_HINTS = {
  full: 'Cielo 3D con estrellas y cometas, escenas que giran con el scroll y tarjetas que siguen el puntero.',
  lite: 'Menos estrellas, sin cometas ni inclinación con el puntero. Recomendado si el equipo va lento.',
  off: 'Sin animaciones: todo aparece fijo y la página va directo a las herramientas.'
};

function syncSettings() {
  const p = curPalette(), f = FX.level;
  $$('[data-palette-pick]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.palettePick === p)));
  $$('[data-fx-pick]').forEach(b => {
    const on = b.dataset.fxPick === f;
    b.setAttribute('aria-checked', String(on));
    b.classList.toggle('active', on);
  });
  $('#fxHint').textContent = FX_HINTS[f];
}

function openSettings() {
  closeNav(false);
  syncSettings();
  openDialog($('#settings'));
  const cur = $('#settings [aria-checked="true"]');
  if (cur) cur.focus();
}

$('#settings').addEventListener('click', e => {
  const pal = e.target.closest('[data-palette-pick]');
  if (pal) { setPalette(pal.dataset.palettePick, true); syncSettings(); return; }
  const fx = e.target.closest('[data-fx-pick]');
  if (fx) {
    FX.setLevel(fx.dataset.fxPick, true);
    syncSettings();
    toast(`Efectos: ${fx.textContent.trim().toLowerCase()}`, 'info');
  }
});

// Arrow keys move inside each radio group, like native radio buttons.
$('#settings').addEventListener('keydown', e => {
  const k = e.key;
  if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(k)) return;
  const group = e.target.closest('[role="radiogroup"]');
  if (!group) return;
  e.preventDefault();
  const items = $$('[role="radio"]', group), i = items.indexOf(e.target);
  const next = items[(i + (k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
  next.focus();
  next.click();
});

document.addEventListener('palettechange', () => { if ($('#settings').open) syncSettings(); });
