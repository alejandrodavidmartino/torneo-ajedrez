import { clasificacion, estadisticas, type Estadistica } from './calculos';
import type { Color, Jugador, Mesa, Ronda, Torneo } from './tipos';

/** Generador pseudoaleatorio determinista (mulberry32). */
export function rng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Orden inicial: ELO de mayor a menor (sin ELO al final) y orden de inscripción. */
export function ordenInicial(jugadores: Jugador[]): Jugador[] {
  return [...jugadores].sort((a, b) => (b.elo ?? -1) - (a.elo ?? -1) || a.orden - b.orden);
}

export function emparejarPrimera(jugadores: Jugador[], semilla: number): Ronda {
  const lista = ordenInicial(jugadores);
  const descansa = lista.length % 2 === 1 ? lista.pop()!.id : null;
  const h = lista.length / 2;
  const arribaBlancasEnMesa1 = rng(semilla)() < 0.5;
  const mesas: Mesa[] = [];
  for (let i = 0; i < h; i++) {
    const arriba = lista[i].id;
    const abajo = lista[i + h].id;
    const arribaBlancas = i % 2 === 0 ? arribaBlancasEnMesa1 : !arribaBlancasEnMesa1;
    mesas.push({
      numero: i + 1,
      blancas: arribaBlancas ? arriba : abajo,
      negras: arribaBlancas ? abajo : arriba,
      resultado: null,
    });
  }
  return { numero: 1, mesas, descansa, cerrada: false };
}

/** Color que un jugador está obligado a llevar, o null si puede llevar cualquiera. */
export function colorDebe(e: Estadistica): Color | null {
  const [penultimo, ultimo] = e.colores.slice(-2);
  if (e.colores.length >= 2 && penultimo === ultimo) return ultimo === 'B' ? 'N' : 'B';
  const diferencia = e.blancas - e.negras;
  if (diferencia >= 1) return 'N';
  if (diferencia <= -1) return 'B';
  return null;
}

/** Decide quién lleva blancas. `p` es el mejor clasificado de los dos. */
function asignarColores(p: string, q: string, ep: Estadistica, eq: Estadistica): [string, string] {
  const dp = colorDebe(ep);
  const dq = colorDebe(eq);
  if (dp) return dp === 'B' ? [p, q] : [q, p];
  if (dq) return dq === 'B' ? [q, p] : [p, q];
  const desequilibrioP = ep.negras - ep.blancas;
  const desequilibrioQ = eq.negras - eq.blancas;
  if (desequilibrioP !== desequilibrioQ) return desequilibrioP > desequilibrioQ ? [p, q] : [q, p];
  const ultimoP = ep.colores.at(-1);
  if (ultimoP) return ultimoP === 'N' ? [p, q] : [q, p];
  const ultimoQ = eq.colores.at(-1);
  if (ultimoQ) return ultimoQ === 'N' ? [q, p] : [p, q];
  return [p, q];
}

/**
 * Empareja la siguiente ronda por sistema suizo.
 * Búsqueda exhaustiva con vuelta atrás: si existe un emparejamiento sin rivales
 * repetidos, lo encuentra. Primero intenta respetar las reglas de color; si no
 * es posible, las relaja, pero nunca repite rival. Devuelve null si no hay forma.
 */
export function emparejarSiguiente(t: Torneo): Ronda | null {
  const est = estadisticas(t);
  const orden = clasificacion(t).filter((f) => !f.jugador.retirado);
  const rango = new Map(orden.map((f, i) => [f.jugador.id, i]));
  const activos = orden.map((f) => f.jugador.id);

  let candidatosDescanso: (string | null)[] = [null];
  if (activos.length % 2 === 1) {
    candidatosDescanso = orden
      .filter((f) => f.est.descansos === 0)
      .sort((a, b) =>
        a.est.puntos - b.est.puntos ||
        (a.jugador.elo ?? -1) - (b.jugador.elo ?? -1) ||
        b.jugador.orden - a.jugador.orden,
      )
      .map((f) => f.jugador.id);
  }

  for (const estricto of [true, false]) {
    for (const descansa of candidatosDescanso) {
      const lista = activos.filter((id) => id !== descansa);
      const parejas = buscarParejas(lista, est, estricto);
      if (parejas) return construirRonda(t.rondas.length + 1, parejas, descansa, est, rango);
    }
  }
  return null;
}

function compatibles(p: Estadistica, q: Estadistica, estricto: boolean): boolean {
  if (p.rivales.has(q.id)) return false;
  if (!estricto) return true;
  const dp = colorDebe(p);
  return !(dp && dp === colorDebe(q));
}

/** `lista` va ordenada por clasificación. Devuelve parejas [mejor, peor] o null. */
function buscarParejas(lista: string[], est: Map<string, Estadistica>, estricto: boolean): [string, string][] | null {
  const fallidos = new Set<string>();

  function buscar(libres: string[]): [string, string][] | null {
    if (libres.length === 0) return [];
    const clave = libres.join(',');
    if (fallidos.has(clave)) return null;
    const [p, ...resto] = libres;
    const ep = est.get(p)!;
    for (const q of candidatos(p, resto, est)) {
      if (!compatibles(ep, est.get(q)!, estricto)) continue;
      const sub = buscar(resto.filter((x) => x !== q));
      if (sub) return [[p, q], ...sub];
    }
    fallidos.add(clave);
    return null;
  }

  return buscar(lista);
}

/** Preferencia de rivales: mitad de arriba contra mitad de abajo de su grupo de puntos, luego el resto. */
function candidatos(p: string, resto: string[], est: Map<string, Estadistica>): string[] {
  const puntos = est.get(p)!.puntos;
  const grupo = [p, ...resto.filter((x) => est.get(x)!.puntos === puntos)];
  const inicio = Math.floor(grupo.length / 2);
  const delGrupo: string[] = [];
  for (let k = 0; k < grupo.length - 1; k++) {
    const idx = 1 + ((inicio - 1 + k) % (grupo.length - 1));
    delGrupo.push(grupo[idx]);
  }
  const fuera = resto.filter((x) => est.get(x)!.puntos !== puntos);
  return [...delGrupo, ...fuera];
}

function construirRonda(
  numero: number,
  parejas: [string, string][],
  descansa: string | null,
  est: Map<string, Estadistica>,
  rango: Map<string, number>,
): Ronda {
  const mesas: Mesa[] = parejas
    .map(([a, b]) => (rango.get(a)! < rango.get(b)! ? [a, b] : [b, a]) as [string, string])
    .sort((x, y) => rango.get(x[0])! - rango.get(y[0])!)
    .map(([p, q], i) => {
      const [blancas, negras] = asignarColores(p, q, est.get(p)!, est.get(q)!);
      return { numero: i + 1, blancas, negras, resultado: null };
    });
  return { numero, mesas, descansa, cerrada: false };
}
