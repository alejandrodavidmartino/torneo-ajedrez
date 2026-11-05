# Gestor de torneos de ajedrez suizo — Asociación Vecinal Lucero

Documento de diseño · 5 de noviembre de 2026

> Las decisiones marcadas como **(decisión de Claude)** las tomó el asistente porque el usuario delegó o dijo que le daba igual. El resto las decidió el usuario.

## 1. Intención y por qué

La Asociación Vecinal Lucero organiza torneos de ajedrez en el barrio y necesita una herramienta para gestionarlos el día del torneo. La va a manejar **una sola persona, el organizador**. No es programador, pero se desenvuelve con la tecnología y conoce lo básico del sistema suizo. Los jugadores no usan la aplicación: el organizador anuncia los emparejamientos o los imprime.

Además es un **proyecto de portafolio** del autor, así que el código, las pruebas y el README tienen que estar cuidados. El README contará que se usó en un torneo real.

## 2. Objetivos

- Que el organizador cree un torneo, inscriba a los jugadores con nombre y ELO, y elija el número de rondas.
- Que la aplicación haga los emparejamientos de cada ronda con el **sistema suizo**, sin que el organizador tenga que pensarlos.
- Que se carguen los resultados de cada partida y se avance ronda a ronda.
- Que los colores (blancas y negras) queden equilibrados entre todos los jugadores.
- Que la clasificación del torneo se vea en todo momento.
- Que funcione en el móvil y en el ordenador, **sin internet** y **sin coste**.

## 3. Lo que no es (no objetivos)

- No calcula ni actualiza ELO.
- No tiene cuentas de usuario ni inicio de sesión.
- No es una herramienta federativa oficial (no exporta a FIDE/TRF ni cumple las reglas de homologación).
- Los jugadores no ven la aplicación desde sus móviles. Queda como posible mejora futura, no se hace ahora.
- No necesita servidor ni base de datos.
- **No se admiten inscripciones con el torneo empezado** (decisión del usuario).
- **No se pueden cambiar emparejamientos a mano**: siempre los hace la aplicación (decisión del usuario).

## 4. Antiobjetivos (fallaría aunque "funcione")

- Que empareje dos veces a los mismos rivales.
- Que el organizador pierda el torneo a mitad por cerrar el navegador o recargar la página.
- Que haya que entender el algoritmo para usarla, o que sea fácil equivocarse al cargar un resultado sin poder corregirlo.
- Que cueste dinero o dependa de internet el día del torneo.
- Textos en español latino: la interfaz va en **castellano de España**.

## 5. Restricciones

- **Coste cero:** se aloja en GitHub Pages, en un repositorio público.
- **Sin conexión:** una vez cargada, la aplicación funciona sin internet. Es una PWA con service worker y se puede instalar en el móvil.
- **Datos locales:** el estado del torneo se guarda en el propio navegador (localStorage o IndexedDB) y se guarda solo tras cada acción.
- **Dispositivos:** móvil (desde 360 px de ancho) y ordenador. Táctil y ratón.
- **Idioma:** castellano de España en toda la interfaz y en el README.
- **Identidad:** lleva el logo de la Asociación Vecinal Lucero (`docs/assets/logo-lucero.jpg`, negro sobre blanco).

## 6. Funcionamiento

### 6.1 Flujo

1. **Crear torneo:** nombre del torneo (por ejemplo "Torneo de otoño") y número de rondas.
2. **Inscripción:** se añaden jugadores con nombre (obligatorio) y ELO (opcional). Se pueden editar y borrar hasta que empieza el torneo.
3. **Empezar torneo:** se genera la ronda 1.
4. **Cada ronda:** se ven las mesas con las blancas y las negras. En cada mesa se marca 1–0, ½–½ o 0–1. Hasta que no estén todos los resultados no se puede pasar a la siguiente ronda. Mientras la ronda está abierta, cualquier resultado se puede cambiar.
5. **Siguiente ronda:** se cierra la ronda actual y se empareja la siguiente.
6. **Fin:** tras la última ronda se muestra la clasificación final.

### 6.2 Emparejamiento suizo

- **Ronda 1:** se ordena a los jugadores por ELO de mayor a menor. Los que no tienen ELO van al final, por orden de inscripción. Se divide la lista en dos mitades y se empareja la mitad de arriba con la de abajo (1 contra n/2+1, etc.). Los colores de la mesa 1 se sortean **(decisión de Claude)** y después se van alternando por mesas.
- **Rondas siguientes:** se agrupa a los jugadores por puntuación y se empareja dentro de cada grupo, de la parte de arriba con la de abajo. Si no se puede, el jugador sobrante baja al grupo siguiente.
- **Restricciones duras:**
  - Nunca repetir rival.
  - Un jugador no recibe dos veces el descanso.
- **Restricciones de color (decisión de Claude, el usuario delegó):**
  - Al final del torneo, la diferencia entre las partidas con blancas y con negras de cada jugador es como mucho de 1.
  - Ningún jugador juega tres partidas seguidas con el mismo color.
  - Cuando se pueda, cada jugador recibe el color que le toca para equilibrar.
- Se sigue el espíritu del sistema holandés de la FIDE, **simplificado (decisión de Claude)**. No hace falta cumplir la norma al pie de la letra, pero sí todas las restricciones anteriores. Si no existe ningún emparejamiento que cumpla las restricciones de color, se relajan las de color y **nunca** la de no repetir rival.

- **Si no existe ningún emparejamiento sin repetir rival (decisión de Claude):** la búsqueda tiene que ser exhaustiva (con vuelta atrás o un algoritmo de emparejamiento máximo), de modo que si existe un emparejamiento válido, se encuentra. Al crear el torneo, el número de rondas no puede superar n−1, y si se acerca a ese límite se muestra un aviso. Si aun así una ronda no se puede emparejar, la app lo explica y ofrece terminar el torneo en la ronda anterior.

### 6.2.1 Incomparecencias (decisión de Claude)

Además de 1–0, ½–½ y 0–1, una mesa admite **incomparecencia** (gana el presente, 1F–0F). La partida no cuenta como jugada:
- no suma a los colores;
- los dos jugadores **no** cuentan como rivales ya enfrentados;
- para Buchholz y Sonneborn-Berger, el punto se trata igual que un descanso.

Un jugador que no se presenta queda como retirado, aunque se puede reactivar.

### 6.2.2 Corregir resultados de rondas cerradas (decisión de Claude)

Se puede corregir el resultado de cualquier ronda ya cerrada. La clasificación se recalcula, pero los emparejamientos ya hechos se mantienen. Además, mientras la ronda en curso no tenga ningún resultado, hay un botón **Deshacer ronda** que la borra y reabre la anterior. Por eso el estado se guarda como rondas con resultados editables, y puntos, colores y desempates se calculan siempre a partir de ellas, nunca se acumulan.

### 6.3 Descanso con número impar (decisión de Claude)

Descansa el jugador con menos puntos que todavía no haya descansado. Si hay empate, el de menor ELO o, sin ELO, el último inscrito. El descanso suma **1 punto** y no cuenta como partida con blancas ni con negras.

### 6.4 Retiradas (decisión de Claude)

Se puede retirar a un jugador en cualquier momento entre rondas. Conserva sus puntos y sigue en la clasificación (marcado como retirado), pero ya no entra en los emparejamientos siguientes.

### 6.5 Clasificación

Se ordena por:

1. Puntos.
2. **Buchholz:** suma de las puntuaciones de los rivales **(decisión de Claude)**.
3. **Sonneborn-Berger** **(decisión de Claude)**.
4. ELO.
5. Orden de inscripción.

La tabla muestra posición, nombre, puntos, Buchholz, Sonneborn-Berger y partidas con blancas y con negras. Se ve en la pantalla de ronda (al lado en el ordenador, debajo en el móvil) y en su propia vista.

### 6.6 Persistencia y copia de seguridad (decisión de Claude)

- Se guarda solo tras cada cambio. Al abrir la aplicación, se recupera el torneo en curso.
- Un botón **Descargar copia** exporta el torneo a un archivo JSON y otro **Cargar copia** lo importa. Sirve para pasar el torneo de un aparato a otro.
- Un solo torneo activo a la vez. Empezar uno nuevo pide confirmación y sugiere descargar antes la copia del anterior.

### 6.7 Imprimir (decisión de Claude)

Hay vistas preparadas para imprimir (CSS de impresión) de los emparejamientos de la ronda actual y de la clasificación, para colgarlas en la pared.

## 7. Diseño visual: estilo "Cartel de barrio" (elegido por el usuario)

El boceto de referencia está en `docs/assets/boceto-estilos.html` (opción A). La idea es la de un cartel de barrio en blanco y negro, como el logo, con letra grande que se lea de lejos.

- **Paleta:**

  | Uso | Color |
  |---|---|
  | Fondo | `#ffffff` |
  | Tinta (texto, líneas gruesas y botón principal) | `#111111` |
  | Amarillo señal: único acento, para el resultado marcado, el líder y el texto del botón principal | `#ffd23f` |
  | Líneas finas de tabla | `#bbbbbb` |

- **Tipografía:** Archivo (Google Fonts, variable en anchura y peso), autoalojada para que funcione sin conexión.
  - Número de ronda gigante: anchura 62 %, peso 900.
  - Títulos y botones: anchura 75 %, peso 800.
  - Texto: anchura 100 %, peso 400–600.
- **Estructura:** cabecera con el logo a la izquierda y "Ronda N" enorme a la derecha, separados del contenido por una línea negra de 6 px. **El logo no puede tocar ni pisar esa línea** (requisito del usuario). Las mesas se separan con líneas negras de 2 px y el número de mesa va en letra condensada grande.
- **Colores de pieza:** un cuadradito con borde negro, vacío para blancas y relleno para negras.
- **Botones de resultado:** rectángulos con borde negro de 2 px. El seleccionado se rellena de amarillo. El botón "Siguiente ronda" es negro con texto amarillo.
- **Esquinas:** rectas, sin redondeo y sin sombras.
- **Mínimos:** objetivos táctiles de al menos 44 px en el móvil, foco visible con teclado, contraste AA y respeto de `prefers-reduced-motion`.

## 8. Calidad para el portafolio

- La lógica del torneo (emparejamiento, desempates, descanso, colores) va en un **módulo puro, independiente de la interfaz**, con **pruebas automáticas**. Entre ellas, pruebas de propiedades que simulan torneos aleatorios y comprueban que nunca se repite rival y que se cumplen las reglas de color.
- Integración continua en GitHub Actions: pruebas y build en cada push, y despliegue automático a GitHub Pages desde `main`.
- README en castellano con capturas, enlace a la demo, explicación del algoritmo y contexto real (Asociación Vecinal Lucero).

## 9. Queda a criterio de quien lo construya

- El framework y las herramientas concretas (la sugerencia es TypeScript + Vite, con un framework ligero o sin él) y la librería de pruebas.
- El modelo de datos interno y el formato exacto del JSON de copia, que debe llevar un número de versión.
- El algoritmo exacto de emparejamiento, siempre que cumpla las restricciones de 6.2 y sea determinista con la misma semilla.
- Los textos de la interfaz, en castellano de España, cortos y en voz activa.
