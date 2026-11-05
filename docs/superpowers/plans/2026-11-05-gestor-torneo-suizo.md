# Gestor de torneos suizo (Asociación Vecinal Lucero) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una aplicación web, que funcione sin conexión, para gestionar un torneo de ajedrez por sistema suizo: inscripción, emparejamientos automáticos, resultados ronda a ronda y clasificación. Se publicará gratis en GitHub Pages.

**Architecture:** Toda la lógica del torneo es TypeScript puro en `src/torneo/`, sin DOM: los tipos, los cálculos derivados, el emparejamiento y las acciones inmutables. Las acciones reciben un `Torneo` y devuelven uno nuevo. Puntos, colores y desempates nunca se guardan: se calculan siempre a partir de las rondas. Encima va una interfaz Preact en `src/ui/`. Esa interfaz guarda el estado en `localStorage` tras cada acción. El build es una PWA estática con service worker.

**Tech Stack:** Node 26, Vite 6, TypeScript 5 (strict), Preact 10, Vitest 3, fast-check 3 (pruebas de propiedades), @testing-library/preact y jsdom, vite-plugin-pwa, @fontsource-variable/archivo y GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-05-gestor-torneo-suizo-design.md`

## Global Constraints

- Toda la interfaz, los mensajes de error y el README van en **castellano de España** (tú, nunca vos), en voz activa y en minúsculas salvo al inicio de frase.
- Coste cero: sin servidor ni base de datos. Se despliega en GitHub Pages en `https://alejandrodavidmartino.github.io/torneo-ajedrez/`, así que Vite usa `base: '/torneo-ajedrez/'`.
- Funciona sin conexión una vez cargada. La fuente Archivo va autoalojada, sin pedir nada a Google Fonts en tiempo de ejecución.
- Paleta exacta: fondo `#ffffff`, tinta `#111111`, acento `#ffd23f` y líneas finas `#bbbbbb`. Esquinas rectas, sin sombras.
- Tipografía Archivo variable: el número de ronda con `font-stretch: 62%; font-weight: 900`, los títulos y botones con `75%`/`800`, y el texto con `100%`/`400–600`.
- El logo está en `docs/assets/logo-lucero.jpg` y se copia a `public/logo-lucero.jpg`. **No puede tocar ni pisar la línea negra de 6 px de la cabecera.**
- Objetivos táctiles de 44 px o más, foco visible, contraste AA, `prefers-reduced-motion` respetado y sin scroll horizontal a 360 px.
- No hay inscripciones con el torneo empezado ni emparejamientos a mano.
- Nunca se repite rival. El color se relaja antes que la regla de no repetir.
- Rondas permitidas: de 1 a `n − 1`, siendo `n` el número de jugadores inscritos, con un mínimo de 2 jugadores.

## Review Focus

1. Recargar la página a mitad de ronda, con resultados ya marcados, deja el torneo exactamente igual. → Test en la Task 6.
2. Corregir un resultado de una ronda cerrada cambia la clasificación pero no toca los emparejamientos ya hechos. → Test en la Task 5.
3. Un nombre vacío o de solo espacios, un nombre duplicado o un ELO no numérico o negativo se rechazan con un mensaje claro y no se guardan. → Test en la Task 5.
4. Si se retira a un jugador y el número de activos pasa a impar, la siguiente ronda asigna bien el descanso, y el retirado no vuelve a aparecer. → Test en la Task 4.
5. Importar un archivo corrupto, o de otra versión, muestra un error y **no** borra el torneo actual. → Tests en las Tasks 6 y 8.

---

## Estructura de archivos

```
index.html
vite.config.ts            # base, PWA y test (jsdom)
public/logo-lucero.jpg
src/
  main.tsx                # monta <App/>
  torneo/
    tipos.ts              # tipos del dominio + ErrorTorneo
    calculos.ts           # puntos, colores, rivales, Buchholz, SB, clasificación
    emparejar.ts          # emparejarPrimera, emparejarSiguiente
    acciones.ts           # transiciones de estado inmutables
    copia.ts              # exportar/importar JSON versionado
  almacen.ts              # localStorage
  ui/
    App.tsx               # estado + vista activa
    estilos.css           # tokens y componentes Cartel de barrio + @media print
    Cabecera.tsx
    Inscripcion.tsx
    VistaRonda.tsx
    Clasificacion.tsx
    Ajustes.tsx           # copia, nuevo torneo, imprimir
tests/
  torneo/*.test.ts
  ui/*.test.tsx
.github/workflows/deploy.yml
README.md
```

---

### Task 1: Esqueleto del proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `tests/humo.test.ts`, `public/logo-lucero.jpg` (copia de `docs/assets/logo-lucero.jpg`)

**Interfaces:**
- Produces: scripts `npm run dev`, `npm test` (vitest run), `npm run build` (`tsc --noEmit && vite build`) y `npm run preview`.

- [ ] **Step 1:** Crear el proyecto con `npm create vite@latest . -- --template preact-ts`, sin borrar `docs/` ni `.gitignore`. Añadir como dependencias de desarrollo `vitest fast-check @testing-library/preact jsdom vite-plugin-pwa`, y como dependencia `@fontsource-variable/archivo`.
- [ ] **Step 2:** Configurar `vite.config.ts` con `base: '/torneo-ajedrez/'` y `test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] }`. Activar `strict: true` en tsconfig. Poner `index.html` con `lang="es"` y el título `Torneo de ajedrez · Asociación Vecinal Lucero`.
- [ ] **Step 3:** Escribir `tests/humo.test.ts` con `expect(1 + 1).toBe(2)` y ejecutar `npm test`. Resultado esperado: 1 test passed.
- [ ] **Step 4:** Ejecutar `npm run build`. Resultado esperado: se crea `dist/index.html` sin errores.
- [ ] **Step 5:** Commit: `chore: esqueleto Vite + Preact + Vitest`.

---

### Task 2: Tipos y cálculos derivados

**Files:**
- Create: `src/torneo/tipos.ts`, `src/torneo/calculos.ts`
- Test: `tests/torneo/calculos.test.ts`

**Interfaces:**
- Produces (`tipos.ts`):
```ts
export type Resultado = '1-0' | '½-½' | '0-1' | '1F-0F' | '0F-1F';  // F = incomparecencia; 1F-0F: no se presentó negras
export type Color = 'B' | 'N';
export interface Jugador { id: string; nombre: string; elo: number | null; orden: number; retirado: boolean }
export interface Mesa { numero: number; blancas: string; negras: string; resultado: Resultado | null }
export interface Ronda { numero: number; mesas: Mesa[]; descansa: string | null; cerrada: boolean }
export type Estado = 'inscripcion' | 'en-curso' | 'terminado';
export interface Torneo { version: 1; nombre: string; rondasTotales: number; semilla: number; estado: Estado; jugadores: Jugador[]; rondas: Ronda[] }
export class ErrorTorneo extends Error { constructor(public codigo: string, mensaje: string) }
```
- Produces (`calculos.ts`):
```ts
export interface Estadistica { id: string; puntos: number; buchholz: number; sonneborn: number; blancas: number; negras: number; colores: Color[]; rivales: Set<string>; descansos: number }
export function estadisticas(t: Torneo, hastaRonda?: number): Map<string, Estadistica>  // solo resultados != null
export function clasificacion(t: Torneo): { jugador: Jugador; est: Estadistica; puesto: number }[]
```

Reglas, copiadas del diseño:
- Puntos: victoria 1, tablas ½, ganar por incomparecencia 1, descanso 1.
- Las partidas por incomparecencia **no** cuentan en `blancas`/`negras`/`colores` ni en `rivales`.
- `colores` es la lista ordenada de los colores jugados.
- Buchholz es la suma de los puntos actuales de los rivales en partidas jugadas. Las rondas no jugadas (descanso o incomparecencia) aportan 0 **(decisión del plan)**.
- Sonneborn-Berger: Σ puntos del rival × (1 si gana, ½ si hay tablas) en partidas jugadas.
- Orden de la clasificación: puntos ↓, buchholz ↓, sonneborn ↓, elo ↓ (null al final) y orden ↑. Los retirados se incluyen. `puesto` es el índice + 1.

- [ ] **Step 1:** Escribir los tests con un torneo de 4 jugadores (A, B, C, D) y 2 rondas fabricado a mano:
  - R1: A–B 1-0 y C–D ½-½.
  - R2: A–C ½-½ y D–B 0F-1F (D no se presentó).
  - Comprobar:
    - `puntos` A=1.5, B=1, C=1, D=0.5.
    - `buchholz(A)` = B(1) + C(1) = 2.
    - `sonneborn(A)` = 1×1 + 0.5×1 = 1.5.
    - `B.blancas+B.negras` = 1, porque la incomparecencia no cuenta.
    - `B.rivales` = {A}.
    - el orden de `clasificacion` es A, C, B, D (C y B empatan a 1; C tiene buchholz 2 y B 1.5).
  - Añadir un test aparte para el desempate final por ELO y por orden.
- [ ] **Step 2:** Ejecutar `npm test -- calculos`. Resultado esperado: FAIL (módulo no encontrado).
- [ ] **Step 3:** Implementar `tipos.ts` y `calculos.ts`.
- [ ] **Step 4:** Ejecutar `npm test -- calculos`. Resultado esperado: PASS.
- [ ] **Step 5:** Commit: `feat(torneo): tipos y cálculo de clasificación con Buchholz y Sonneborn-Berger`.

---

### Task 3: Emparejamiento de la primera ronda

**Files:**
- Create: `src/torneo/emparejar.ts`
- Test: `tests/torneo/emparejar-primera.test.ts`

**Interfaces:**
- Consumes: los tipos de la Task 2.
- Produces: `export function emparejarPrimera(jugadores: Jugador[], semilla: number): Ronda` (devuelve `numero: 1`, `cerrada: false` y todos los resultados a `null`). También `export function rng(semilla: number): () => number`, un generador mulberry32 determinista.

Algoritmo:
- Se ordena por ELO ↓ (null al final) y por `orden` ↑.
- Si el número es impar, descansa el último de la lista.
- Con `h = n/2`, se empareja `i` con `i+h`.
- En la mesa 1, el jugador de arriba lleva blancas si `rng(semilla)() < 0.5` y negras si no. A partir de ahí se alterna mesa a mesa.

- [ ] **Step 1:** Escribir los tests:
  - Con 6 jugadores de ELO 2000…1500, las mesas son (1º,4º), (2º,5º) y (3º,6º).
  - Con 5 jugadores, descansa el de menor ELO.
  - Los jugadores sin ELO van detrás de los que lo tienen, por orden de inscripción.
  - Con la misma semilla se obtiene la misma ronda, y con dos semillas distintas cambian los colores al menos una vez entre 0 y 20.
  - Los colores de la mesa 2 son los contrarios a los de la mesa 1.
- [ ] **Step 2:** Ejecutar `npm test -- emparejar-primera`. Resultado esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Ejecutar `npm test -- emparejar-primera`. Resultado esperado: PASS.
- [ ] **Step 5:** Commit: `feat(torneo): emparejamiento de la ronda 1 por ELO`.

---

### Task 4: Emparejamiento suizo de las rondas siguientes

**Files:**
- Modify: `src/torneo/emparejar.ts`
- Test: `tests/torneo/emparejar-siguiente.test.ts`, `tests/torneo/emparejar-propiedades.test.ts`

**Interfaces:**
- Consumes: `estadisticas`, `clasificacion` (Task 2) y `Ronda` (Task 2).
- Produces: `export function emparejarSiguiente(t: Torneo): Ronda | null`. Devuelve `null` solo si no existe ningún emparejamiento sin repetir rival.

Algoritmo, que debe ser exhaustivo:

```
activos  = jugadores no retirados, ordenados por clasificación actual
colorDebe(p) = 'B' si p.negras - p.blancas >= 1 o sus 2 últimos colores son N,N
               'N' si p.blancas - p.negras >= 1 o sus 2 últimos colores son B,B
               null en otro caso
compatible(p,q, estricto) = q ∉ p.rivales && (!estricto || !(colorDebe(p) && colorDebe(p) === colorDebe(q)))
candidatosDescanso = si |activos| es impar: activos sin descansos previos, por (puntos ↑, elo ↑ null primero, orden ↓)
para estricto en [true, false]:
  para cada d en candidatosDescanso (o [null] si es par):
    lista = activos − d
    si backtrack(lista, estricto) encuentra parejas → construir Ronda y devolver
devolver null

backtrack(lista): p = primero sin emparejar; candidatos q en orden de preferencia:
  1) mismo grupo de puntos, empezando por el índice p + ⌊tamaño_grupo/2⌋ y siguiendo de forma circular dentro del grupo,
  2) después, el resto, por orden de clasificación.
  probar cada q compatible; recursión; si falla, deshacer y probar el siguiente.
```

- Asignación de colores en cada pareja:
  1. Se respeta `colorDebe` de quien lo tenga.
  2. Si no hay obligación, lleva blancas quien tenga más `negras − blancas`.
  3. Si siguen empatados, cada uno lleva el color contrario al último que jugó, empezando por el mejor clasificado.
  4. Si ninguno ha jugado todavía, el mejor clasificado lleva blancas.
- Las mesas se numeran según el puesto del mejor clasificado de cada pareja.

- [ ] **Step 1:** Escribir los tests de casos concretos:
  - Con 4 jugadores tras R1 (A gana a B y C gana a D), R2 empareja A–C y B–D.
  - Un jugador con colores B,B recibe N.
  - Con 5 activos, quien ya ha descansado no vuelve a descansar.
  - **(Review Focus 4)** Con 6 jugadores, se retira uno después de R1: R2 tiene 2 mesas y un descanso, y el retirado no aparece ni en las mesas ni en el descanso.
  - Si ninguna combinación evita repetir rival (4 jugadores tras 3 rondas, todos contra todos), devuelve `null`.
- [ ] **Step 2:** Escribir las pruebas de propiedades con fast-check:
  - Para entre 4 y 24 jugadores y entre 1 y `min(n−1, 9)` rondas, simular el torneo con resultados aleatorios y comprobar:
    - nunca se repite rival;
    - todos los activos aparecen exactamente una vez en cada ronda;
    - nadie descansa dos veces;
    - en al menos el 95 % de las ejecuciones con `rondas ≤ ⌈log2 n⌉ + 1`, se cumple que `|blancas − negras| ≤ 1` y que no hay tres colores seguidos iguales.
  - Hacer 200 ejecuciones. Además, un test de rendimiento: 40 jugadores y 9 rondas en menos de 2 s.
- [ ] **Step 3:** Ejecutar `npm test -- emparejar-s emparejar-p`. Resultado esperado: FAIL.
- [ ] **Step 4:** Implementar.
- [ ] **Step 5:** Ejecutar `npm test`. Resultado esperado: todo PASS.
- [ ] **Step 6:** Commit: `feat(torneo): emparejamiento suizo con vuelta atrás y restricciones de color`.

---

### Task 5: Acciones del torneo

**Files:**
- Create: `src/torneo/acciones.ts`
- Test: `tests/torneo/acciones.test.ts`

**Interfaces:**
- Consumes: `emparejarPrimera` y `emparejarSiguiente` (Tasks 3 y 4), y `ErrorTorneo`.
- Produces: estas funciones puras, todas con la firma `(t: Torneo, ...) => Torneo`. Ante un uso inválido lanzan `ErrorTorneo(codigo, mensaje)`.
```ts
crearTorneo(nombre: string, rondasTotales: number, semilla?: number): Torneo
inscribir(t, nombre: string, elo: string): Torneo        // elo como texto del formulario; '' => null
editarJugador(t, id: string, nombre: string, elo: string): Torneo
borrarJugador(t, id: string): Torneo
fijarRondas(t, n: number): Torneo
empezar(t): Torneo
registrarResultado(t, ronda: number, mesa: number, r: Resultado | null): Torneo
siguienteRonda(t): Torneo                                 // lanza codigo 'sin-emparejamiento'
deshacerRonda(t): Torneo
retirar(t, id: string): Torneo
reactivar(t, id: string): Torneo
terminarAntes(t): Torneo                                  // estado 'terminado', rondasTotales = rondas cerradas
avisoRondas(numJugadores: number, rondas: number): string | null
```

Reglas y textos exactos:

| Caso | Código | Mensaje |
|---|---|---|
| Nombre vacío o solo espacios | `nombre-vacio` | «Escribe el nombre del jugador.» |
| Nombre duplicado (sin distinguir mayúsculas ni espacios extremos) | `nombre-repetido` | «Ya hay un jugador con ese nombre.» |
| ELO no entero o fuera de 0–3500 | `elo-invalido` | «El ELO tiene que ser un número entre 0 y 3500, o dejarlo vacío.» |
| `inscribir`, `editar` o `borrar` fuera de `inscripcion` | `torneo-empezado` | «El torneo ya ha empezado: no se pueden cambiar los jugadores.» |
| `empezar` con menos de 2 jugadores | `pocos-jugadores` | «Hacen falta al menos 2 jugadores.» |
| `empezar` o `fijarRondas` con rondas fuera de 1…n−1 | `rondas-invalidas` | «Con N jugadores puedes jugar entre 1 y N−1 rondas.» (con los números reales) |
| `siguienteRonda` con resultados pendientes | `faltan-resultados` | «Faltan resultados por apuntar.» |
| `siguienteRonda` sin emparejamiento posible | `sin-emparejamiento` | «No hay forma de emparejar otra ronda sin repetir rivales. Puedes terminar el torneo aquí.» |

- `avisoRondas` devuelve «Con tantas rondas puede que al final no se puedan evitar rivales repetidos.» cuando `rondas > n/2`, y `null` en otro caso.
- `registrarResultado` vale en cualquier ronda, tanto abierta como cerrada (corrección). Si el resultado es una incomparecencia y la ronda es la actual, el ausente se marca `retirado: true`.
- `siguienteRonda` cierra la ronda actual. Si era la última, pasa a `terminado`; si no, crea la siguiente con `emparejarSiguiente`.
- `deshacerRonda` solo funciona si la ronda actual no tiene ningún resultado y su número es mayor que 1 (código `no-se-puede-deshacer`, mensaje «Solo puedes deshacer una ronda sin resultados.»). Elimina esa ronda y reabre la anterior (`cerrada: false`).
- Ninguna función modifica su entrada: se comprueba con `Object.freeze` profundo en los tests.

- [ ] **Step 1:** Escribir un test por cada fila de la tabla anterior, con su `codigo`, y estos otros:
  - flujo completo de 4 jugadores y 3 rondas hasta llegar a `terminado`;
  - deshacer ronda;
  - una incomparecencia retira al ausente;
  - `terminarAntes`;
  - **(Review Focus 3)** nombres `''`, `'   '` y `'ana '` cuando ya existe `'Ana'`, y ELO `'abc'`, `'-5'` y `'1500.5'`. Todos lanzan su error y el torneo sigue con la misma lista de jugadores;
  - **(Review Focus 2)** se cierra R1, se juega R2, se corrige un resultado de R1: la clasificación cambia y `t.rondas[1].mesas` es idéntica (`toEqual`) a la anterior.
- [ ] **Step 2:** Ejecutar `npm test -- acciones`. Resultado esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Ejecutar `npm test -- acciones`. Resultado esperado: PASS.
- [ ] **Step 5:** Commit: `feat(torneo): acciones del torneo con validaciones y correcciones`.

---

### Task 6: Guardado y copia de seguridad

**Files:**
- Create: `src/torneo/copia.ts`, `src/almacen.ts`
- Test: `tests/torneo/copia.test.ts`, `tests/almacen.test.ts`

**Interfaces:**
- Produces:
```ts
// copia.ts
exportar(t: Torneo): string                         // JSON con sangría 2
importar(texto: string): Torneo                     // lanza ErrorTorneo('copia-invalida', 'El archivo no es una copia válida de un torneo.')
nombreArchivo(t: Torneo, fecha: Date): string       // 'torneo-<nombre-en-minusculas-con-guiones>-AAAA-MM-DD.json'
// almacen.ts
CLAVE = 'torneo-lucero:v1'
cargar(): Torneo | null                             // null si no hay nada o si está corrupto
guardar(t: Torneo | null): void                     // null borra la clave
```
- `importar` valida que `version === 1`, todos los campos y sus tipos, que los ids de las mesas existen en `jugadores` y que los resultados son válidos.

- [ ] **Step 1:** Escribir los tests:
  - `importar(exportar(t))` devuelve algo igual a `t`;
  - `importar` falla con `'{}'`, `'no json'`, `version: 2` y una mesa con un id desconocido;
  - `nombreArchivo` aplicado a «Torneo de otoño» el 5/11/2026 da `torneo-torneo-de-otono-2026-11-05.json`;
  - **(Review Focus 1)** guardar un torneo a mitad de ronda con resultados marcados y después `cargar()` devuelve exactamente el mismo (`toEqual`);
  - `cargar()` con basura en la clave devuelve `null` sin lanzar error.
- [ ] **Step 2:** Ejecutar `npm test -- copia almacen`. Resultado esperado: FAIL.
- [ ] **Step 3:** Implementar. Envolver en try/catch todos los accesos a `localStorage`.
- [ ] **Step 4:** Ejecutar `npm test -- copia almacen`. Resultado esperado: PASS.
- [ ] **Step 5:** Commit: `feat: guardado automático y copia de seguridad en JSON`.

---

### Task 7: Estilo Cartel de barrio, cabecera e inscripción

**Files:**
- Create: `src/ui/estilos.css`, `src/ui/Cabecera.tsx`, `src/ui/Inscripcion.tsx`
- Modify: `src/ui/App.tsx`, `src/main.tsx`
- Test: `tests/ui/inscripcion.test.tsx`

**Interfaces:**
- Consumes: las acciones de la Task 5, `avisoRondas`, y `cargar` y `guardar` de la Task 6.
- Produces:
  - `App` guarda `torneo: Torneo | null` en un `useState`. Cada cambio pasa por `aplicar(fn: (t: Torneo) => Torneo)`, que captura los `ErrorTorneo`, muestra `mensaje` en un aviso `role="alert"` y llama a `guardar`.
  - `<Cabecera torneo={...}/>`
  - `<Inscripcion torneo aplicar/>`

Contenido:
- `estilos.css` define en `:root` los tokens de color y de tipografía de las Global Constraints e importa `@fontsource-variable/archivo/wdth.css`. La referencia visual es `docs/assets/boceto-estilos.html`, opción A.
- **Cabecera:** el logo a la izquierda, con un alto de 96 px en escritorio y 72 px en móvil, `display:block` y sin márgenes negativos. A la derecha, «Ronda N» en grande con «de M · <nombre>» debajo, o el nombre del torneo durante la inscripción. Abajo, `border-bottom: 6px solid var(--tinta)` y un `padding-bottom` de al menos 12 px, para que el logo no toque la línea.
- **Sin torneo:** se muestra un formulario «Nombre del torneo» y «Número de rondas», con el botón «Crear torneo».
- **Inscripción:** campos «Nombre» y «ELO (opcional)» con el botón «Añadir jugador», que también se activa con Enter. Debajo, la lista con el número, el nombre y el ELO o «sin ELO», y botones para editar y quitar. Después, el campo de rondas, `avisoRondas` si aplica y el botón principal «Empezar torneo» (negro con texto amarillo).

- [ ] **Step 1:** Escribir los tests con @testing-library/preact:
  - crear un torneo y añadir 3 jugadores hace que aparezcan 3 filas;
  - añadir «Ana» dos veces muestra un `role="alert"` con «Ya hay un jugador con ese nombre.»;
  - «Empezar torneo» con 1 jugador muestra «Hacen falta al menos 2 jugadores.»;
  - tras añadir, el foco vuelve al campo «Nombre».
- [ ] **Step 2:** Ejecutar `npm test -- inscripcion`. Resultado esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Ejecutar `npm test -- inscripcion`. Resultado esperado: PASS.
- [ ] **Step 5:** Abrir `npm run dev` con anchos de 360 px y 1280 px. Comprobar que el logo no toca la línea, que no hay scroll horizontal y que los botones miden 44 px o más.
- [ ] **Step 6:** Commit: `feat(ui): estilo Cartel de barrio, cabecera e inscripción`.

---

### Task 8: Pantalla de ronda, clasificación y ajustes

**Files:**
- Create: `src/ui/VistaRonda.tsx`, `src/ui/Clasificacion.tsx`, `src/ui/Ajustes.tsx`
- Modify: `src/ui/App.tsx`, `src/ui/estilos.css`
- Test: `tests/ui/ronda.test.tsx`, `tests/ui/ajustes.test.tsx`

**Interfaces:**
- Consumes: Tasks 2, 5, 6 y 7 (`aplicar`).
- Produces: `<VistaRonda torneo aplicar/>`, `<Clasificacion torneo/>` y `<Ajustes torneo aplicar alCargar={(t)=>void}/>`.

Contenido:
- **Ronda:** en escritorio, dos columnas: «Partidas» a la izquierda (1,6fr) y «Clasificación» a la derecha (1fr). En menos de 760 px, una sola columna.
  - Cada mesa muestra el número grande, las blancas (cuadradito vacío) y las negras (cuadradito relleno).
  - Botones de resultado `1–0`, `½`, `0–1`, con `aria-pressed`. El seleccionado se rellena de amarillo. Al pulsar el que ya está marcado, se desmarca.
  - Un menú «Más» por mesa con «No se presentó blancas» y «No se presentó negras».
  - Si hay descanso: «X descansa esta ronda y suma 1 punto.»
  - Pie: «Falta N resultado(s)» o «Todo apuntado», y el botón principal «Siguiente ronda». En la última ronda el botón dice «Terminar torneo».
  - Si la ronda no tiene resultados y no es la 1, aparece el botón «Deshacer ronda».
  - Con el error `sin-emparejamiento` se muestra el mensaje y un botón «Terminar torneo aquí», que llama a `terminarAntes`.
- **Rondas anteriores:** se pueden desplegar debajo y sus resultados se pueden corregir con los mismos botones.
- **Clasificación:** columnas `#`, Jugador, Pts, Buchholz, S-B y B/N. El primero va resaltado en amarillo y los retirados llevan «(retirado)». En cada fila hay un botón «Retirar» o «Reactivar», solo mientras el torneo está en curso.
- **Torneo terminado:** se muestra la clasificación final a ancho completo con el título «Clasificación final».
- **Ajustes:** botones «Descargar copia» (Blob con `exportar` y `nombreArchivo`), «Cargar copia» (input file con `importar`; si falla, se muestra el error y no se toca el torneo actual), «Imprimir» (`window.print()`) y «Nuevo torneo» (`confirm('¿Empezar un torneo nuevo? Descarga antes la copia si quieres conservar este.')`).

- [ ] **Step 1:** Escribir los tests:
  - con 4 jugadores y el torneo empezado hay 2 mesas;
  - «Siguiente ronda» sin resultados muestra «Faltan resultados por apuntar.»;
  - marcar 1–0 en las dos mesas y pasar de ronda lleva a «Ronda 2»;
  - pulsar `1–0` dos veces deja la mesa sin resultado;
  - retirar a un jugador muestra «(retirado)»;
  - **(Review Focus 5)** cargar un archivo con texto «hola» muestra «El archivo no es una copia válida de un torneo.» y siguen las mismas mesas.
- [ ] **Step 2:** Ejecutar `npm test -- ronda ajustes`. Resultado esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Ejecutar `npm test`. Resultado esperado: todo PASS.
- [ ] **Step 5:** Jugar un torneo completo de 7 jugadores y 4 rondas en `npm run dev`, recargando la página a mitad. Comprobar que se recupera todo y que funciona a 360 px.
- [ ] **Step 6:** Commit: `feat(ui): ronda, clasificación, correcciones y copia de seguridad`.

---

### Task 9: Impresión y funcionamiento sin conexión

**Files:**
- Modify: `src/ui/estilos.css`, `vite.config.ts`, `index.html`
- Test: `tests/ui/impresion.test.tsx`

- [ ] **Step 1:** Escribir el test: en la vista de ronda existen los elementos con clase `solo-pantalla` (botones y ajustes) y la clase `imprimible` en las secciones de partidas y clasificación.
- [ ] **Step 2:** Implementar `@media print`:
  - se ocultan `.solo-pantalla`;
  - fondo blanco, tamaño A4 vertical y la cabecera con el logo;
  - las partidas y la clasificación en páginas separadas (`break-before: page`);
  - el resultado marcado se imprime como texto, no como botón amarillo.
- [ ] **Step 3:** Configurar `vite-plugin-pwa`:
  - `registerType: 'autoUpdate'`;
  - manifest con `name: 'Torneo de ajedrez · Lucero'`, `short_name: 'Torneo Lucero'`, `lang: 'es'`, `theme_color: '#111111'`, `background_color: '#ffffff'`, `start_url` y `scope` iguales a `/torneo-ajedrez/`;
  - iconos de 192 y 512 px generados a partir del logo sobre fondo blanco;
  - workbox debe precachear los js, css, html, woff2, jpg y png.
- [ ] **Step 4:** Ejecutar `npm run build && npm run preview`. En el navegador: abrir la app, poner la red en modo sin conexión en DevTools, recargar y comprobar que carga y que la fuente Archivo se ve. Probar también la vista previa de impresión.
- [ ] **Step 5:** Ejecutar `npm test`. Resultado esperado: PASS. Commit: `feat: impresión y PWA sin conexión`.

---

### Task 10: Integración continua, despliegue y README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`
- Create: `docs/assets/captura-ronda.png`, `docs/assets/captura-movil.png`

- [ ] **Step 1:** Crear `deploy.yml`:
  - se lanza con `push` a `main` y con `pull_request`;
  - job `test`: Node 26, `npm ci`, `npm test` y `npm run build`;
  - job `deploy`, solo en `main` y después de `test`: `actions/upload-pages-artifact` con `dist` y `actions/deploy-pages`, con los permisos `pages: write` e `id-token: write`.
- [ ] **Step 2:** Escribir el README en castellano de España con:
  - título y logo;
  - una línea de qué es y para quién (la Asociación Vecinal Lucero);
  - el enlace a la demo `https://alejandrodavidmartino.github.io/torneo-ajedrez/`;
  - capturas;
  - funciones;
  - «Cómo funciona el emparejamiento» (resumen de 6.2 y de las restricciones de color);
  - los desempates;
  - el stack;
  - `npm install`, `npm run dev` y `npm test`;
  - la sección «Pruebas», que mencione las pruebas de propiedades;
  - licencia MIT, con el archivo `LICENSE`.
- [ ] **Step 3:** Hacer las capturas con la app en marcha, a 1280 px y a 375 px.
- [ ] **Step 4:** Hacer push y comprobar que el workflow pasa en verde. En el repositorio de GitHub, en Settings → Pages → Source, elegir «GitHub Actions», un paso que hace el usuario o que se hace con `gh api`. Abrir la URL publicada y comprobar que carga.
- [ ] **Step 5:** Commit: `docs: README, capturas y despliegue en GitHub Pages`.
