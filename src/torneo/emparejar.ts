import type { Jugador, Mesa, Ronda } from './tipos';

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
