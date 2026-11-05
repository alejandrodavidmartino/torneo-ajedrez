import { crearTorneo, empezar, inscribir, registrarResultado } from '../../src/torneo/acciones';
import { emparejarPrimera, emparejarSiguiente, rng } from '../../src/torneo/emparejar';
import type { Jugador, Mesa, Resultado, Ronda, Torneo } from '../../src/torneo/tipos';

export const jug = (id: string, orden: number, elo: number | null = null): Jugador => ({
  id, nombre: id, elo, orden, retirado: false,
});

export function torneo(jugadores: Jugador[], rondas: Ronda[], rondasTotales = 5): Torneo {
  return { version: 1, nombre: 'Prueba', rondasTotales, semilla: 1, estado: 'en-curso', jugadores, rondas };
}

export function ronda(numero: number, mesas: [string, string, Resultado][], descansa: string | null = null): Ronda {
  return {
    numero, descansa, cerrada: true,
    mesas: mesas.map(([blancas, negras, resultado], i): Mesa => ({ numero: i + 1, blancas, negras, resultado })),
  };
}

const RES: Resultado[] = ['1-0', '½-½', '0-1'];

/**
 * Simula un torneo de `n` jugadores con resultados aleatorios.
 * Devuelve el torneo y cuántas rondas se pudieron emparejar.
 */
export function simular(n: number, rondas: number, semilla: number): Torneo {
  const azar = rng(semilla);
  const jugadores = Array.from({ length: n }, (_, i) =>
    jug(`j${i + 1}`, i + 1, azar() < 0.2 ? null : 1200 + Math.floor(azar() * 1000)),
  );
  const t = torneo(jugadores, [], rondas);
  let actual: Ronda | null = emparejarPrimera(jugadores, semilla);
  while (actual) {
    for (const m of actual.mesas) m.resultado = RES[Math.floor(azar() * 3)];
    actual.cerrada = true;
    t.rondas.push(actual);
    if (t.rondas.length >= rondas) break;
    actual = emparejarSiguiente(t);
  }
  return t;
}

/** Torneo de 5 jugadores en la ronda 1 con un resultado apuntado. */
export function torneoEnCurso(): Torneo {
  let t = crearTorneo('Torneo de otoño', 3, 5);
  for (const [n, e] of [['Ana', '1650'], ['Luis', ''], ['Marta', '1500'], ['Jorge', '1400'], ['Pilar', '']]) t = inscribir(t, n, e);
  t = empezar(t);
  return registrarResultado(t, 1, 1, '½-½');
}

