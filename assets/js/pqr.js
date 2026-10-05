'use strict';
/* ═══════════ Respuestas PQR: predefined, editable-before-copy answers ═══════════ */

const PQR = [
  { cat: 'Cierre PQR', title: 'Congelación por viaje internacional', body: 'A partir del 01/04/2025, no se aplican novedades de congelación por viaje internacional. Solo se procesarán las PQR creadas antes de esta fecha, o si el reporte se realizó por correo o a través de la línea de servicio al cliente antes del 01/04/2025. Si deseas congelar tu plan, puedes hacerlo desde la página web. //(YB)' },
  { cat: 'Cierre PQR', title: 'Cambio asesor tardío (+5 días)', body: 'Se valida que la PQR fue creada el 30 de septiembre y, para el día de hoy, ya no se puede gestionar. Adicionalmente, no se evidencia que haya sido escalada. //(YB)' },
  { cat: 'Gestión', title: 'Restablecimiento de usuario y contraseña', body: 'Se procedió a restablecer la contraseña de ingreso a nuestra plataforma Web y APP. //(YB)\nUsuario: XX\nContraseña: XX' },
  { cat: 'Cierre PQR', title: 'Máximo de congelaciones alcanzado', body: 'Se valida que el afiliado ya utilizó las dos congelaciones permitidas a través de la página web. Por lo tanto, la PQR se cierra. //(YB)' },
  { cat: 'Cierre PQR', title: 'Contrato ya firmado', body: 'Se valida que ya tiene el contrato firmado, por lo que se cierra la PQR. (YB)' },
  { cat: 'Cierre PQR', title: 'Sin número de cotización adjunto', body: 'Se valida que no se adjuntó el número de cotización en esta PQR, por lo tanto, se cierra. Por favor, crea una nueva PQR incluyendo tanto el número de cotización como el certificado. Una vez creada, llama a la línea 9000 para escalar el caso. (YB)' },
  { cat: 'Cierre PQR', title: 'Plan Débito Trimestre — sin novedades', body: 'Se valida que el afiliado tiene un plan Débito Trimestre, el cual no es válido para novedades. Por este motivo, se cierra la PQR. (YB)' },
  { cat: 'Crear PQR', title: 'Cambio de categoría (trimestral)', body: 'Se solicita el ajuste de categoría a XX para el plan trimestral, dado que el cambio no se reflejó automáticamente después de realizar el pago con el número de factura XX. //(YB)' },
  { cat: 'Cierre PQR', title: 'Referido — no cumple TyC (plan mensual)', body: 'Se valida que [NOMBRE], con C.C. [DOC], no cumple con los términos y condiciones para el beneficio de referido. La razón es que el afiliado no estaba inactivo por al menos 180 días, ya que mantenía un plan Débito Mensual Gold. (YB)' },
  { cat: 'Cierre PQR', title: 'Referido — no cumple TyC (plan trimestre)', body: 'Se valida que [NOMBRE], con C.C. [DOC], no cumple con los términos y condiciones para el beneficio de referido. La razón es que la afiliada compró un débito trimestre sin permanencia, por lo que no cumple con TyC de referido. //(YB)' },
  { cat: 'Cierre PQR', title: 'Datos cambiados — unificación ya realizada', body: 'Se verifica en sistema la unificación de perfil; ya se realizó, quedó asignado C.C. [DOC], se cierra PQR. SAB' },
  { cat: 'Cierre PQR', title: 'Incapacidad menor a 5 días', body: 'Se valida la información y se determina que la incapacidad no aplica ya que es menor a 5 días.' },
  { cat: 'Cierre PQR', title: 'Afiliado ya tiene CC en MyBodyTech', body: 'Se validó la información y el afiliado ya cuenta con C.C. en la plataforma de MyBodyTech.' }
];

const badgeClass = cat => { const t = norm(cat); return t.includes('crear') ? 'b-crear' : t.includes('gestion') ? 'b-gestion' : 'b-cierre'; };

function renderPqr() {
  $('#pqrList').innerHTML = PQR.map((p, i) => `
    <article class="pt-item">
      <div class="pt-head">
        <span class="badge ${badgeClass(p.cat)}">${esc(p.cat)}</span>
        <span class="pt-key">${esc(p.title)}</span>
        <div class="pt-actions">
          <button class="icon-btn" data-pt-act="save" title="Guardar en Plantillas" aria-label="Guardar «${esc(p.title)}» en Plantillas">${icon('bookmark')}</button>
          <button class="btn btn-secondary btn-sm pt-copy" data-pt-act="copy">${icon('copy')}Copiar</button>
        </div>
      </div>
      <div class="pt-body" id="pt${i + 1}" contenteditable="true" spellcheck="false" aria-label="Texto de «${esc(p.title)}», editable">${esc(p.body)}</div>
    </article>`).join('');
}

function filtrarPqr() {
  const q = norm($('#pqrSearch').value), items = $$('#pqrList .pt-item');
  let n = 0;
  items.forEach(it => { const ok = !q || norm(it.textContent).includes(q); it.hidden = !ok; if (ok) n++; });
  $('#pqrCount').textContent = q ? `${n} de ${items.length}` : `${items.length} respuestas`;
  $('#pqrNone').style.display = n ? 'none' : 'block';
}

$('#pqrSearch').addEventListener('input', filtrarPqr);
$('#pqrSearch').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); const f = $('#pqrList .pt-item:not([hidden]) .pt-copy'); if (f) f.click(); }
});
$('#pqrList').addEventListener('click', e => {
  const b = e.target.closest('[data-pt-act]');
  if (!b) return;
  const item = b.closest('.pt-item'), text = $('.pt-body', item).textContent.trim();
  if (b.dataset.ptAct === 'copy') copyText(text, b, 'Respuesta copiada');
  else Tpl.openEditor({ name: $('.pt-key', item).textContent, category: $('.badge', item).textContent, content: text });
});
