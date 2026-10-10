# MYBT · Herramientas BodyTech

Aplicación web (HTML, CSS y JavaScript, sin dependencias) con las herramientas de apoyo para novedades, cambios de plan, fechas, respuestas PQR y plantillas propias.

El diseño es una sola página con scroll continuo, estilo «scrollytelling»: una portada 3D fijada al scroll, un índice de capítulos y cinco capítulos (uno por grupo de herramientas) con escenas 3D, imágenes con parallax y un cielo estrellado animado que avanza al hacer scroll. El menú no ocupa espacio fijo: es un botón flotante **Menú** que se esconde al bajar y vuelve al subir (o al acercar el puntero arriba); al abrirlo cubre la pantalla y lleva directo a cualquier herramienta. Con «reducir movimiento» activado en el sistema, las animaciones se desactivan.

## Uso

- **Desarrollo:** abre `index.html` directamente en el navegador (funciona también con `file://`).
- **Archivo único para compartir:** `node scripts/build.mjs` genera `dist/mybt.html`, con todo el CSS y JS incluidos.

Los datos (calculadoras, tabla de valores, plantillas, tema y última herramienta usada) se guardan en `localStorage` del navegador. En **Plantillas → ⋯** puedes exportar o importar una copia de seguridad en JSON.

## Estructura

```
index.html              Marcado de todas las secciones, diálogos e iconos (sprite SVG)
assets/css/
  tokens.css            Colores, tipografía, radios, sombras y movimiento (claro / oscuro)
  base.css              Reset y elementos base
  layout.css            Cielo, botón flotante (HUD), menú desplegable a pantalla completa y flujo de la página
  scenes.css            Portada 3D, índice, capítulos, orbe y cubo 3D, final, cristal y aparición al hacer scroll
  components.css        Botones, tarjetas, campos, chips, diálogos, menús, toast, estados vacíos
  tools.css             Estilos propios de calculadoras, tabla de valores y PQR
  templates.css         Sección Plantillas
assets/js/              (scripts clásicos, cargados en este orden)
  utils.js              DOM, fechas UTC, formato, búsqueda sin tildes, almacenamiento
  ui.js                 Toast, portapapeles, diálogos animados, confirmación, tema, menús
  generators.js         Textos de novedades y cálculos simples (saldo, 3.ª congelación)
  nav.js                Scroll a cada herramienta, herramienta actual según el scroll, menú desplegable y su buscador
  calculators.js        Fecha final, días entre fechas, prorrateos, tabla de valores, selector de plan
  pqr.js                Respuestas PQR predefinidas
  templates.js          Plantillas: crear, editar, eliminar, buscar, filtrar, ordenar, importar/exportar
  actions.js            Acciones comunes (copiar, limpiar, añadir) y atajos de teclado
  main.js               Arranque
  fx.js                 Escena: estrellas 3D y cometas (canvas), 3D según el scroll, inclinación con el puntero
assets/img/             Imágenes de la portada y los capítulos (WebP) y sus versiones difuminadas de fondo
scripts/build.mjs       Empaquetado en un solo archivo (CSS, JS e imágenes incluidos)
```

## Atajos

Pulsa `?` dentro de la aplicación para ver todos los atajos (`/` o `Ctrl K` abre el menú con el buscador, `Alt 1–9` para ir a una herramienta, `Alt N` para añadir fila o nueva plantilla, `Alt C` para copiar, `Alt R` para limpiar, `Alt T` para cambiar el tema…).
