'use strict';
/* ═══════════ Plantillas: create, view, edit, delete, search, filter and sort user templates ═══════════
   Data lives in localStorage under `mybt-templates` as { v, items: Template[] }:
   Template = { id, name, category, content, fav, uses, createdAt, updatedAt } */

const Tpl = (() => {
  const KEY = 'mybt-templates';
  const PREFS_KEY = 'mybt-templates-prefs';
  const PREVIEW_CHARS = 320;

  const SORTS = {
    recent: (a, b) => b.updatedAt - a.updatedAt,
    name: (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true }),
    uses: (a, b) => (b.uses - a.uses) || (b.updatedAt - a.updatedAt),
    oldest: (a, b) => a.createdAt - b.createdAt
  };

  const el = {
    browse: $('#tplBrowse'), grid: $('#tplGrid'), filters: $('#tplFilters'), count: $('#tplCount'),
    search: $('#tplSearch'), sort: $('#tplSort'), empty: $('#tplEmpty'), noResults: $('#tplNoResults'),
    importInput: $('#tplImport'),
    dlg: $('#tplDialog'), form: $('#tplForm'), title: $('#tplDlgTitle'), save: $('#tplSave'),
    name: $('#tplName'), cat: $('#tplCat'), content: $('#tplContent'),
    nameErr: $('#tplNameErr'), contentErr: $('#tplContentErr'), chars: $('#tplChars'),
    catList: $('#tplCatList'), catSuggest: $('#tplCatSuggest')
  };

  /* ── State ── */
  const sanitize = t => {
    const now = Date.now();
    return {
      id: String(t.id || newId()),
      name: String(t.name || '').trim().slice(0, 80),
      category: String(t.category || '').trim().slice(0, 40),
      content: String(t.content || ''),
      fav: !!t.fav,
      uses: Math.max(0, Number(t.uses) || 0),
      createdAt: Number(t.createdAt) || now,
      updatedAt: Number(t.updatedAt) || Number(t.createdAt) || now
    };
  };
  const isValid = t => t && typeof t === 'object' && String(t.name || '').trim() && String(t.content || '').trim();

  let items = (store.get(KEY, null)?.items || []).filter(isValid).map(sanitize);
  const prefs = Object.assign({ sort: 'recent', filter: 'all' }, store.get(PREFS_KEY, {}));
  if (!SORTS[prefs.sort]) prefs.sort = 'recent';
  let shown = new Set();   // ids rendered last time, to animate only new cards
  let editingId = null;    // null → creating
  let snapshot = '';       // editor contents when opened, for the unsaved-changes guard

  const persist = () => store.set(KEY, { v: 1, items }) || toast('No se pudo guardar en este navegador', 'error');
  const savePrefs = () => store.set(PREFS_KEY, prefs);
  const byId = id => items.find(t => t.id === id);
  const categories = () => [...new Set(items.map(t => t.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  /* ── Filtering ── */
  const matchesFilter = t => {
    const f = prefs.filter;
    if (f === 'all') return true;
    if (f === 'fav') return t.fav;
    if (f === 'none') return !t.category;
    return f.startsWith('cat:') && t.category === f.slice(4);
  };
  const matchesQuery = (t, q) => !q || norm(t.name).includes(q) || norm(t.category).includes(q) || norm(t.content).includes(q);

  /** Falls back to "Todas" when the active filter no longer has any match (e.g. last template of a category removed). */
  function validateFilter() {
    const f = prefs.filter;
    const ok = f === 'all' || (f === 'fav' && items.some(t => t.fav)) || (f === 'none' && items.some(t => !t.category)) ||
      (f.startsWith('cat:') && items.some(t => t.category === f.slice(4)));
    if (!ok) { prefs.filter = 'all'; savePrefs(); }
  }

  /* ── Rendering ── */
  function renderFilters() {
    const count = pred => items.filter(pred).length;
    const chips = [{ v: 'all', label: 'Todas', n: items.length }];
    const favs = count(t => t.fav);
    if (favs) chips.push({ v: 'fav', label: 'Favoritas', n: favs, icon: 'star' });
    categories().forEach(c => chips.push({ v: 'cat:' + c, label: c, n: count(t => t.category === c) }));
    const none = count(t => !t.category);
    if (none && none !== items.length) chips.push({ v: 'none', label: 'Sin categoría', n: none });
    el.filters.innerHTML = chips.map(c =>
      `<button type="button" class="chip" data-filter="${esc(c.v)}" aria-pressed="${prefs.filter === c.v}">${c.icon ? icon(c.icon) : ''}${esc(c.label)}<span class="chip-count">${c.n}</span></button>`
    ).join('');
  }

  function metaText(t) {
    const uses = t.uses ? ` · ${t.uses} ${t.uses === 1 ? 'uso' : 'usos'}` : '';
    return `Editada ${relTime(t.updatedAt)}${uses}`;
  }

  function cardHTML(t, q, i, entering) {
    const preview = t.content.length > PREVIEW_CHARS ? t.content.slice(0, PREVIEW_CHARS) + '…' : t.content;
    return `
      <article class="tpl-card${entering ? ' is-entering' : ''}" data-id="${esc(t.id)}" tabindex="0" style="--i:${Math.min(i, 12)}" aria-label="${esc(t.name)}">
        <div class="tpl-card-head">
          <h3 class="tpl-name">${highlight(t.name, q)}</h3>
          <button type="button" class="icon-btn tpl-fav" data-tpl-act="fav" aria-pressed="${t.fav}" aria-label="${t.fav ? 'Quitar de favoritas' : 'Marcar como favorita'}" title="${t.fav ? 'Quitar de favoritas' : 'Marcar como favorita'}">${icon('star')}</button>
        </div>
        <p class="tpl-preview">${highlight(preview, q)}</p>
        <div class="tpl-meta">${t.category ? `<span class="badge">${highlight(t.category, q)}</span>` : ''}<span data-meta>${metaText(t)}</span></div>
        <div class="tpl-foot">
          <div class="tpl-actions">
            <button type="button" class="icon-btn" data-tpl-act="edit" aria-label="Editar" title="Editar">${icon('pencil')}</button>
            <button type="button" class="icon-btn" data-tpl-act="duplicate" aria-label="Duplicar" title="Duplicar">${icon('duplicate')}</button>
            <button type="button" class="icon-btn danger" data-tpl-act="delete" aria-label="Eliminar" title="Eliminar">${icon('trash')}</button>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-tpl-act="copy">${icon('copy')}Copiar</button>
        </div>
      </article>`;
  }

  function render() {
    validateFilter();
    const q = norm(el.search.value.trim());
    const list = items.filter(t => matchesFilter(t) && matchesQuery(t, q)).sort(SORTS[prefs.sort]);
    const hasItems = items.length > 0;

    el.empty.hidden = hasItems;
    el.browse.hidden = !hasItems;
    el.noResults.hidden = !hasItems || list.length > 0;
    el.sort.value = prefs.sort;
    renderFilters();

    let entering = 0;
    el.grid.innerHTML = list.map(t => cardHTML(t, q, shown.has(t.id) ? 0 : entering++, !shown.has(t.id))).join('');
    shown = new Set(list.map(t => t.id));

    const filtered = q || prefs.filter !== 'all';
    el.count.textContent = !hasItems ? '' : filtered ? `${list.length} de ${items.length}` : `${items.length} ${items.length === 1 ? 'plantilla' : 'plantillas'}`;
  }

  const cardOf = id => el.grid.querySelector(`.tpl-card[data-id="${CSS.escape(id)}"]`);
  function highlightCard(id) {
    const c = cardOf(id);
    if (!c) return;
    c.classList.remove('is-entering', 'is-highlight');
    void c.offsetWidth;
    c.classList.add('is-highlight');
    c.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
  /** Plays the leave animation, then runs `done`. */
  function leave(card, done) {
    if (!card || reducedMotion()) { done(); return; }
    card.classList.add('is-leaving');
    setTimeout(done, 200);
  }

  /* ── Actions ── */
  function copy(id, btn) {
    const t = byId(id);
    if (!t) return;
    copyText(t.content, btn, 'Plantilla copiada').then(ok => {
      if (!ok) return;
      t.uses += 1;
      persist();
      const meta = cardOf(id)?.querySelector('[data-meta]');
      if (meta) meta.textContent = metaText(t);
    });
  }

  function toggleFav(id, btn) {
    const t = byId(id);
    if (!t) return;
    t.fav = !t.fav;
    persist();
    if (prefs.filter === 'fav' && !t.fav) { leave(cardOf(id), render); return; }
    btn.setAttribute('aria-pressed', String(t.fav));
    const label = t.fav ? 'Quitar de favoritas' : 'Marcar como favorita';
    btn.setAttribute('aria-label', label); btn.title = label;
    btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
    renderFilters();
    toast(t.fav ? 'Añadida a favoritas' : 'Quitada de favoritas', 'info');
  }

  function duplicate(id) {
    const t = byId(id);
    if (!t) return;
    const now = Date.now();
    const copyItem = sanitize({ ...t, id: newId(), name: uniqueName(`${t.name} (copia)`), fav: false, uses: 0, createdAt: now, updatedAt: now });
    items.push(copyItem);
    persist();
    render();
    toast('Plantilla duplicada');
  }

  async function remove(id) {
    const t = byId(id);
    if (!t) return;
    const ok = await confirmDialog({
      title: '¿Eliminar esta plantilla?',
      message: `«${t.name}» se eliminará de forma permanente.`,
      confirmLabel: 'Eliminar'
    });
    if (!ok) return;
    leave(cardOf(id), () => {
      items = items.filter(x => x.id !== id);
      persist();
      render();
      toast('Plantilla eliminada');
    });
  }

  function uniqueName(base) {
    const taken = new Set(items.map(t => norm(t.name)));
    let name = base.slice(0, 80), n = 2;
    while (taken.has(norm(name))) name = `${base.slice(0, 74)} ${n++}`;
    return name;
  }

  function resetView() {
    el.search.value = '';
    prefs.filter = 'all';
    savePrefs();
    render();
  }

  /* ── Editor ── */
  const serialize = () => JSON.stringify([el.name.value, el.cat.value, el.content.value]);

  function updateChars() {
    const n = el.content.value.length;
    el.chars.textContent = `${n.toLocaleString('es-CO')} ${n === 1 ? 'carácter' : 'caracteres'}`;
  }
  function setError(input, errEl, msg) {
    errEl.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function renderCatSuggestions() {
    const cats = categories(), current = el.cat.value.trim();
    el.catList.innerHTML = cats.map(c => `<option value="${esc(c)}"></option>`).join('');
    el.catSuggest.innerHTML = cats.slice(0, 8).map(c => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c === current}">${esc(c)}</button>`).join('');
  }

  /** Opens the editor. `init` prefills a new template; pass `id` to edit an existing one. */
  function openEditor(init = {}, id = null) {
    const t = id ? byId(id) : null;
    editingId = t ? t.id : null;
    el.title.textContent = t ? 'Editar plantilla' : 'Nueva plantilla';
    el.save.textContent = t ? 'Guardar cambios' : 'Crear plantilla';
    el.name.value = t ? t.name : (init.name || '');
    el.cat.value = t ? t.category : (init.category || '');
    el.content.value = t ? t.content : (init.content || '');
    setError(el.name, el.nameErr, '');
    setError(el.content, el.contentErr, '');
    updateChars();
    renderCatSuggestions();
    snapshot = serialize();
    openDialog(el.dlg);
    const focusTarget = el.name.value ? el.content : el.name;
    focusTarget.focus();
    focusTarget.setSelectionRange(focusTarget.value.length, focusTarget.value.length);
    el.content.scrollTop = 0;
  }

  async function requestCloseEditor() {
    if (serialize() !== snapshot) {
      const discard = await confirmDialog({
        title: '¿Descartar los cambios?',
        message: 'Los cambios que hiciste en esta plantilla se perderán.',
        confirmLabel: 'Descartar',
        cancelLabel: 'Seguir editando'
      });
      if (!discard) return;
    }
    closeDialog(el.dlg);
  }
  el.dlg._onRequestClose = requestCloseEditor;

  function validate() {
    const name = el.name.value.trim(), content = el.content.value.trim();
    let nameMsg = '';
    if (!name) nameMsg = 'Escribe un nombre para la plantilla.';
    else if (items.some(t => t.id !== editingId && norm(t.name) === norm(name))) nameMsg = 'Ya existe una plantilla con ese nombre.';
    setError(el.name, el.nameErr, nameMsg);
    setError(el.content, el.contentErr, content ? '' : 'El contenido no puede estar vacío.');
    if (nameMsg) { el.name.focus(); return false; }
    if (!content) { el.content.focus(); return false; }
    return true;
  }

  function submit(e) {
    e.preventDefault();
    if (isClosing(el.dlg) || !validate()) return;
    const now = Date.now();
    const data = { name: el.name.value.trim(), category: el.cat.value.trim(), content: el.content.value.replace(/\s+$/, '') };
    let id = editingId;
    if (id) {
      Object.assign(byId(id), sanitize({ ...byId(id), ...data, updatedAt: now }));
    } else {
      const t = sanitize({ ...data, id: newId(), createdAt: now, updatedAt: now });
      items.push(t);
      id = t.id;
    }
    persist();
    snapshot = serialize();
    // Make sure the saved template is visible in the list.
    const t = byId(id);
    if (!matchesFilter(t) || !matchesQuery(t, norm(el.search.value.trim()))) { el.search.value = ''; prefs.filter = 'all'; savePrefs(); }
    const wasEditing = !!editingId;
    closeDialog(el.dlg).then(() => {
      render();
      if (curSec() === 'plantillas') highlightCard(id);
      toast(wasEditing ? 'Cambios guardados' : 'Plantilla creada');
    });
  }

  /* ── Import / export ── */
  function exportAll() {
    if (!items.length) { toast('No hay plantillas para exportar', 'info'); return; }
    const blob = new Blob([JSON.stringify({ app: 'mybt', type: 'plantillas', v: 1, exportedAt: new Date().toISOString(), items }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mybt-plantillas-${isoD(todayD())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Copia de seguridad descargada');
  }

  async function importFile(file) {
    const trigger = $$('[data-tpl-menu="import"]').find(b => b.offsetParent);
    trigger?.classList.add('is-loading');
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = (Array.isArray(parsed) ? parsed : parsed.items || []).filter(isValid).map(sanitize);
      if (!incoming.length) { toast('El archivo no contiene plantillas válidas', 'error'); return; }
      const ids = new Set(items.map(t => t.id));
      let added = 0, updated = 0;
      incoming.forEach(t => {
        if (ids.has(t.id)) { Object.assign(byId(t.id), t); updated++; }
        else { items.push(t); ids.add(t.id); added++; }
      });
      persist();
      resetView();
      toast(`${added} añadidas${updated ? `, ${updated} actualizadas` : ''}`);
    } catch (err) {
      toast('No se pudo leer el archivo', 'error');
    } finally {
      trigger?.classList.remove('is-loading');
      el.importInput.value = '';
    }
  }

  /* ── Events ── */
  el.grid.addEventListener('click', e => {
    const card = e.target.closest('.tpl-card');
    if (!card || card.classList.contains('is-leaving')) return;
    const id = card.dataset.id, btn = e.target.closest('[data-tpl-act]');
    const act = btn ? btn.dataset.tplAct : 'edit';
    if (act === 'copy') copy(id, btn);
    else if (act === 'fav') toggleFav(id, btn);
    else if (act === 'duplicate') duplicate(id);
    else if (act === 'delete') remove(id);
    else openEditor({}, id);
  });
  el.grid.addEventListener('keydown', e => {
    const card = e.target.classList.contains('tpl-card') ? e.target : null;
    if (!card) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEditor({}, card.dataset.id); }
    else if (e.key === 'Delete') { e.preventDefault(); remove(card.dataset.id); }
  });
  el.filters.addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (!b || prefs.filter === b.dataset.filter) return;
    prefs.filter = b.dataset.filter;
    savePrefs();
    shown = new Set();
    render();
  });
  el.search.addEventListener('input', render);
  el.search.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); const first = $('.tpl-card [data-tpl-act="copy"]', el.grid); if (first) first.click(); }
    else if (e.key === 'Escape' && el.search.value) { e.preventDefault(); el.search.value = ''; render(); }
  });
  el.sort.addEventListener('change', () => { prefs.sort = el.sort.value; savePrefs(); shown = new Set(); render(); });

  $$('[data-tpl-new]').forEach(b => b.addEventListener('click', () => openEditor()));
  $$('[data-tpl-clear]').forEach(b => b.addEventListener('click', resetView));
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-tpl-menu]');
    if (!m) return;
    if (m.dataset.tplMenu === 'export') exportAll();
    else el.importInput.click();
  });
  // Refresh relative dates ("hace 5 minutos") whenever the section is shown again.
  document.addEventListener('sectionchange', e => { if (e.detail === 'plantillas') render(); });
  el.importInput.addEventListener('change', () => { const f = el.importInput.files[0]; if (f) importFile(f); });

  el.form.addEventListener('submit', submit);
  el.content.addEventListener('input', () => { updateChars(); if (el.content.value.trim()) setError(el.content, el.contentErr, ''); });
  el.name.addEventListener('input', () => { if (el.nameErr.textContent) setError(el.name, el.nameErr, ''); });
  el.cat.addEventListener('input', () => $$('[data-cat]', el.catSuggest).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === el.cat.value.trim()))));
  el.catSuggest.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]');
    if (!c) return;
    el.cat.value = c.getAttribute('aria-pressed') === 'true' ? '' : c.dataset.cat;
    el.cat.dispatchEvent(new Event('input'));
  });

  /** Keyboard handling while any dialog other than the picker/help is open. */
  function dialogKeys(e) {
    if (el.dlg.open && !$('#confirmDlg').open && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      el.form.requestSubmit();
    }
  }

  /** Alt+C in the Plantillas section: copies the focused template. */
  function copyFocused() {
    const card = document.activeElement?.closest?.('.tpl-card');
    if (card) { copy(card.dataset.id, $('[data-tpl-act="copy"]', card)); return; }
    toast('Enfoca una plantilla o busca y pulsa Enter', 'info');
  }

  return { init: render, render, openEditor, copyFocused, resetView, dialogKeys };
})();
