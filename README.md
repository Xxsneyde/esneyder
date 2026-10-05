# MYBT · Herramientas BodyTech

Aplicación web (HTML, CSS y JavaScript, sin dependencias) con las herramientas de apoyo para novedades, cambios de plan, fechas, respuestas PQR y plantillas propias.

## Uso

- **Desarrollo:** abre `index.html` directamente en el navegador (funciona también con `file://`).
- **Archivo único para compartir:** `node scripts/build.mjs` genera `dist/mybt.html`, con todo el CSS y JS incluidos.

Los datos (calculadoras, tabla de valores, plantillas, tema y última sección) se guardan en `localStorage` del navegador. En **Plantillas → ⋯** puedes exportar o importar una copia de seguridad en JSON.

## Estructura

```
index.html              Marcado de todas las secciones, diálogos e iconos (sprite SVG)
assets/css/
  tokens.css            Colores, tipografía, radios, sombras y movimiento (claro / oscuro)
  base.css              Reset y elementos base
  layout.css            Barra lateral, barra superior móvil, página y transiciones de sección
  components.css        Botones, tarjetas, campos, chips, diálogos, menús, toast, estados vacíos
  tools.css             Estilos propios de calculadoras, tabla de valores y PQR
  templates.css         Sección Plantillas
assets/js/              (scripts clásicos, cargados en este orden)
  utils.js              DOM, fechas UTC, formato, búsqueda sin tildes, almacenamiento
  ui.js                 Toast, portapapeles, diálogos animados, confirmación, tema, menús
  generators.js         Textos de novedades y cálculos simples (saldo, 3.ª congelación)
  nav.js                Navegación entre secciones y buscador del menú
  calculators.js        Fecha final, días entre fechas, prorrateos, tabla de valores, selector de plan
  pqr.js                Respuestas PQR predefinidas
  templates.js          Plantillas: crear, editar, eliminar, buscar, filtrar, ordenar, importar/exportar
  actions.js            Acciones comunes (copiar, limpiar, añadir) y atajos de teclado
  main.js               Arranque
scripts/build.mjs       Empaquetado en un solo archivo
```

## Atajos

Pulsa `?` dentro de la aplicación para ver todos los atajos (`/` o `Ctrl K` para buscar, `Alt 1–9` para ir a una herramienta, `Alt N` para añadir fila o nueva plantilla, `Alt C` para copiar, `Alt R` para limpiar, `Alt T` para cambiar el tema…).
