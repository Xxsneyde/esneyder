# MYBT · Herramientas BodyTech

Aplicación web (HTML, CSS y JavaScript, sin dependencias) con las herramientas de apoyo para novedades, cambios de plan, fechas y plantillas propias, y **Navecita**, el juego de la navecita de los Nokia.

El diseño es una sola página con scroll continuo, estilo «scrollytelling»: una portada 3D fijada al scroll, un índice de capítulos y seis capítulos (uno por grupo de herramientas y uno de Arcade) con escenas 3D, imágenes con parallax y un cielo estrellado animado que avanza al hacer scroll. El menú no ocupa espacio fijo: es un botón flotante **Menú** que se esconde al bajar y vuelve al subir (o al acercar el puntero arriba); al abrirlo cubre la pantalla y lleva directo a cualquier herramienta. Con «reducir movimiento» activado en el sistema, las animaciones se desactivan.

**Ajustes** (botón ⚙ arriba, en el menú o `Alt S`):
- **Paleta de colores:** Negro (predeterminada), Blanco, Azul noche, Violeta, Esmeralda, Atardecer y Rosa. `Alt T` cambia entre Blanco y la última paleta oscura.
- **Efectos visuales:** Completos, Ligeros (menos estrellas, 30 fps, sin cometas ni inclinación; para equipos lentos) o Sin animación.

## Uso

- **Desarrollo:** abre `index.html` directamente en el navegador (funciona también con `file://`).
- **Archivo único para compartir:** `node scripts/build.mjs` genera `dist/mybt.html`, con todo el CSS y JS incluidos.

Los datos (calculadoras, tabla de valores, plantillas, paleta, nivel de efectos y última herramienta usada) se guardan en `localStorage` del navegador. En **Plantillas → ⋯** puedes exportar o importar una copia de seguridad en JSON.

## Estructura

```
index.html              Marcado de todas las secciones, diálogos e iconos (sprite SVG)
assets/css/
  tokens.css            Colores de cada paleta, tipografía, radios, sombras y movimiento
  base.css              Reset y elementos base
  layout.css            Cielo, botón flotante (HUD), menú desplegable a pantalla completa y flujo de la página
  scenes.css            Portada 3D, índice, capítulos, orbe y cubo 3D, final, cristal y aparición al hacer scroll
  components.css        Botones, tarjetas, campos, chips, diálogos, menús, toast, estados vacíos
  tools.css             Estilos propios de calculadoras y tabla de valores
  templates.css         Sección Plantillas
  game.css              Navecita: celular, pantalla LCD y teclado
assets/js/              (scripts clásicos, cargados en este orden)
  utils.js              DOM, fechas UTC, formato, búsqueda sin tildes, almacenamiento
  ui.js                 Toast, portapapeles, diálogos animados, confirmación, paletas, menús
  generators.js         Textos de novedades y cálculos simples (saldo, 3.ª congelación)
  nav.js                Scroll a cada herramienta, herramienta actual según el scroll, menú desplegable y su buscador
  calculators.js        Fecha final, días entre fechas, prorrateos, tabla de valores, selector de plan
  templates.js          Plantillas: crear, editar, eliminar, buscar, filtrar, ordenar, importar/exportar
  game.js               Navecita: pantalla LCD 168×96, niveles con jefes, premios, récord, sonidos y teclado de celular
  actions.js            Acciones comunes (copiar, limpiar, añadir) y atajos de teclado
  main.js               Arranque
  fx.js                 Escena: estrellas 3D y cometas (canvas), 3D según el scroll, inclinación, ondas al pulsar, niveles de efectos
  settings.js           Diálogo de Ajustes: paleta de colores y efectos visuales
assets/img/             Imágenes de la portada y los capítulos (WebP) y sus versiones difuminadas de fondo
scripts/build.mjs       Empaquetado en un solo archivo (CSS, JS e imágenes incluidos)
```

## Navecita

Flechas o `2 4 6 8` para moverte, `Espacio` o `5` para disparar (mantén presionado), `X` o `0` para lanzar un misil, `P` para pausar y `M` para el sonido. En el celular se juega con las teclas dibujadas. El juego se pausa solo al salir de la pantalla, y el récord se guarda en el navegador. Premios: **M** +3 misiles, **R** disparo triple, **V** vida extra.

## Atajos

Pulsa `?` dentro de la aplicación para ver todos los atajos (`/` o `Ctrl K` abre el menú con el buscador, `Alt 1–9` para ir a una herramienta, `Alt N` para añadir fila o nueva plantilla, `Alt C` para copiar, `Alt R` para limpiar, `Alt T` para cambiar el tema…).
